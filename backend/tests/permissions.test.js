process.env.NODE_ENV = 'test'
// Use a throwaway admin identity in tests instead of the real admin account.
process.env.ADMIN_EMAIL = 'campusfind.admin.role.test@campus.test'

const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const bcrypt = require('bcryptjs')

const app = require('../server')
const pool = require('../config/db')
const { ensureSchema } = require('../config/schema')
const { prnError, normalizePrn } = require('../config/roles')

let server
let baseUrl
const createdUserIds = []
const createdItemIds = []
const createdRequestIds = []
let sequence = 0

function uniqueEmail(prefix) {
  sequence += 1
  return `${prefix}${sequence}_${Date.now()}@campus.test`
}

// A valid PRN for a given sequence: 2022 + 12 digits.
function uniquePrn() {
  sequence += 1
  const tail = String(sequence).padStart(6, '0')
  return `2022${tail}${String(Date.now()).slice(-6)}`
}

async function raw(path, { method = 'GET', body, cookie } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (cookie) headers.Cookie = cookie
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const setCookie = res.headers.get('set-cookie')
  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, data, cookie: setCookie ? setCookie.split(';')[0] : null }
}

async function register(name, extra = {}) {
  const email = uniqueEmail('role')
  const res = await raw('/api/auth/register', {
    method: 'POST',
    body: { name, email, password: 'password123', ...extra },
  })
  assert.equal(res.status, 201)
  createdUserIds.push(res.data.user.id)
  return { user: res.data.user, email, cookie: res.cookie }
}

// Creates a user directly in the database so a specific role, permission flag
// or temporary credential can be tested without a client-supplied role field.
async function createUserDirect({
  name,
  role = 'student',
  prn = null,
  password = 'password123',
  mustChangePassword = false,
  canReviewRecovery = false,
}) {
  const email = uniqueEmail('direct')
  const hash = await bcrypt.hash(password, 10)
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, prn, role, must_change_password, can_review_recovery)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, prn, role, must_change_password, can_review_recovery`,
    [name, email, hash, prn, role, mustChangePassword, canReviewRecovery]
  )
  createdUserIds.push(result.rows[0].id)
  return result.rows[0]
}

async function login(email, password) {
  return raw('/api/auth/login', { method: 'POST', body: { email, password } })
}

async function createLostItem(name, cookie) {
  const res = await raw('/api/lost-items', {
    method: 'POST',
    cookie,
    body: {
      itemName: name,
      category: 'Accessories',
      description: 'Role test lost item',
      location: 'Test Lab',
      dateLost: '2026-09-01',
      contact: 'role@example.com',
    },
  })
  assert.equal(res.status, 201)
  createdItemIds.push(res.data.item.id)
  return res.data.item
}

async function createFoundItem(name, cookie) {
  const res = await raw('/api/found-items', {
    method: 'POST',
    cookie,
    body: {
      itemName: name,
      category: 'Accessories',
      description: 'Role test found item',
      location: 'Test Lab',
      dateFound: '2026-09-02',
      contact: 'role@example.com',
    },
  })
  assert.equal(res.status, 201)
  createdItemIds.push(res.data.item.id)
  return res.data.item
}

async function submitRecovery(lostId, foundId, cookie, email) {
  const res = await raw('/api/recovery-requests', {
    method: 'POST',
    cookie,
    body: {
      lostItemId: lostId,
      foundItemId: foundId,
      claimantName: 'Role Tester',
      claimantEmail: email,
      claimantPhone: '9000000000',
      claimantMessage: 'Ownership claim for permission test.',
    },
  })
  assert.equal(res.status, 201)
  createdRequestIds.push(res.data.request.id)
  return res.data.request
}

before(async () => {
  await ensureSchema()
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (createdRequestIds.length > 0) {
    await pool.query('DELETE FROM recovery_requests WHERE id = ANY($1::int[])', [createdRequestIds])
  }
  if (createdItemIds.length > 0) {
    await pool.query('DELETE FROM lost_items WHERE id = ANY($1::int[])', [createdItemIds])
    await pool.query('DELETE FROM found_items WHERE id = ANY($1::int[])', [createdItemIds])
  }
  if (createdUserIds.length > 0) {
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [createdUserIds])
  }
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
})

describe('PRN validation', () => {
  it('accepts a well-formed 16-digit PRN starting with an allowed year', () => {
    assert.equal(prnError('2022123456789012'), null)
    assert.equal(prnError('2025000000000001'), null)
    assert.equal(prnError('2023 1234 5678 9012'), null)
  })

  it('rejects malformed PRNs with a clear reason', () => {
    assert.match(prnError(''), /required/i)
    assert.match(prnError('20221234567890'), /16 digits/)
    assert.match(prnError('20221234567890123'), /16 digits/)
    assert.match(prnError('2021123456789012'), /2022/)
    assert.match(prnError('2026123456789012'), /2025/)
    assert.match(prnError('abcdefghijklemno'), /digits/)
    assert.match(prnError('2022123456789a12'), /digits/)
  })

  it('normalizePrn strips spaces and dashes', () => {
    assert.equal(normalizePrn('2022-1234-5678-901'), '202212345678901')
    assert.equal(normalizePrn('2022 1234 5678 901'), '202212345678901')
  })
})

describe('Registration with PRN', () => {
  it('accepts an optional PRN at registration', async () => {
    const prn = uniquePrn()
    const account = await register('Prn Holder', { prn })
    assert.equal(account.user.prn, prn)
    assert.equal(account.user.role, 'student')
  })

  it('rejects a malformed PRN with 400', async () => {
    const res = await raw('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Bad Prn',
        email: uniqueEmail('bad'),
        password: 'password123',
        prn: '202112345678901',
      },
    })
    assert.equal(res.status, 400)
    assert.ok(res.data.errors.prn)
  })

  it('rejects a PRN that is already taken with 409', async () => {
    const prn = uniquePrn()
    await register('Prn First', { prn })
    const res = await raw('/api/auth/register', {
      method: 'POST',
      body: { name: 'Prn Second', email: uniqueEmail('dup'), password: 'password123', prn },
    })
    assert.equal(res.status, 409)
  })

  it('registration never lets the client choose a role', async () => {
    const account = await register('Escalator', { role: 'admin' })
    assert.equal(account.user.role, 'student')
    assert.equal(account.user.permissions.reviewRecovery, false)
  })
})

describe('Student PRN login', () => {
  it('signs in with PRN and password', async () => {
    const prn = uniquePrn()
    await register('Prn Login', { prn })
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn, password: 'password123' },
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.user.prn, prn)
    assert.equal(res.data.user.role, 'student')
  })

  it('still signs in with email and password', async () => {
    const account = await register('Email Login', { prn: uniquePrn() })
    const res = await login(account.email, 'password123')
    assert.equal(res.status, 200)
    assert.equal(res.data.user.email, account.email)
  })

  it('returns 401 for a wrong password on the PRN path', async () => {
    const prn = uniquePrn()
    await register('Wrong Prn Pass', { prn })
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn, password: 'wrongpassword' },
    })
    assert.equal(res.status, 401)
  })

  it('returns the same 401 for a well-formed PRN that is not registered', async () => {
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn: '2024999999999999', password: 'password123' },
    })
    assert.equal(res.status, 401)
    assert.equal(res.data.message, 'Invalid credentials.')
  })

  it('rejects a malformed PRN on the login path with 400', async () => {
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn: '2021123456789012', password: 'password123' },
    })
    assert.equal(res.status, 400)
    assert.ok(res.data.errors.prn)
  })

  it('rejects supplying both a PRN and an email', async () => {
    const account = await register('Both Fields')
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn: '2022123456789012', email: account.email, password: 'password123' },
    })
    assert.equal(res.status, 400)
    assert.ok(res.data.errors.identifier)
  })

  it('rejects supplying neither a PRN nor an email', async () => {
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { password: 'password123' },
    })
    assert.equal(res.status, 400)
    assert.ok(res.data.errors.identifier)
  })

  it('selecting the staff tab in the browser grants nothing', async () => {
    const prn = uniquePrn()
    await register('Tab Chooser', { prn })
    // The client can send an extra role field; the server ignores it.
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn, password: 'password123', role: 'admin' },
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.user.role, 'student')
    assert.equal(res.data.user.permissions.reviewRecovery, false)
  })
})

describe('Role permissions', () => {
  it('a student cannot review recovery requests', async () => {
    const student = await createUserDirect({ name: 'No Reviewer', role: 'student' })
    const loginRes = await login(student.email, 'password123')
    const lost = await createLostItem('PermLost', loginRes.cookie)
    const found = await createFoundItem('PermFound', loginRes.cookie)
    const created = await submitRecovery(lost.id, found.id, loginRes.cookie, student.email)

    const patch = await raw(`/api/recovery-requests/${created.id}/status`, {
      method: 'PATCH',
      cookie: loginRes.cookie,
      body: { status: 'approved' },
    })
    assert.equal(patch.status, 403)
  })

  it('staff without the grant cannot review recovery requests', async () => {
    const staff = await createUserDirect({
      name: 'Plain Staff',
      role: 'staff',
      canReviewRecovery: false,
    })
    const loginRes = await login(staff.email, 'password123')
    assert.equal(loginRes.status, 200)
    assert.equal(loginRes.data.user.role, 'staff')
    assert.equal(loginRes.data.user.permissions.reviewRecovery, false)

    const lost = await createLostItem('PlainStaffLost', loginRes.cookie)
    const found = await createFoundItem('PlainStaffFound', loginRes.cookie)
    const created = await submitRecovery(lost.id, found.id, loginRes.cookie, staff.email)

    const patch = await raw(`/api/recovery-requests/${created.id}/status`, {
      method: 'PATCH',
      cookie: loginRes.cookie,
      body: { status: 'approved' },
    })
    assert.equal(patch.status, 403)
  })

  it('staff with the grant can review recovery requests', async () => {
    const student = await createUserDirect({ name: 'Grant Student', role: 'student' })
    const studentLogin = await login(student.email, 'password123')
    const lost = await createLostItem('GrantLost', studentLogin.cookie)
    const found = await createFoundItem('GrantFound', studentLogin.cookie)
    const created = await submitRecovery(lost.id, found.id, studentLogin.cookie, student.email)

    const staff = await createUserDirect({
      name: 'Granted Staff',
      role: 'staff',
      canReviewRecovery: true,
    })
    const staffLogin = await login(staff.email, 'password123')
    assert.equal(staffLogin.data.user.permissions.reviewRecovery, true)

    const patch = await raw(`/api/recovery-requests/${created.id}/status`, {
      method: 'PATCH',
      cookie: staffLogin.cookie,
      body: { status: 'approved' },
    })
    assert.equal(patch.status, 200)
    assert.equal(patch.data.request.status, 'approved')
  })

  it('the grant can be revoked immediately without a new token', async () => {
    const staff = await createUserDirect({
      name: 'Revoked Staff',
      role: 'staff',
      canReviewRecovery: true,
    })
    const staffLogin = await login(staff.email, 'password123')
    assert.equal(staffLogin.data.user.permissions.reviewRecovery, true)

    await pool.query('UPDATE users SET can_review_recovery = FALSE WHERE id = $1', [staff.id])

    // Same cookie, no re-login: the role is re-read from the database.
    const me = await raw('/api/auth/me', { cookie: staffLogin.cookie })
    assert.equal(me.status, 200)
    assert.equal(me.data.user.permissions.reviewRecovery, false)
  })

  it('a student cannot moderate another student report', async () => {
    const owner = await createUserDirect({ name: 'Moderate Owner', role: 'student' })
    const other = await createUserDirect({ name: 'Moderate Other', role: 'student' })
    const ownerLogin = await login(owner.email, 'password123')
    const otherLogin = await login(other.email, 'password123')
    const item = await createLostItem('ModerateLost', ownerLogin.cookie)

    const edit = await raw(`/api/lost-items/${item.id}`, {
      method: 'PUT',
      cookie: otherLogin.cookie,
      body: {
        itemName: 'Hijacked',
        category: 'Accessories',
        description: 'Not allowed.',
        location: 'Test Lab',
        dateLost: '2026-09-01',
        contact: 'x@example.com',
      },
    })
    assert.equal(edit.status, 403)
  })
})

describe('Temporary credentials and password change', () => {
  it('a provisioned account is blocked until it changes its password', async () => {
    const prn = uniquePrn()
    const temporary = prn.slice(0, 6)
    const student = await createUserDirect({
      name: 'Provisioned',
      role: 'student',
      prn,
      password: temporary,
      mustChangePassword: true,
    })
    assert.equal(student.must_change_password, true)

    const loginRes = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn, password: temporary },
    })
    assert.equal(loginRes.status, 200)
    assert.equal(loginRes.data.user.mustChangePassword, true)
    const cookie = loginRes.cookie

    const create = await raw('/api/lost-items', {
      method: 'POST',
      cookie,
      body: {
        itemName: 'BlockedItem',
        category: 'Accessories',
        description: 'Should be blocked.',
        location: 'Test Lab',
        dateLost: '2026-09-01',
        contact: 'blocked@example.com',
      },
    })
    assert.equal(create.status, 403)
    assert.equal(create.data.code, 'PASSWORD_CHANGE_REQUIRED')

    const myReports = await raw('/api/my-reports', { cookie })
    assert.equal(myReports.status, 403)
    assert.equal(myReports.data.code, 'PASSWORD_CHANGE_REQUIRED')

    const wrong = await raw('/api/auth/change-password', {
      method: 'POST',
      cookie,
      body: { currentPassword: 'not-the-temp', newPassword: 'brandnewpass1' },
    })
    assert.equal(wrong.status, 400)

    const weak = await raw('/api/auth/change-password', {
      method: 'POST',
      cookie,
      body: { currentPassword: temporary, newPassword: 'short' },
    })
    assert.equal(weak.status, 400)

    const same = await raw('/api/auth/change-password', {
      method: 'POST',
      cookie,
      body: { currentPassword: temporary, newPassword: temporary },
    })
    assert.equal(same.status, 400)

    const changed = await raw('/api/auth/change-password', {
      method: 'POST',
      cookie,
      body: { currentPassword: temporary, newPassword: 'brandnewpass1' },
    })
    assert.equal(changed.status, 200)
    assert.equal(changed.data.user.mustChangePassword, false)

    const createAfter = await raw('/api/lost-items', {
      method: 'POST',
      cookie: changed.cookie,
      body: {
        itemName: 'AllowedItem',
        category: 'Accessories',
        description: 'Should be allowed now.',
        location: 'Test Lab',
        dateLost: '2026-09-01',
        contact: 'allowed@example.com',
      },
    })
    assert.equal(createAfter.status, 201)
    createdItemIds.push(createAfter.data.item.id)

    // The old temporary credential no longer works.
    const oldLogin = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn, password: temporary },
    })
    assert.equal(oldLogin.status, 401)
    const newLogin = await raw('/api/auth/login', {
      method: 'POST',
      body: { prn, password: 'brandnewpass1' },
    })
    assert.equal(newLogin.status, 200)
  })

  it('a self-registered account is not blocked by the password change gate', async () => {
    const account = await register('Normal Self Reg')
    assert.equal(account.user.mustChangePassword, false)
    const res = await raw('/api/lost-items', {
      method: 'POST',
      cookie: account.cookie,
      body: {
        itemName: 'NormalItem',
        category: 'Accessories',
        description: 'Should work.',
        location: 'Test Lab',
        dateLost: '2026-09-01',
        contact: 'normal@example.com',
      },
    })
    assert.equal(res.status, 201)
    createdItemIds.push(res.data.item.id)
  })
})

describe('Proxy trust configuration', () => {
  // The single production proxy hop (Render) is trusted so express-rate-limit
  // keys each real client correctly. Outside production the app must not trust
  // X-Forwarded-For, otherwise any client could spoof its address and evade the
  // rate limiter.
  it('does not trust forwarding headers outside production', () => {
    assert.equal(app.get('trust proxy'), false)
  })
})
