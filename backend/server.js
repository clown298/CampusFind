const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const pool = require('./config/db')

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
// Schema bootstrap (preserves existing data)
// ---------------------------------------------------------------------------

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lost_items (
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      location VARCHAR(150) NOT NULL,
      date_lost DATE NOT NULL,
      contact VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const lostCols = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'lost_items' AND column_name = 'image_data'
  `)
  if (lostCols.rows.length === 0) {
    await pool.query('ALTER TABLE lost_items ADD COLUMN image_data TEXT')
    console.log('Added image_data column to lost_items')
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS found_items (
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      location VARCHAR(150) NOT NULL,
      date_found DATE NOT NULL,
      contact VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const foundCols = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'found_items' AND column_name = 'image_data'
  `)
  if (foundCols.rows.length === 0) {
    await pool.query('ALTER TABLE found_items ADD COLUMN image_data TEXT')
    console.log('Added image_data column to found_items')
  }

  console.log('Database schema is ready!')
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
// Start server
// ---------------------------------------------------------------------------

const PORT = 5000

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
