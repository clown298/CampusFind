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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recovery_requests (
      id SERIAL PRIMARY KEY,
      lost_item_id INTEGER NOT NULL REFERENCES lost_items(id) ON DELETE CASCADE,
      found_item_id INTEGER NOT NULL REFERENCES found_items(id) ON DELETE CASCADE,
      claimant_name VARCHAR(120) NOT NULL,
      claimant_contact VARCHAR(120) NOT NULL,
      claimant_message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_recovery_status
        CHECK (status IN ('pending', 'approved', 'rejected', 'recovered'))
    )
  `)

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_recovery_pending_pair
      ON recovery_requests (lost_item_id, found_item_id)
      WHERE status = 'pending'
  `)

  console.log('Database schema is ready!')
}

module.exports = { ensureSchema }