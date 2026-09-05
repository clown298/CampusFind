const { Pool, types } = require('pg')
require('dotenv').config()

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date
// objects. JS Date serialization shifts the date across timezone boundaries
// (e.g. showing a UTC ISO string the day before the stored value).
types.setTypeParser(1082, (value) => value)

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : undefined,
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl:
          process.env.DB_SSL === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
      }
)

module.exports = pool