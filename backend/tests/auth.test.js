const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const bcrypt = require('bcryptjs')

const app = require('../server')
const pool = require('../config/db')
const { ensureSchema } = require('../config/schema')

let server
let baseUrl
const createdUserIds = []
const createdItems = { lost: [], found: [] }
const createdRequestIds = []
let sequence = 0

function uniqueEmail(prefix) {
  sequence += 1
  return `${prefix}${sequence}_${Date.now()}@campus.test`
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

async function register(name) {
  const email = uniqueEmail('user')
  const res = await raw('/api/auth/register', {
    method: 'POST',
    body: { name, email, password: 'password123' },
  })
  assert.equal(res.status, 201)
  createdUserIds.push(res.data.user.id)
  return { user: res.data.user, email, cookie: res.cookie }
}

function itemBody(kind, name) {
  if (kind === 'lost') {
    return {
      itemName: name,
      category: 'Accessories',
      description: 'Auth test lost item',
      location: 'Test Lab',
      dateLost: '2026-09-01',
      contact: 'auth@example.com',
    }
  }
  return {
    itemName: name,
    category: 'Accessories',
    description: 'Auth test found item',
    location: 'Test Lab',
    dateFound: '2026-09-02',
    contact: 'auth@example.com',
  }
}

async function createItem(kind, name, cookie) {
  const res = await raw(`/api/${kind}-items`, {
    method: 'POST',
    body: itemBody(kind, name),
    cookie,
  })
  assert.equal(res.status, 201)
  createdItems[kind].push(res.data.item.id)
  return res.data.item
}

before(async () => {
  await ensureSchema()
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (createdRequestIds.length > 0) {
    await pool.query('DELETE FROM recovery_requests WHERE id = ANY($1::int[])', [
      createdRequestIds,
    ])
  }
  if (createdItems.lost.length > 0) {
    await pool.query('DELETE FROM lost_items WHERE id = ANY($1::int[])', [
      createdItems.lost,
    ])
  }
  if (createdItems.found.length > 0) {
    await pool.query('DELETE FROM found_items WHERE id = ANY($1::int[])', [
      createdItems.found,
    ])
  }
  if (createdUserIds.length > 0) {
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [
      createdUserIds,
    ])
  }
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
})

describe('Phase 6 - Auth API', () => {
  it('1. register creates an account and signs the user in', async () => {
    const email = uniqueEmail('reg')
    const res = await raw('/api/auth/register', {
      method: 'POST',
      body: { name: 'Reg User', email, password: 'password123' },
    })
    assert.equal(res.status, 201)
    assert.ok(res.data.user.id)
    assert.equal(res.data.user.name, 'Reg User')
    assert.equal(res.data.user.email, email)
    assert.ok(!('password' in res.data.user))
    assert.ok(!('password_hash' in res.data.user))
    assert.ok(res.cookie)
    createdUserIds.push(res.data.user.id)
  })

  it('2. duplicate email registration is rejected with 409', async () => {
    const email = uniqueEmail('dup')
    const first = await raw('/api/auth/register', {
      method: 'POST',
      body: { name: 'Dup One', email, password: 'password123' },
    })
    assert.equal(first.status, 201)
    createdUserIds.push(first.data.user.id)
    const res = await raw('/api/auth/register', {
      method: 'POST',
      body: { name: 'Dup Two', email, password: 'password123' },
    })
    assert.equal(res.status, 409)
    assert.match(res.data.message, /already exists/)
  })

  it('3. passwords are stored hashed, never in plaintext', async () => {
    const account = await register('Hash User')
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [
      account.user.id,
    ])
    const hash = result.rows[0].password_hash
    assert.notEqual(hash, 'password123')
    assert.ok(hash.startsWith('$2'))
    assert.equal(await bcrypt.compare('password123', hash), true)
  })

  it('4. login succeeds with the right credentials', async () => {
    const account = await register('Login User')
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { email: account.email, password: 'password123' },
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.user.email, account.email)
    assert.ok(res.cookie)
  })

  it('5. login with a wrong password returns 401', async () => {
    const account = await register('Wrong Pass')
    const res = await raw('/api/auth/login', {
      method: 'POST',
      body: { email: account.email, password: 'wrongpassword' },
    })
    assert.equal(res.status, 401)
  })

  it('6. /api/auth/me returns the current user when logged in', async () => {
    const account = await register('Me User')
    const res = await raw('/api/auth/me', { cookie: account.cookie })
    assert.equal(res.status, 200)
    assert.equal(res.data.user.id, account.user.id)
    assert.equal(res.data.user.email, account.email)
  })

  it('7. /api/auth/me returns 401 when logged out', async () => {
    const res = await raw('/api/auth/me')
    assert.equal(res.status, 401)
    assert.match(res.data.message, /log in/i)
  })

  it('8. logout invalidates the session cookie', async () => {
    const account = await register('Logout User')
    const meBefore = await raw('/api/auth/me', { cookie: account.cookie })
    assert.equal(meBefore.status, 200)

    const logout = await raw('/api/auth/logout', { method: 'POST', cookie: account.cookie })
    assert.equal(logout.status, 200)

    const meAfter = await raw('/api/auth/me', { cookie: account.cookie })
    assert.equal(meAfter.status, 401)
  })
})

describe('Phase 6 - Ownership', () => {
  it('9. authenticated user can create a Lost report and owns it', async () => {
    const account = await register('Lost Owner')
    const item = await createItem('lost', 'AuthLostOne', account.cookie)
    assert.equal(item.userId, account.user.id)
  })

  it('10. authenticated user can create a Found report and owns it', async () => {
    const account = await register('Found Owner')
    const item = await createItem('found', 'AuthFoundOne', account.cookie)
    assert.equal(item.userId, account.user.id)
  })

  it('11. created reports are stored with the authenticated user id', async () => {
    const account = await register('Db Owner')
    await createItem('lost', 'DbLostOne', account.cookie)
    await createItem('found', 'DbFoundOne', account.cookie)

    const lostRows = await pool.query('SELECT user_id FROM lost_items WHERE item_name = $1', [
      'DbLostOne',
    ])
    const foundRows = await pool.query('SELECT user_id FROM found_items WHERE item_name = $1', [
      'DbFoundOne',
    ])
    assert.equal(lostRows.rows[0].user_id, account.user.id)
    assert.equal(foundRows.rows[0].user_id, account.user.id)
  })

  it('12. user can edit their own report', async () => {
    const account = await register('Editor')
    const item = await createItem('lost', 'EditMe', account.cookie)
    const res = await raw(`/api/lost-items/${item.id}`, {
      method: 'PUT',
      cookie: account.cookie,
      body: { ...itemBody('lost', 'EditMeRenamed'), description: 'Updated description.' },
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.item.itemName, 'EditMeRenamed')
    assert.equal(res.data.item.description, 'Updated description.')
  })

  it('13. user can delete their own report', async () => {
    const account = await register('Deleter')
    const item = await createItem('lost', 'DeleteMe', account.cookie)
    const del = await raw(`/api/lost-items/${item.id}`, {
      method: 'DELETE',
      cookie: account.cookie,
    })
    assert.equal(del.status, 200)
    const gone = await raw(`/api/lost-items/${item.id}`)
    assert.equal(gone.status, 404)
  })

  it('14. user cannot edit another user report (403)', async () => {
    const owner = await register('Owner A')
    const intruder = await register('Owner B')
    const item = await createItem('lost', 'ProtectedLost', owner.cookie)
    const res = await raw(`/api/lost-items/${item.id}`, {
      method: 'PUT',
      cookie: intruder.cookie,
      body: { ...itemBody('lost', 'Hijacked'), description: 'Evil edit.' },
    })
    assert.equal(res.status, 403)
    assert.match(res.data.message, /permission/)
  })

  it('15. user cannot delete another user report (403)', async () => {
    const owner = await register('Owner C')
    const intruder = await register('Owner D')
    const item = await createItem('found', 'ProtectedFound', owner.cookie)
    const res = await raw(`/api/found-items/${item.id}`, {
      method: 'DELETE',
      cookie: intruder.cookie,
    })
    assert.equal(res.status, 403)
  })
})

describe('Phase 6 - Public access', () => {
  it('16. logged-out users can list Lost reports', async () => {
    const account = await register('List Lost')
    await createItem('lost', 'PublicLostList', account.cookie)
    const res = await raw('/api/lost-items')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.items))
    assert.ok(res.data.items.length > 0)
  })

  it('17. logged-out users can list Found reports', async () => {
    const account = await register('List Found')
    await createItem('found', 'PublicFoundList', account.cookie)
    const res = await raw('/api/found-items')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.items))
    assert.ok(res.data.items.length > 0)
  })

  it('18. logged-out users can view item details', async () => {
    const account = await register('Detail Owner')
    const item = await createItem('found', 'PublicFoundDetail', account.cookie)
    const res = await raw(`/api/found-items/${item.id}`)
    assert.equal(res.status, 200)
    assert.equal(res.data.item.itemName, 'PublicFoundDetail')
  })
})

describe('Phase 6 - Recovery requests', () => {
  it('19. logged-out users cannot submit a recovery request (401)', async () => {
    const lost = await pool.query(
      `INSERT INTO lost_items (item_name, category, description, location, date_lost, contact)
       VALUES ('AuthNoAuthLost', 'Accessories', 'Missing auth test item', 'Test Lab', CURRENT_DATE - 3, 'nc@test')
       RETURNING id`
    )
    createdItems.lost.push(lost.rows[0].id)
    const found = await pool.query(
      `INSERT INTO found_items (item_name, category, description, location, date_found, contact)
       VALUES ('AuthNoAuthFound', 'Accessories', 'No auth found item', 'Test Lab', CURRENT_DATE - 1, 'nc@test')
       RETURNING id`
    )
    createdItems.found.push(found.rows[0].id)

    const res = await raw('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lost.rows[0].id,
        foundItemId: found.rows[0].id,
        claimantName: 'No Auth',
        claimantContact: 'noauth@test',
        claimantMessage: 'This is mine.',
      },
    })
    assert.equal(res.status, 401)
    assert.match(res.data.message, /log in/i)
  })

  it('20. logged-in users can submit a recovery request (201)', async () => {
    const account = await register('Recov User')
    const lost = await createItem('lost', 'RecovLost', account.cookie)
    const found = await createItem('found', 'RecovFound', account.cookie)
    const res = await raw('/api/recovery-requests', {
      method: 'POST',
      cookie: account.cookie,
      body: {
        lostItemId: lost.id,
        foundItemId: found.id,
        claimantName: account.user.name,
        claimantEmail: account.email,
        claimantPhone: '9000000000',
        claimantMessage: 'This pair belongs to me.',
      },
    })
    assert.equal(res.status, 201)
    assert.equal(res.data.request.status, 'pending')
    createdRequestIds.push(res.data.request.id)
  })

  it('21. recovery requests remember their authenticated claimant', async () => {
    const account = await register('Claimant')
    const lost = await createItem('lost', 'ClaimLost', account.cookie)
    const found = await createItem('found', 'ClaimFound', account.cookie)
    const res = await raw('/api/recovery-requests', {
      method: 'POST',
      cookie: account.cookie,
      body: {
        lostItemId: lost.id,
        foundItemId: found.id,
        claimantName: account.user.name,
        claimantEmail: account.email,
        claimantPhone: '9000000000',
        claimantMessage: 'Claim ownership test.',
      },
    })
    assert.equal(res.status, 201)
    assert.equal(res.data.request.claimantUserId, account.user.id)
    createdRequestIds.push(res.data.request.id)

    const rows = await pool.query(
      'SELECT claimant_user_id FROM recovery_requests WHERE id = $1',
      [res.data.request.id]
    )
    assert.equal(rows.rows[0].claimant_user_id, account.user.id)
  })

  it('22. Phase 5 status transitions still work with auth', async () => {
    const account = await register('Transition')
    const lost = await createItem('lost', 'TransLost', account.cookie)
    const found = await createItem('found', 'TransFound', account.cookie)
    const created = await raw('/api/recovery-requests', {
      method: 'POST',
      cookie: account.cookie,
      body: {
        lostItemId: lost.id,
        foundItemId: found.id,
        claimantName: account.user.name,
        claimantEmail: account.email,
        claimantPhone: '9000000000',
        claimantMessage: 'Transition test.',
      },
    })
    assert.equal(created.status, 201)
    createdRequestIds.push(created.data.request.id)

    const approved = await raw(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      cookie: account.cookie,
      body: { status: 'approved' },
    })
    assert.equal(approved.status, 200)
    assert.equal(approved.data.request.status, 'approved')

    const recovered = await raw(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      cookie: account.cookie,
      body: { status: 'recovered' },
    })
    assert.equal(recovered.status, 200)
    assert.equal(recovered.data.request.status, 'recovered')

    const again = await raw(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      cookie: account.cookie,
      body: { status: 'approved' },
    })
    assert.equal(again.status, 400)
  })
})

describe('Phase 6 - My reports', () => {
  it('23. authenticated users see only their own Lost reports', async () => {
    const me = await register('My Lost Owner')
    const other = await register('Other Lost Owner')
    await createItem('lost', 'MyLostOne', me.cookie)
    await createItem('lost', 'MyLostTwo', me.cookie)
    await createItem('lost', 'OthersLost', other.cookie)

    const res = await raw('/api/my-reports', { cookie: me.cookie })
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.lostItems))
    assert.equal(res.data.lostItems.length, 2)
    for (const item of res.data.lostItems) {
      assert.equal(item.userId, me.user.id)
    }
  })

  it('24. authenticated users see only their own Found reports', async () => {
    const me = await register('My Found Owner')
    const other = await register('Other Found Owner')
    await createItem('found', 'MyFoundOne', me.cookie)
    await createItem('found', 'MyFoundTwo', me.cookie)
    await createItem('found', 'OthersFound', other.cookie)

    const res = await raw('/api/my-reports', { cookie: me.cookie })
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.foundItems))
    assert.equal(res.data.foundItems.length, 2)
    for (const item of res.data.foundItems) {
      assert.equal(item.userId, me.user.id)
    }
  })

  it('25. unauthenticated My Reports requests return 401', async () => {
    const res = await raw('/api/my-reports')
    assert.equal(res.status, 401)
    assert.match(res.data.message, /log in/i)
  })
})