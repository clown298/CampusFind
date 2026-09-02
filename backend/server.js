const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const pool = require('./config/db')

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => {
  res.json({
    message: 'CampusFind Backend is working!'
  })
})

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')

    res.json({
      message: 'Database connected successfully!',
      time: result.rows[0].now
    })
  } catch (error) {
    console.error('Database error:', error.message)

    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    })
  }
})

app.post('/api/lost-items', async (req, res) => {
  try {
    const {
      itemName,
      category,
      description,
      location,
      dateLost,
      contact
    } = req.body

    const result = await pool.query(
      `INSERT INTO lost_items
       (item_name, category, description, location, date_lost, contact)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        itemName,
        category,
        description,
        location,
        dateLost,
        contact
      ]
    )

    res.status(201).json({
      message: 'Lost item saved successfully!',
      item: result.rows[0]
    })
  } catch (error) {
    console.error('Error saving lost item:', error.message)

    res.status(500).json({
      message: 'Failed to save lost item',
      error: error.message
    })
  }
})

pool.query(`
  CREATE TABLE IF NOT EXISTS lost_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(150) NOT NULL,
    date_lost DATE NOT NULL,
    contact VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`)
.then(() => {
  console.log('Lost items table is ready!')
})
.catch((error) => {
  console.error('Table creation error:', error.message)
})

const PORT = 5000

app.listen(PORT, () => {
  console.log(`CampusFind Backend running on http://localhost:5000`)
})