const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const pool = require('./config/db')
const { ensureSchema } = require('./config/schema')

const app = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

// ---------------------------------------------------------------------------
// Field mapping helpers (camelCase ↔ snake_case)
// ---------------------------------------------------------------------------

const LOST_MAP = {
  itemName: 'item_name',
  dateLost: 'date_lost',
  imageData: 'image_data',
}

const FOUND_MAP = {
  itemName: 'item_name',
  dateFound: 'date_found',
  imageData: 'image_data',
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
// Validation helpers
// ---------------------------------------------------------------------------

function validateItem(body, dateField) {
  const errors = {}

  if (!body.itemName || typeof body.itemName !== 'string' || !body.itemName.trim()) {
    errors.itemName = 'Item name is required.'
  }

  if (!body.category || typeof body.category !== 'string' || !body.category.trim()) {
    errors.category = 'Category is required.'
  }

  if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
    errors.description = 'Description is required.'
  }

  if (!body.location || typeof body.location !== 'string' || !body.location.trim()) {
    errors.location = 'Location is required.'
  }

  if (!body[dateField]) {
    errors[dateField] = `${dateField === 'dateLost' ? 'Date lost' : 'Date found'} is required.`
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(body[dateField])) {
    errors[dateField] = 'Date must be in YYYY-MM-DD format.'
  }

  if (!body.contact || typeof body.contact !== 'string' || !body.contact.trim()) {
    errors.contact = 'Contact details are required.'
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
         rr.claimant_name, rr.claimant_contact, rr.claimant_message,
         rr.status,
         to_char(rr.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
         to_char(rr.updated_at, 'YYYY-MM-DD HH24:MI') AS updated_at,
         li.item_name AS lost_item_name, li.category AS lost_item_category,
         li.location AS lost_item_location,
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
    claimantMessage: row.claimant_message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

  if (typeof body.claimantContact !== 'string' || !body.claimantContact.trim()) {
    errors.claimantContact = 'Contact details are required.'
  } else if (body.claimantContact.trim().length > 120) {
    errors.claimantContact = 'Contact details must be 120 characters or fewer.'
  }

  if (typeof body.claimantMessage !== 'string' || !body.claimantMessage.trim()) {
    errors.claimantMessage = 'Please describe why this item is yours.'
  } else if (body.claimantMessage.trim().length > 500) {
    errors.claimantMessage = 'Message must be 500 characters or fewer.'
  }

  return errors
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

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ message: 'Database connected successfully!', time: result.rows[0].now })
  } catch (error) {
    console.error('Database error:', error.message)
    res.status(500).json({ message: 'Database connection failed', error: error.message })
  }
})

// ---------------------------------------------------------------------------
// Lost Items CRUD
// ---------------------------------------------------------------------------

app.get('/api/lost-items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lost_items ORDER BY created_at DESC')
    res.json({ items: toCamelCaseList(result.rows, LOST_MAP) })
  } catch (error) {
    console.error('Error fetching lost items:', error.message)
    res.status(500).json({ message: 'Failed to fetch lost items', error: error.message })
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
    res.status(500).json({ message: 'Failed to fetch lost item', error: error.message })
  }
})

app.post('/api/lost-items', async (req, res) => {
  const errors = validateItem(req.body, 'dateLost')
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  try {
    const { itemName, category, description, location, dateLost, contact, imageData } = req.body

    const result = await pool.query(
      `INSERT INTO lost_items (item_name, category, description, location, date_lost, contact, image_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [itemName.trim(), category.trim(), description.trim(), location.trim(), dateLost, contact.trim(), imageData || null]
    )

    res.status(201).json({
      message: 'Lost item saved successfully!',
      item: toCamelCase(result.rows[0], LOST_MAP),
    })
  } catch (error) {
    console.error('Error saving lost item:', error.message)
    res.status(500).json({ message: 'Failed to save lost item', error: error.message })
  }
})

app.put('/api/lost-items/:id', async (req, res) => {
  const errors = validateItem(req.body, 'dateLost')
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
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
    res.status(500).json({ message: 'Failed to update lost item', error: error.message })
  }
})

app.delete('/api/lost-items/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
    }

    const result = await pool.query('DELETE FROM lost_items WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Lost item not found.' })
    }

    res.json({ message: 'Lost item deleted successfully.' })
  } catch (error) {
    console.error('Error deleting lost item:', error.message)
    res.status(500).json({ message: 'Failed to delete lost item', error: error.message })
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
    res.status(500).json({ message: 'Failed to fetch found items', error: error.message })
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
    res.status(500).json({ message: 'Failed to fetch found item', error: error.message })
  }
})

app.post('/api/found-items', async (req, res) => {
  const errors = validateItem(req.body, 'dateFound')
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  try {
    const { itemName, category, description, location, dateFound, contact, imageData } = req.body

    const result = await pool.query(
      `INSERT INTO found_items (item_name, category, description, location, date_found, contact, image_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [itemName.trim(), category.trim(), description.trim(), location.trim(), dateFound, contact.trim(), imageData || null]
    )

    res.status(201).json({
      message: 'Found item saved successfully!',
      item: toCamelCase(result.rows[0], FOUND_MAP),
    })
  } catch (error) {
    console.error('Error saving found item:', error.message)
    res.status(500).json({ message: 'Failed to save found item', error: error.message })
  }
})

app.put('/api/found-items/:id', async (req, res) => {
  const errors = validateItem(req.body, 'dateFound')
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
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
    res.status(500).json({ message: 'Failed to update found item', error: error.message })
  }
})

app.delete('/api/found-items/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid item ID.' })
    }

    const result = await pool.query('DELETE FROM found_items WHERE id = $1 RETURNING *', [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Found item not found.' })
    }

    res.json({ message: 'Found item deleted successfully.' })
  } catch (error) {
    console.error('Error deleting found item:', error.message)
    res.status(500).json({ message: 'Failed to delete found item', error: error.message })
  }
})

// ---------------------------------------------------------------------------
// Recovery Requests
// ---------------------------------------------------------------------------

app.get('/api/recovery-requests', async (req, res) => {
  try {
    const result = await pool.query(
      `${RECOVERY_SELECT} ORDER BY rr.created_at DESC, rr.id DESC`
    )
    res.json({ requests: result.rows.map(toRecoveryRequest) })
  } catch (error) {
    console.error('Error fetching recovery requests:', error.message)
    res.status(500).json({ message: 'Failed to fetch recovery requests', error: error.message })
  }
})

app.get('/api/recovery-requests/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({ message: 'Invalid request ID.' })
    }
    const row = await getRecoveryRequestById(id)
    if (!row) {
      return res.status(404).json({ message: 'Recovery request not found.' })
    }
    res.json({ request: toRecoveryRequest(row) })
  } catch (error) {
    console.error('Error fetching recovery request:', error.message)
    res.status(500).json({ message: 'Failed to fetch recovery request', error: error.message })
  }
})

app.post('/api/recovery-requests', async (req, res) => {
  const errors = validateRecoveryRequest(req.body)
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors })
  }

  const { lostItemId, foundItemId } = req.body
  const claimantName = req.body.claimantName.trim()
  const claimantContact = req.body.claimantContact.trim()
  const claimantMessage = req.body.claimantMessage.trim()

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
         (lost_item_id, found_item_id, claimant_name, claimant_contact, claimant_message, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [lostItemId, foundItemId, claimantName, claimantContact, claimantMessage]
    )

    const row = await getRecoveryRequestById(result.rows[0].id)
    res.status(201).json({
      message: 'Recovery request submitted successfully!',
      request: toRecoveryRequest(row),
    })
  } catch (error) {
    console.error('Error creating recovery request:', error.message)
    res.status(500).json({ message: 'Failed to submit recovery request', error: error.message })
  }
})

app.patch('/api/recovery-requests/:id/status', async (req, res) => {
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
    res.status(500).json({ message: 'Failed to update recovery request', error: error.message })
  }
})

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT = 5000

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
