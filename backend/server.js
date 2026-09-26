const helmet = require('helmet')
const path = require('path')
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const pool = require('./config/db')
const { ensureSchema } = require('./config/schema')

const app = express()

app.use(helmet())

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json({ limit: '5mb' }))

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

app.use('/api', apiLimiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
})
app.use(morgan('dev'))

// ---------------------------------------------------------------------------
// Field mapping helpers (camelCase ↔ snake_case)
// ---------------------------------------------------------------------------

const LOST_MAP = {
  itemName: 'item_name',
  dateLost: 'date_lost',
  imageData: 'image_data',
  userId: 'user_id',
}

const FOUND_MAP = {
  itemName: 'item_name',
  dateFound: 'date_found',
  imageData: 'image_data',
  userId: 'user_id',
}

function toCamelCase(row, map) {
  if (!row) return row
  const out = {}
  const reverse = Object.fromEntries(Object.entries(map).map(([c, s]) => [s, c]))
  for (const key of Object.keys(row)) {
    const prop = reverse[key] || key
    out[prop] = row[key]
  }
  return out
}

function toCamelCaseList(rows, map) {
  return rows.map((r) => toCamelCase(r, map))
}

// ---------------------------------------------------------------------------
// Authentication (JWT in an httpOnly cookie)
// ---------------------------------------------------------------------------

// Fail fast in production: never fall back to the development secret.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required when NODE_ENV=production.')
  process.exit(1)
}

const JWT_SECRET = process.env.JWT_SECRET
const COOKIE_NAME = 'campusfind_token'
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'none',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: TOKEN_MAX_AGE_MS,
}

function parseCookies(req) {
  const cookies = {}
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const key = part.slice(0, eq).trim()
    const value = part.slice(eq + 1).trim()
    if (key) cookies[key] = decodeURIComponent(value)
  }
  return cookies
}

function toSafeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  }
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS)
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: undefined })
}

async function requireAuth(req, res, next) {
  try {
    const token = parseCookies(req)[COOKIE_NAME]
    if (!token) {
      return res.status(401).json({ message: 'Please log in to continue.' })
    }

    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json({ message: 'Please log in to continue.' })
    }

    const result = await pool.query(
      'SELECT id, name, email, token_version, created_at FROM users WHERE id = $1',
      [payload.sub]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Please log in to continue.' })
    }
    // Reject tokens issued before the latest logout (session invalidation).
    if (Number(result.rows[0].token_version) !== Number(payload.ver)) {
      return res.status(401).json({ message: 'Please log in to continue.' })
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    console.error('Authentication error:', error.message)
    res.status(500).json({ message: 'Authentication check failed.' })
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegister(body) {
  const errors = {}
  body = body || {}

  if (typeof body.name !== 'string' || !body.name.trim()) {
    errors.name = 'Full name is required.'
  } else if (body.name.trim().length > 120) {
    errors.name = 'Full name must be 120 characters or fewer.'
  }

  if (typeof body.email !== 'string' || !body.email.trim()) {
    errors.email = 'Email is required.'
  } else if (body.email.trim().length > 255) {
    errors.email = 'Email must be 255 characters or fewer.'
  } else if (!EMAIL_RE.test(body.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (typeof body.password !== 'string' || body.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

function validateLogin(body) {
  const errors = {}
  body = body || {}
  if (typeof body.email !== 'string' || !body.email.trim()) {
    errors.email = 'Email is required.'
  }
  if (typeof body.password !== 'string' || !body.password) {
    errors.password = 'Password is required.'
  }
  return errors
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const errors = validateRegister(req.body)
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  const name = req.body.name.trim()
  const email = req.body.email.trim().toLowerCase()

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10)
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at, token_version`,
      [name, email, passwordHash]
    )

    const token = jwt.sign(
      { sub: result.rows[0].id, ver: result.rows[0].token_version },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    setAuthCookie(res, token)

    res.status(201).json({
      message: 'Account created successfully!',
      user: toSafeUser(result.rows[0]),
    })
  } catch (error) {
    console.error('Registration error:', error.message)
    res.status(500).json({ message: 'Failed to create account' })
  }
})

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const errors = validateLogin(req.body)
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  const email = req.body.email.trim().toLowerCase()

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, created_at, token_version FROM users WHERE email = $1',
      [email]
    )
    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const matches = await bcrypt.compare(req.body.password, user.password_hash)
    if (!matches) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = jwt.sign(
      { sub: user.id, ver: user.token_version },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    setAuthCookie(res, token)

    res.json({ message: 'Logged in successfully!', user: toSafeUser(user) })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ message: 'Failed to log in' })
  }
})

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE users
       SET token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.user.id]
    )
  } catch (error) {
    console.error('Logout error:', error.message)
    return res.status(500).json({ message: 'Failed to log out' })
  }
  clearAuthCookie(res)
  res.json({ message: 'Logged out successfully!' })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: toSafeUser(req.user) })
})

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

// These match the database column definitions (see config/schema.js).
// Keep overlong input out of PostgreSQL so it becomes a clean 400.
const ITEM_NAME_MAX = 100
const ITEM_CATEGORY_MAX = 50
const ITEM_LOCATION_MAX = 150
const ITEM_CONTACT_MAX = 100

function validateItem(body, dateField) {
  const errors = {}

  if (!body.itemName || typeof body.itemName !== 'string' || !body.itemName.trim()) {
    errors.itemName = 'Item name is required.'
  } else if (body.itemName.trim().length > ITEM_NAME_MAX) {
    errors.itemName = `Item name must be ${ITEM_NAME_MAX} characters or fewer.`
  }

  if (!body.category || typeof body.category !== 'string' || !body.category.trim()) {
    errors.category = 'Category is required.'
  } else if (body.category.trim().length > ITEM_CATEGORY_MAX) {
    errors.category = `Category must be ${ITEM_CATEGORY_MAX} characters or fewer.`
  }

  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
    errors.description = 'Description is required.'
  }

  if (!body.location || typeof body.location !== 'string' || !body.location.trim()) {
    errors.location = 'Location is required.'
  } else if (body.location.trim().length > ITEM_LOCATION_MAX) {
    errors.location = `Location must be ${ITEM_LOCATION_MAX} characters or fewer.`
  }

  if (!body[dateField]) {
    errors[dateField] = `${dateField === 'dateLost' ? 'Date lost' : 'Date found'} is required.`
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(body[dateField])) {
    errors[dateField] = 'Date must be in YYYY-MM-DD format.'
  }

  if (!body.contact || typeof body.contact !== 'string' || !body.contact.trim()) {
    errors.contact = 'Contact details are required.'
  } else if (body.contact.trim().length > ITEM_CONTACT_MAX) {
    errors.contact = `Contact details must be ${ITEM_CONTACT_MAX} characters or fewer.`
  }

  if (body.imageData !== undefined && body.imageData !== null && body.imageData !== '') {
    if (typeof body.imageData !== 'string') {
      errors.imageData = 'Image data must be a string.'
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Recovery request helpers (camelCase responses, status workflow)
// ---------------------------------------------------------------------------

const RECOVERY_SELECT = `
  SELECT rr.id, rr.lost_item_id, rr.found_item_id,
         rr.claimant_name, rr.claimant_contact, rr.claimant_email,
         rr.claimant_message, rr.claimant_user_id, rr.status,
         rr.proof_images,
         to_char(rr.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
         to_char(rr.updated_at, 'YYYY-MM-DD HH24:MI') AS updated_at,
         li.item_name AS lost_item_name, li.category AS lost_item_category,
         li.location AS lost_item_location,
         li.user_id AS lost_owner_id,
         fi.item_name AS found_item_name, fi.category AS found_item_category,
         fi.location AS found_item_location
  FROM recovery_requests rr
  JOIN lost_items li ON li.id = rr.lost_item_id
  JOIN found_items fi ON fi.id = rr.found_item_id
`

const RECOVERY_STATUSES = new Set(['pending', 'approved', 'rejected', 'recovered'])

// Only these forward transitions are allowed; a recovered request is final.
const RECOVERY_TRANSITIONS = {
  pending: ['approved', 'rejected'],
  approved: ['recovered'],
  rejected: [],
  recovered: [],
}

function toRecoveryRequest(row) {
  if (!row) return row
  return {
    id: row.id,
    lostItemId: row.lost_item_id,
    foundItemId: row.found_item_id,
    claimantName: row.claimant_name,
    claimantContact: row.claimant_contact,
    claimantEmail: row.claimant_email || '',
    claimantPhone: row.claimant_contact || '',
    claimantMessage: row.claimant_message,
    claimantUserId: row.claimant_user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    proofImages: row.proof_images || [],
    lostOwnerId: row.lost_owner_id,
    lostItem: {
      id: row.lost_item_id,
      itemName: row.lost_item_name,
      category: row.lost_item_category,
      location: row.lost_item_location,
    },
    foundItem: {
      id: row.found_item_id,
      itemName: row.found_item_name,
      category: row.found_item_category,
      location: row.found_item_location,
    },
  }
}

const MAX_PROOF_IMAGES = 4
const MAX_PROOF_IMAGE_LENGTH = 900000

function validateRecoveryRequest(body) {
  const errors = {}
  body = body || {}

  const lostItemId = Number(body.lostItemId)
  const foundItemId = Number(body.foundItemId)

  if (!body.lostItemId || !Number.isInteger(lostItemId) || lostItemId <= 0) {
    errors.lostItemId = 'A valid lost item is required.'
  }

  if (!body.foundItemId || !Number.isInteger(foundItemId) || foundItemId <= 0) {
    errors.foundItemId = 'A valid found item is required.'
  }

  if (typeof body.claimantName !== 'string' || !body.claimantName.trim()) {
    errors.claimantName = 'Full name is required.'
  } else if (body.claimantName.trim().length > 120) {
    errors.claimantName = 'Full name must be 120 characters or fewer.'
  }

  if (typeof body.claimantEmail !== 'string' || !body.claimantEmail.trim()) {
    errors.claimantEmail = 'Email is required.'
  } else if (body.claimantEmail.trim().length > 255) {
    errors.claimantEmail = 'Email must be 255 characters or fewer.'
  } else if (!EMAIL_RE.test(body.claimantEmail.trim())) {
    errors.claimantEmail = 'Enter a valid email address.'
  }

  if (typeof body.claimantPhone !== 'string' || !body.claimantPhone.trim()) {
    errors.claimantPhone = 'Phone number is required.'
  } else if (body.claimantPhone.trim().length > 120) {
    errors.claimantPhone = 'Phone number must be 120 characters or fewer.'
  }

  if (typeof body.claimantMessage !== 'string' || !body.claimantMessage.trim()) {
    errors.claimantMessage = 'Please describe why this item is yours.'
  } else if (body.claimantMessage.trim().length > 500) {
    errors.claimantMessage = 'Message must be 500 characters or fewer.'
  }

  if (body.proofImages !== undefined && body.proofImages !== null) {
    if (!Array.isArray(body.proofImages)) {
      errors.proofImages = 'Proof images must be a list of images.'
    } else if (body.proofImages.length > MAX_PROOF_IMAGES) {
      errors.proofImages = `You can attach up to ${MAX_PROOF_IMAGES} proof images.`
    } else {
      let badIndex = -1
      for (let i = 0; i < body.proofImages.length; i += 1) {
        const image = body.proofImages[i]
        if (typeof image !== 'string' || image.length > MAX_PROOF_IMAGE_LENGTH) {
          badIndex = i
          break
        }
      }
      if (badIndex !== -1) {
        errors.proofImages = `Proof image at position ${badIndex + 1} is too large. Keep each image under 500 KB.`
      }
    }
  }

  return errors
}

function canViewRecoveryRequest(reqUser, row) {
  if (!row) return false
  return (
    reqUser.id === row.claimant_user_id || reqUser.id === row.lost_owner_id
  )
}

function isRecoveryRequestOwner(reqUser, row) {
  if (!row) return false
  return Boolean(row.lost_owner_id) && reqUser.id === row.lost_owner_id
}

async function getRecoveryRequestById(id) {
  const result = await pool.query(`${RECOVERY_SELECT} WHERE rr.id = $1`, [id])
  return result.rows[0] || null
}

// ---------------------------------------------------------------------------
// Health / utility routes
// ---------------------------------------------------------------------------

app.get('/', (req, res) => {
  res.json({ message: 'CampusFind Backend is working!' })
})

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-db', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()')
      res.json({ message: 'Database connected successfully!', time: result.rows[0].now })
    } catch (error) {
      console.error('Database error:', error.message)
      res.status(500).json({ message: 'Database connection failed' })
    }
  })
}

// ---------------------------------------------------------------------------
// Lost Items CRUD
// ---------------------------------------------------------------------------

app.get('/api/lost-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lost_items ORDER BY created_at DESC')
    res.json({ items: toCamelCaseList(result.rows, LOST_MAP) })
  } catch (error) {
    console.error('Error fetching lost items:', error.message)
    res.status(500).json({ message: 'Failed to fetch lost items' })
  }
})

app.get('/api/lost-items/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
    }
    const result = await pool.query('SELECT * FROM lost_items WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lost item not found.' })
    }
    res.json({ item: toCamelCase(result.rows[0], LOST_MAP) })
  } catch (error) {
    console.error('Error fetching lost item:', error.message)
    res.status(500).json({ message: 'Failed to fetch lost item' })
  }
})

app.post('/api/lost-items', requireAuth, async (req, res) => {
  const errors = validateItem(req.body, 'dateLost')
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  try {
    const { itemName, category, description, location, dateLost, contact, imageData } = req.body

    const result = await pool.query(
      `INSERT INTO lost_items (item_name, category, description, location, date_lost, contact, image_data, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [itemName.trim(), category.trim(), description.trim(), location.trim(), dateLost, contact.trim(), imageData || null, req.user.id]
    )

    res.status(201).json({
      message: 'Lost item saved successfully!',
      item: toCamelCase(result.rows[0], LOST_MAP),
    })
  } catch (error) {
    console.error('Error saving lost item:', error.message)
    res.status(500).json({ message: 'Failed to save lost item' })
  }
})

app.put('/api/lost-items/:id', requireAuth, async (req, res) => {
  const errors = validateItem(req.body, 'dateLost')
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
    }

    const owner = await pool.query('SELECT id, user_id FROM lost_items WHERE id = $1', [id])
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: 'Lost item not found.' })
    }
    if (owner.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to modify this report.' })
    }

    const { itemName, category, description, location, dateLost, contact, imageData } = req.body

    const result = await pool.query(
      `UPDATE lost_items
       SET item_name = $1, category = $2, description = $3, location = $4,
           date_lost = $5, contact = $6, image_data = $7
       WHERE id = $8
       RETURNING *`,
      [itemName.trim(), category.trim(), description.trim(), location.trim(), dateLost, contact.trim(), imageData || null, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lost item not found.' })
    }

    res.json({ message: 'Lost item updated successfully!', item: toCamelCase(result.rows[0], LOST_MAP) })
  } catch (error) {
    console.error('Error updating lost item:', error.message)
    res.status(500).json({ message: 'Failed to update lost item' })
  }
})

app.delete('/api/lost-items/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
    }

    const owner = await pool.query('SELECT id, user_id FROM lost_items WHERE id = $1', [id])
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: 'Lost item not found.' })
    }
    if (owner.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to modify this report.' })
    }

    await pool.query('DELETE FROM lost_items WHERE id = $1', [id])

    res.json({ message: 'Lost item deleted successfully.' })
  } catch (error) {
    console.error('Error deleting lost item:', error.message)
    res.status(500).json({ message: 'Failed to delete lost item' })
  }
})

// ---------------------------------------------------------------------------
// Found Items CRUD
// ---------------------------------------------------------------------------

app.get('/api/found-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM found_items ORDER BY created_at DESC')
    res.json({ items: toCamelCaseList(result.rows, FOUND_MAP) })
  } catch (error) {
    console.error('Error fetching found items:', error.message)
    res.status(500).json({ message: 'Failed to fetch found items' })
  }
})

app.get('/api/found-items/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
    }
    const result = await pool.query('SELECT * FROM found_items WHERE id = $1', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Found item not found.' })
    }
    res.json({ item: toCamelCase(result.rows[0], FOUND_MAP) })
  } catch (error) {
    console.error('Error fetching found item:', error.message)
    res.status(500).json({ message: 'Failed to fetch found item' })
  }
})

app.post('/api/found-items', requireAuth, async (req, res) => {
  const errors = validateItem(req.body, 'dateFound')
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  try {
    const { itemName, category, description, location, dateFound, contact, imageData } = req.body

    const result = await pool.query(
      `INSERT INTO found_items (item_name, category, description, location, date_found, contact, image_data, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [itemName.trim(), category.trim(), description.trim(), location.trim(), dateFound, contact.trim(), imageData || null, req.user.id]
    )

    res.status(201).json({
      message: 'Found item saved successfully!',
      item: toCamelCase(result.rows[0], FOUND_MAP),
    })
  } catch (error) {
    console.error('Error saving found item:', error.message)
    res.status(500).json({ message: 'Failed to save found item' })
  }
})

app.put('/api/found-items/:id', requireAuth, async (req, res) => {
  const errors = validateItem(req.body, 'dateFound')
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
    }

    const owner = await pool.query('SELECT id, user_id FROM found_items WHERE id = $1', [id])
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: 'Found item not found.' })
    }
    if (owner.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to modify this report.' })
    }

    const { itemName, category, description, location, dateFound, contact, imageData } = req.body

    const result = await pool.query(
      `UPDATE found_items
       SET item_name = $1, category = $2, description = $3, location = $4,
           date_found = $5, contact = $6, image_data = $7
       WHERE id = $8
       RETURNING *`,
      [itemName.trim(), category.trim(), description.trim(), location.trim(), dateFound, contact.trim(), imageData || null, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Found item not found.' })
    }

    res.json({ message: 'Found item updated successfully!', item: toCamelCase(result.rows[0], FOUND_MAP) })
  } catch (error) {
    console.error('Error updating found item:', error.message)
    res.status(500).json({ message: 'Failed to update found item' })
  }
})

app.delete('/api/found-items/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
    }

    const owner = await pool.query('SELECT id, user_id FROM found_items WHERE id = $1', [id])
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: 'Found item not found.' })
    }
    if (owner.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to modify this report.' })
    }

    await pool.query('DELETE FROM found_items WHERE id = $1', [id])

    res.json({ message: 'Found item deleted successfully.' })
  } catch (error) {
    console.error('Error deleting found item:', error.message)
    res.status(500).json({ message: 'Failed to delete found item' })
  }
})

// ---------------------------------------------------------------------------
// Recovery Requests
// ---------------------------------------------------------------------------

app.get('/api/recovery-requests', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `${RECOVERY_SELECT}
       WHERE rr.claimant_user_id = $1 OR li.user_id = $1
       ORDER BY rr.created_at DESC, rr.id DESC`,
      [req.user.id]
    )
    res.json({ requests: result.rows.map(toRecoveryRequest) })
  } catch (error) {
    console.error('Error fetching recovery requests:', error.message)
    res.status(500).json({ message: 'Failed to fetch recovery requests' })
  }
})

app.get('/api/recovery-requests/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid request ID.' })
    }
    const row = await getRecoveryRequestById(id)
    if (!row) {
      return res.status(404).json({ message: 'Recovery request not found.' })
    }
    if (!canViewRecoveryRequest(req.user, row)) {
      return res.status(403).json({ message: 'You do not have permission to view this request.' })
    }
    res.json({ request: toRecoveryRequest(row) })
  } catch (error) {
    console.error('Error fetching recovery request:', error.message)
    res.status(500).json({ message: 'Failed to fetch recovery request' })
  }
})

app.post('/api/recovery-requests', requireAuth, async (req, res) => {
  const errors = validateRecoveryRequest(req.body)
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  const { lostItemId, foundItemId } = req.body
  const claimantName = req.body.claimantName.trim()
  const claimantEmail = req.body.claimantEmail.trim().toLowerCase()
  const claimantPhone = req.body.claimantPhone.trim()
  const claimantMessage = req.body.claimantMessage.trim()
  const proofImages = Array.isArray(req.body.proofImages) ? req.body.proofImages : []

  try {
    const lostItem = await pool.query('SELECT id FROM lost_items WHERE id = $1', [lostItemId])
    if (lostItem.rows.length === 0) {
      return res.status(404).json({ message: 'Lost item not found.' })
    }

    const foundItem = await pool.query('SELECT id FROM found_items WHERE id = $1', [foundItemId])
    if (foundItem.rows.length === 0) {
      return res.status(404).json({ message: 'Found item not found.' })
    }

    const duplicate = await pool.query(
      `SELECT id FROM recovery_requests
       WHERE lost_item_id = $1 AND found_item_id = $2 AND status = 'pending'
       LIMIT 1`,
      [lostItemId, foundItemId]
    )
    if (duplicate.rows.length > 0) {
      return res.status(400).json({
        message: 'A recovery request for this lost and found item pair is already pending.',
      })
    }

    const result = await pool.query(
      `INSERT INTO recovery_requests
         (lost_item_id, found_item_id, claimant_name, claimant_contact,
          claimant_email, claimant_message, claimant_user_id, proof_images, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING id`,
      [
        lostItemId,
        foundItemId,
        claimantName,
        claimantPhone,
        claimantEmail,
        claimantMessage,
        req.user.id,
        proofImages,
      ]
    )

    const row = await getRecoveryRequestById(result.rows[0].id)
    res.status(201).json({
      message: 'Recovery request submitted successfully!',
      request: toRecoveryRequest(row),
    })
  } catch (error) {
    console.error('Error creating recovery request:', error.message)
    res.status(500).json({ message: 'Failed to submit recovery request' })
  }
})

app.patch('/api/recovery-requests/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid request ID.' })
    }

    const { status } = req.body || {}
    if (typeof status !== 'string' || !RECOVERY_STATUSES.has(status)) {
      return res.status(400).json({ message: 'Invalid recovery status.' })
    }

    const row = await getRecoveryRequestById(id)
    if (!row) {
      return res.status(404).json({ message: 'Recovery request not found.' })
    }

    if (!isRecoveryRequestOwner(req.user, row)) {
      return res.status(403).json({ message: 'You do not have permission to update this request.' })
    }

    const allowed = RECOVERY_TRANSITIONS[row.status] || []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Recovery request status cannot change from "${row.status}" to "${status}".`,
      })
    }

    await pool.query(
      `UPDATE recovery_requests
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, id]
    )

    const updated = await getRecoveryRequestById(id)
    res.json({
      message: `Recovery request marked as "${status}".`,
      request: toRecoveryRequest(updated),
    })
  } catch (error) {
    console.error('Error updating recovery request:', error.message)
    res.status(500).json({ message: 'Failed to update recovery request' })
  }
})

// ---------------------------------------------------------------------------
// My reports (authenticated user only)
// ---------------------------------------------------------------------------

app.get('/api/my-reports', requireAuth, async (req, res) => {
  try {
    const lost = await pool.query(
      'SELECT * FROM lost_items WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    const found = await pool.query(
      'SELECT * FROM found_items WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )

    res.json({
      lostItems: toCamelCaseList(lost.rows, LOST_MAP),
      foundItems: toCamelCaseList(found.rows, FOUND_MAP),
    })
  } catch (error) {
    console.error('Error fetching my reports:', error.message)
    res.status(500).json({ message: 'Failed to fetch your reports' })
  }
})

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 5000

// Keep `node server.js` working as the original entry point while also
// allowing the app to be imported by the API tests.
if (require.main === module) {
  ensureSchema()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`CampusFind Backend running on http://localhost:${PORT}`)
      })
    })
    .catch((error) => {
      console.error('Failed to initialize database schema:', error.message)
      process.exit(1)
    })
}

module.exports = app

