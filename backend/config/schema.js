const pool = require('./db')

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

module.exports = { ensureSchema }