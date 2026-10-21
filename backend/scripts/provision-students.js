// Provision campus accounts for CampusFind.
//
// Two jobs:
//   1. Assign PRNs to existing student accounts (email login keeps working).
//   2. Create new student accounts that sign in with PRN + a temporary
//      password (the first six digits of the PRN) and must change it on
//      first login.
//
// Usage:
//   node scripts/provision-students.js <csv-file>
//   node scripts/provision-students.js --assign-prn <email> <prn>
//
// CSV format (header required, extra columns ignored):
//   prn,name,email
//   202212345678901,Aarti Sharma,aarti@campus.edu
//
// A student who already exists by email gets their PRN assigned. A PRN that
// is already taken by a different account is reported and skipped.
const fs = require('fs')
const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const { ensureSchema } = require('../config/schema')
const {
  ROLES,
  normalizePrn,
  prnError,
  roleForNewAccount,
} = require('../config/roles')

function parseCsvLine(line) {
  const out = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  out.push(current)
  return out.map((value) => value.trim())
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length === 0) return []
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const prnIndex = header.indexOf('prn')
  const nameIndex = header.indexOf('name')
  const emailIndex = header.indexOf('email')
  if (prnIndex === -1 || nameIndex === -1 || emailIndex === -1) {
    throw new Error('CSV header must contain prn, name and email columns.')
  }
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    return {
      prn: cells[prnIndex] || '',
      name: cells[nameIndex] || '',
      email: (cells[emailIndex] || '').toLowerCase(),
    }
  })
}

// The temporary credential for a provisioned account. Only the hash is stored.
function temporaryPassword(prn) {
  return prn.slice(0, 6)
}

async function provisionStudent(client, record) {
  const prn = normalizePrn(record.prn)
  const message = prnError(prn)
  if (message) {
    return { ok: false, reason: message, email: record.email }
  }
  if (!record.name || !record.email) {
    return { ok: false, reason: 'Missing name or email.', email: record.email }
  }

  const existingByEmail = await client.query(
    'SELECT id, prn FROM users WHERE email = $1',
    [record.email]
  )
  if (existingByEmail.rows.length > 0) {
    const current = existingByEmail.rows[0]
    if (current.prn) {
      return { ok: false, reason: 'Already has a PRN.', email: record.email }
    }
    await client.query('UPDATE users SET prn = $1 WHERE id = $2', [prn, current.id])
    return { ok: true, action: 'assigned-prn', email: record.email }
  }

  const prnTaken = await client.query('SELECT email FROM users WHERE prn = $1', [prn])
  if (prnTaken.rows.length > 0) {
    return {
      ok: false,
      reason: `PRN already used by ${prnTaken.rows[0].email}.`,
      email: record.email,
    }
  }

  const role = roleForNewAccount(record.email)
  const hash = await bcrypt.hash(temporaryPassword(prn), 10)
  await client.query(
    `INSERT INTO users (name, email, password_hash, prn, role, must_change_password)
     VALUES ($1, $2, $3, $4, $5, TRUE)`,
    [record.name, record.email, hash, prn, role]
  )
  return { ok: true, action: 'created', email: record.email, temporaryPassword: temporaryPassword(prn) }
}

async function assignSinglePrn(email, prn) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const normalizedPrn = normalizePrn(prn)
  const message = prnError(normalizedPrn)
  if (message) {
    console.error(message)
    return
  }
  const existing = await pool.query(
    'SELECT id, prn FROM users WHERE email = $1',
    [normalizedEmail]
  )
  if (existing.rows.length === 0) {
    console.error(`No account found for ${normalizedEmail}.`)
    return
  }
  if (existing.rows[0].prn) {
    console.error(`${normalizedEmail} already has PRN ${existing.rows[0].prn}.`)
    return
  }
  const taken = await pool.query('SELECT email FROM users WHERE prn = $1', [normalizedPrn])
  if (taken.rows.length > 0) {
    console.error(`PRN ${normalizedPrn} is already used by ${taken.rows[0].email}.`)
    return
  }
  await pool.query('UPDATE users SET prn = $1 WHERE id = $2', [
    normalizedPrn,
    existing.rows[0].id,
  ])
  console.log(`Assigned PRN ${normalizedPrn} to ${normalizedEmail}.`)
}

async function runProvisioning(csvPath) {
  await ensureSchema()
  const text = fs.readFileSync(csvPath, 'utf8')
  const records = parseCsv(text)

  const client = await pool.connect()
  const results = []
  try {
    await client.query('BEGIN')
    for (const record of records) {
      results.push(await provisionStudent(client, record))
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  let created = 0
  let assigned = 0
  let skipped = 0
  for (const result of results) {
    if (!result.ok) {
      skipped += 1
      console.warn(`Skipped ${result.email || '(unknown)'}: ${result.reason}`)
      continue
    }
    if (result.action === 'created') {
      created += 1
      console.log(
        `Created ${result.email} (PRN login, temporary password ${result.temporaryPassword} — must change on first login).`
      )
    } else {
      assigned += 1
      console.log(`Assigned PRN to ${result.email}.`)
    }
  }
  console.log(`Done. Created: ${created}, PRNs assigned: ${assigned}, skipped: ${skipped}.`)
}

module.exports = { runProvisioning, parseCsv, temporaryPassword, ROLES }

if (require.main === module) {
  const [, , ...args] = process.argv
  const task = (async () => {
    if (args[0] === '--assign-prn') {
      await assignSinglePrn(args[1], args[2])
    } else if (args[0]) {
      await runProvisioning(args[0])
    } else {
      console.error('Usage: node scripts/provision-students.js <csv-file>')
      console.error('   or: node scripts/provision-students.js --assign-prn <email> <prn>')
      process.exitCode = 1
    }
  })()

  task
    .then(() => pool.end())
    .catch((error) => {
      console.error('Provisioning failed:', error.message)
      process.exit(1)
    })
}
