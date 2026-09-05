const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')

const app = require('../server')
const pool = require('../config/db')
const { ensureSchema } = require('../config/schema')

let server
let baseUrl
let authCookie = null
let authUserId = null
const createdItemIds = { lost: [], found: [] }
const createdRequestIds = []
const createdUserIds = []

async function createTestPair(prefix) {
  const lost = await pool.query(
    `INSERT INTO lost_items (item_name, category, description, location, date_lost, contact)
     VALUES ($1, $2, $3, $4, CURRENT_DATE - 3, $5) RETURNING id, item_name`,
    [`${prefix} Lost Wallet`, 'Accessories', 'Recovery API test item', 'Test Lab', 'Test Contact']
  )
  const found = await pool.query(
    `INSERT INTO found_items (item_name, category, description, location, date_found, contact)
     VALUES ($1, $2, $3, $4, CURRENT_DATE - 1, $5) RETURNING id, item_name`,
    [`${prefix} Found Wallet`, 'Accessories', 'Recovery API test item', 'Test Lab', 'Test Contact']
  )
  createdItemIds.lost.push(lost.rows[0].id)
  createdItemIds.found.push(found.rows[0].id)
  return { lostId: lost.rows[0].id, foundId: found.rows[0].id }
}

async function api(path, options = {}) {
  const headers = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (authCookie) headers.Cookie = authCookie
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, data }
}

before(async () => {
  await ensureSchema()
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`

  const email = `recovery_${Date.now()}_${Math.random().toString(16).slice(2)}@campus.test`
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Recovery Tester',
      email,
      password: 'password123',
    }),
  })
  assert.equal(res.status, 201)
  const body = await res.json()
  authUserId = body.user.id
  createdUserIds.push(authUserId)
  authCookie = res.headers.get('set-cookie').split(';')[0]
})

after(async () => {
  if (createdRequestIds.length > 0) {
    await pool.query('DELETE FROM recovery_requests WHERE id = ANY($1::int[])', [
      createdRequestIds,
    ])
  }
  if (createdItemIds.lost.length > 0) {
    await pool.query('DELETE FROM lost_items WHERE id = ANY($1::int[])', [
      createdItemIds.lost,
    ])
  }
  if (createdItemIds.found.length > 0) {
    await pool.query('DELETE FROM found_items WHERE id = ANY($1::int[])', [
      createdItemIds.found,
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

describe('Recovery Requests API', () => {
  it('1. GET /api/recovery-requests returns a list of requests', async () => {
    const res = await api('/api/recovery-requests')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.requests))
  })

  it('2. POST /api/recovery-requests creates a pending request', async () => {
    const { lostId, foundId } = await createTestPair('ReqCreate')
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Amit Student',
        claimantContact: 'amit@example.com',
        claimantMessage: 'This black wallet is mine, it has a small coin pocket.',
      },
    })
    assert.equal(res.status, 201)
    assert.equal(res.data.request.status, 'pending')
    assert.equal(res.data.request.lostItemId, lostId)
    assert.equal(res.data.request.foundItemId, foundId)
    assert.equal(res.data.request.claimantName, 'Amit Student')
    assert.equal(res.data.request.claimantUserId, authUserId)
    assert.equal(res.data.request.lostItem.itemName, 'ReqCreate Lost Wallet')
    assert.equal(res.data.request.foundItem.itemName, 'ReqCreate Found Wallet')
    createdRequestIds.push(res.data.request.id)
  })

  it('3. POST duplicate pending request for the same pair returns 400', async () => {
    const { lostId, foundId } = await createTestPair('ReqDup')
    await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'First Claimant',
        claimantContact: 'first@example.com',
        claimantMessage: 'First claim for this pair.',
      },
    })
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Second Claimant',
        claimantContact: 'second@example.com',
        claimantMessage: 'Second claim for this pair.',
      },
    })
    assert.equal(res.status, 400)
    assert.match(res.data.message, /already pending/)
  })

  it('4. POST with missing required fields returns 400 with errors', async () => {
    const { lostId, foundId } = await createTestPair('ReqMissing')
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: { lostItemId: lostId, foundItemId: foundId },
    })
    assert.equal(res.status, 400)
    assert.ok(res.data.errors.claimantName)
    assert.ok(res.data.errors.claimantContact)
    assert.ok(res.data.errors.claimantMessage)
  })

  it('5. POST with a missing lost item returns 404', async () => {
    const { foundId } = await createTestPair('ReqMissingLost')
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: 999999,
        foundItemId: foundId,
        claimantName: 'Some Student',
        claimantContact: 'someone@example.com',
        claimantMessage: 'Item is mine.',
      },
    })
    assert.equal(res.status, 404)
    assert.match(res.data.message, /Lost item not found/)
  })

  it('6. POST with a missing found item returns 404', async () => {
    const { lostId } = await createTestPair('ReqMissingFound')
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: 999999,
        claimantName: 'Some Student',
        claimantContact: 'someone@example.com',
        claimantMessage: 'Item is mine.',
      },
    })
    assert.equal(res.status, 404)
    assert.match(res.data.message, /Found item not found/)
  })

  it('7. GET /api/recovery-requests/:id returns the request', async () => {
    const { lostId, foundId } = await createTestPair('ReqSingle')
    const created = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Single Claimant',
        claimantContact: 'single@example.com',
        claimantMessage: 'This one belongs to me.',
      },
    })
    createdRequestIds.push(created.data.request.id)
    const res = await api(`/api/recovery-requests/${created.data.request.id}`)
    assert.equal(res.status, 200)
    assert.equal(res.data.request.id, created.data.request.id)
    assert.equal(res.data.request.status, 'pending')
  })

  it('8. GET /api/recovery-requests/:id for a missing request returns 404', async () => {
    const res = await api('/api/recovery-requests/999999')
    assert.equal(res.status, 404)
    assert.match(res.data.message, /Recovery request not found/)
  })

  it('9. PATCH pending -> approved returns the updated request', async () => {
    const { lostId, foundId } = await createTestPair('ReqApprove')
    const created = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Approve Claimant',
        claimantContact: 'approve@example.com',
        claimantMessage: 'Approval test request.',
      },
    })
    createdRequestIds.push(created.data.request.id)
    const res = await api(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.request.status, 'approved')
  })

  it('10. PATCH approved -> recovered returns the updated request', async () => {
    const { lostId, foundId } = await createTestPair('ReqRecovered')
    const created = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Recovered Claimant',
        claimantContact: 'recovered@example.com',
        claimantMessage: 'Recovered test request.',
      },
    })
    createdRequestIds.push(created.data.request.id)
    await api(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    })
    const res = await api(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    })
    assert.equal(res.status, 200)
    assert.equal(res.data.request.status, 'recovered')
  })

  it('11. rejected requests cannot move to any other status', async () => {
    const { lostId, foundId } = await createTestPair('ReqRejected')
    const created = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Rejected Claimant',
        claimantContact: 'rejected@example.com',
        claimantMessage: 'Rejected test request.',
      },
    })
    createdRequestIds.push(created.data.request.id)
    const rejected = await api(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      body: { status: 'rejected' },
    })
    assert.equal(rejected.status, 200)
    const res = await api(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    })
    assert.equal(res.status, 400)
    assert.match(res.data.message, /cannot change/)
  })

  it('12. invalid status values and missing requests return errors', async () => {
    const { lostId, foundId } = await createTestPair('ReqInvalid')
    const created = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Invalid Claimant',
        claimantContact: 'invalid@example.com',
        claimantMessage: 'Invalid transition test request.',
      },
    })
    createdRequestIds.push(created.data.request.id)

    const badStatus = await api(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      body: { status: 'not-a-status' },
    })
    assert.equal(badStatus.status, 400)

    const skippedMiddle = await api(`/api/recovery-requests/${created.data.request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    })
    assert.equal(skippedMiddle.status, 400)

    const missing = await api('/api/recovery-requests/999999/status', {
      method: 'PATCH',
      body: { status: 'approved' },
    })
    assert.equal(missing.status, 404)
  })
})