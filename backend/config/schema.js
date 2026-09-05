const pool = require('./db')

async function ensureColumn(client, table, column, definition) {
  const result = await client.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  )
  if (result.rows.length === 0) {
    await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
    console.log(`Added ${column} column to ${table}`)
  }
}

async function ensureForeignKey(client, table, column, refTable, constraintName) {
  const result = await client.query(
    `SELECT 1
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = $2`,
    [table, column]
  )
  if (result.rows.length === 0) {
    await client.query(
      `ALTER TABLE ${table}
       ADD CONSTRAINT ${constraintName}
       FOREIGN KEY (${column}) REFERENCES ${refTable}(id) ON DELETE SET NULL`
    )
    console.log(`Added ${constraintName} foreign key to ${table}`)
  }
}

async function ensureSchema() {
  // Serialize schema setup so concurrent importers (e.g. parallel test files)
  // cannot race each other on migration steps like column renames.
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(823412341)')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Legacy users tables from earlier versions used a plain `password` column.
    const legacyPassword = await client.query(
      `SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'`
    )
    const passwordHash = await client.query(
      `SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password_hash'`
    )
    if (legacyPassword.rows.length > 0 && passwordHash.rows.length === 0) {
      await client.query('ALTER TABLE users RENAME COLUMN password TO password_hash')
      console.log('Renamed users.password to users.password_hash')
    }
    await ensureColumn(client, 'users', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    await ensureColumn(client, 'users', 'token_version', 'INTEGER NOT NULL DEFAULT 0')

    await client.query(`
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

    const lostCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'lost_items' AND column_name = 'image_data'
    `)
    if (lostCols.rows.length === 0) {
      await client.query('ALTER TABLE lost_items ADD COLUMN image_data TEXT')
      console.log('Added image_data column to lost_items')
    }
    await ensureColumn(client, 'lost_items', 'user_id', 'INTEGER')
    await ensureForeignKey(client, 'lost_items', 'user_id', 'users', 'fk_lost_items_user')

    await client.query(`
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

    const foundCols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'found_items' AND column_name = 'image_data'
    `)
    if (foundCols.rows.length === 0) {
      await client.query('ALTER TABLE found_items ADD COLUMN image_data TEXT')
      console.log('Added image_data column to found_items')
    }
    await ensureColumn(client, 'found_items', 'user_id', 'INTEGER')
    await ensureForeignKey(client, 'found_items', 'user_id', 'users', 'fk_found_items_user')

    await client.query(`
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

    await ensureColumn(client, 'recovery_requests', 'claimant_user_id', 'INTEGER')
    await ensureForeignKey(
      client,
      'recovery_requests',
      'claimant_user_id',
      'users',
      'fk_recovery_requests_claimant_user'
    )

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_recovery_pending_pair
        ON recovery_requests (lost_item_id, found_item_id)
        WHERE status = 'pending'
    `)

    await client.query('COMMIT')
    console.log('Database schema is ready!')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = { ensureSchema }