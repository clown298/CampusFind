// Provision the admin account for CampusFind.
//
// By default this script performs a DRY RUN: it inspects account status and
// prints what it would do, without touching the database.
//
// Usage:
//   node scripts/provision-admin.js                         # dry-run inspection
//   node scripts/provision-admin.js --apply                 # promote target, demote old admin
//   node scripts/provision-admin.js --create --apply        # create account if missing, then promote
//
// What --apply does (idempotent — safe to run twice):
//   • If the target account exists: sets role = 'admin' only. No other fields touched.
//   • If the old admin account (nayeemaalma@gmail.com) exists and is different from
//     the target: sets role = 'student'. The account, items, and all records are kept.
//   • Does NOT delete any rows.
//   • Does NOT modify lost_items, found_items, or recovery_requests tables.
//
// What --create does (requires --apply):
//   • If the target account does not exist, creates it with a secure random 12-char
//     temporary password. The password is printed ONCE to stdout and then discarded —
//     it is never stored in the script source.
//   • Sets must_change_password = TRUE so the new admin is forced to change it on
//     first login.
//
// After running --apply, update your .env:
//   ADMIN_EMAIL=clowngaming511@gmail.com
//
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const pool = require('../config/db')
const { ensureSchema } = require('../config/schema')

const TARGET_EMAIL = 'clowngaming511@gmail.com'
const OLD_ADMIN_EMAIL = 'nayeemaalma@gmail.com'

// Generate a cryptographically random temporary password (alphanumeric, 12 chars).
// The result is returned in memory only; it is never written to disk or source.
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.randomBytes(12)
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('')
}

async function inspect(client) {
  const targetRow = await client.query(
    'SELECT id, email, role, must_change_password FROM users WHERE email = $1',
    [TARGET_EMAIL]
  )
  const oldRow = await client.query(
    'SELECT id, email, role FROM users WHERE email = $1',
    [OLD_ADMIN_EMAIL]
  )

  const target = targetRow.rows[0] || null
  const old = oldRow.rows[0] || null

  return { target, old }
}

async function run() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const create = args.includes('--create')

  if (create && !apply) {
    console.error('Error: --create requires --apply.')
    process.exitCode = 1
    return
  }

  await ensureSchema()

  const client = await pool.connect()
  try {
    const { target, old } = await inspect(client)

    // ── Dry-run report ──────────────────────────────────────────────────────
    console.log('')
    console.log('=== CampusFind Admin Provisioning ===')
    console.log('')
    console.log(`Target account : ${TARGET_EMAIL}`)

    if (target) {
      console.log(`  Status       : EXISTS (id=${target.id}, current role="${target.role}")`)
      if (target.role === 'admin') {
        console.log('  Action       : Already admin — no change needed.')
      } else {
        console.log(`  Action       : Will set role → "admin"`)
      }
    } else {
      console.log('  Status       : NOT FOUND')
      if (create) {
        console.log('  Action       : Will CREATE account with a random temporary password.')
        console.log('                 The password will be printed once. must_change_password=TRUE.')
      } else {
        console.log('  Action       : SKIP (account does not exist; re-run with --create --apply to create it,')
        console.log('                 or have the user register first).')
      }
    }

    console.log('')
    console.log(`Old admin      : ${OLD_ADMIN_EMAIL}`)

    if (old) {
      if (old.email === TARGET_EMAIL) {
        console.log('  Note         : Same as target account — no demotion needed.')
      } else if (old.role === 'admin') {
        console.log(`  Status       : EXISTS (id=${old.id}, current role="admin")`)
        console.log('  Action       : Will set role → "student" (account + all records preserved).')
      } else {
        console.log(`  Status       : EXISTS (id=${old.id}, current role="${old.role}")`)
        console.log('  Action       : Not currently admin — no change needed.')
      }
    } else {
      console.log('  Status       : NOT FOUND — no demotion needed.')
    }

    console.log('')

    if (!apply) {
      console.log('-- DRY RUN — no changes made. Pass --apply to execute. --')
      console.log('')
      return
    }

    // ── Apply changes ───────────────────────────────────────────────────────
    await client.query('BEGIN')

    let targetId = target ? target.id : null
    let tempPassword = null

    if (!target) {
      if (!create) {
        console.log('Target account does not exist. No changes made.')
        console.log('Re-run with --create --apply to create the account,')
        console.log('or have the user register at the app first.')
        await client.query('ROLLBACK')
        return
      }

      // Create the account with a secure random temporary password.
      tempPassword = generateTempPassword()
      const hash = await bcrypt.hash(tempPassword, 12)
      const inserted = await client.query(
        `INSERT INTO users (name, email, password_hash, role, must_change_password)
         VALUES ($1, $2, $3, 'admin', TRUE)
         RETURNING id`,
        ['Admin', TARGET_EMAIL, hash]
      )
      targetId = inserted.rows[0].id
      console.log(`Created account for ${TARGET_EMAIL} (id=${targetId}).`)
    } else if (target.role !== 'admin') {
      await client.query(
        "UPDATE users SET role = 'admin' WHERE id = $1",
        [targetId]
      )
      console.log(`Promoted ${TARGET_EMAIL} → admin.`)
    } else {
      console.log(`${TARGET_EMAIL} is already admin — no role change needed.`)
    }

    // Demote old admin if it exists, is different, and is currently admin.
    if (old && old.email !== TARGET_EMAIL && old.role === 'admin') {
      await client.query(
        "UPDATE users SET role = 'student' WHERE id = $1",
        [old.id]
      )
      console.log(`Demoted ${OLD_ADMIN_EMAIL} → student (account and all records preserved).`)
    }

    await client.query('COMMIT')

    console.log('')
    console.log('Done.')

    if (tempPassword) {
      console.log('')
      console.log('┌──────────────────────────────────────────────┐')
      console.log('│  TEMPORARY PASSWORD (shown once — save it)   │')
      console.log(`│  ${tempPassword.padEnd(44)}│`)
      console.log('│  The admin MUST change this on first login.  │')
      console.log('└──────────────────────────────────────────────┘')
      // tempPassword is now out of scope; it is never written to disk.
    }

    console.log('')
    console.log('Next step: update your .env file:')
    console.log(`  ADMIN_EMAIL=${TARGET_EMAIL}`)
    console.log('')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

if (require.main === module) {
  run()
    .then(() => pool.end())
    .catch((err) => {
      console.error('provision-admin failed:', err.message)
      process.exit(1)
    })
}

module.exports = { generateTempPassword }
