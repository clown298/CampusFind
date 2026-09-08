const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')

const app = require('../server')
const pool = require('../config/db')
const { ensureSchema } = require('../config/schema')

let server
let baseUrl
let claimantCookie = null
let ownerCookie = null
let strangerCookie = null
let claimantUserId = null
let ownerUserId = null
const createdItemIds = { lost: [], found: [] }
const createdRequestIds = []
const createdUserIds = []

async function registerUser(name) {
  const email = `${name.replace(/\s+/g, '')}_${Date.now()}_${Math.random().toString(16).slice(2)}@campus.test`
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: 'password123' }),
  })
  assert.equal(res.status, 201)
  const body = await res.json()
  createdUserIds.push(body.user.id)
  return { id: body.user.id, cookie: res.headers.get('set-cookie').split(';')[0] }
}

async function createTestPair(prefix) {
  // The lost item belongs to the owner; the claimant is a separate user.
  const lost = await pool.query(
    `INSERT INTO lost_items (item_name, category, description, location, date_lost, contact, user_id)
     VALUES ($1, $2, $3, $4, CURRENT_DATE - 3, $5, $6) RETURNING id, item_name`,
    [`${prefix} Lost Wallet`, 'Accessories', 'Recovery API test item', 'Test Lab', 'Test Contact', ownerUserId]
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

async function api(path, options = {}, cookie = claimantCookie) {
  const headers = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (cookie) headers.Cookie = cookie
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

async function createPendingRequest(prefix, overrides = {}) {
  const { lostId, foundId } = await createTestPair(prefix)
  const res = await api('/api/recovery-requests', {
    method: 'POST',
    body: {
      lostItemId: lostId,
      foundItemId: foundId,
      claimantName: 'Amit Student',
      claimantEmail: 'amit@example.com',
      claimantPhone: '9876543210',
      claimantMessage: 'This black wallet is mine, it has a small coin pocket.',
      ...overrides,
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

  const claimant = await registerUser('Recovery Claimant')
  claimantUserId = claimant.id
  claimantCookie = claimant.cookie

  const owner = await registerUser('Recovery Owner')
  ownerUserId = owner.id
  ownerCookie = owner.cookie

  const stranger = await registerUser('Recovery Stranger')
  strangerCookie = stranger.cookie
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
  it('1. GET /api/recovery-requests is private and requires login', async () => {
    const res = await api('/api/recovery-requests', {}, null)
    assert.equal(res.status, 401)
  })

  it('2. an owner can list the recovery requests on their lost item', async () => {
    await createPendingRequest('ListOwner')
    const res = await api('/api/recovery-requests', {}, ownerCookie)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.data.requests))
    assert.ok(res.data.requests.length > 0)
  })

  it('3. POST creates a pending request with email, phone and optional proofs', async () => {
    const { lostId, foundId } = await createTestPair('ReqCreate')
    const proofA = 'data:image/png;base64,' + 'A'.repeat(120)
    const proofB = 'data:image/jpeg;base64,' + 'B'.repeat(120)
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Amit Student',
        claimantEmail: 'amit@example.com',
        claimantPhone: '9876543210',
        claimantMessage: 'This black wallet is mine, it has a small coin pocket.',
        proofImages: [proofA, proofB],
      },
    })
    assert.equal(res.status, 201)
    assert.equal(res.data.request.status, 'pending')
    assert.equal(res.data.request.lostItemId, lostId)
    assert.equal(res.data.request.foundItemId, foundId)
    assert.equal(res.data.request.claimantName, 'Amit Student')
    assert.equal(res.data.request.claimantEmail, 'amit@example.com')
    assert.equal(res.data.request.claimantPhone, '9876543210')
    assert.equal(res.data.request.claimantUserId, claimantUserId)
    assert.deepEqual(res.data.request.proofImages, [proofA, proofB])
    assert.equal(res.data.request.lostItem.itemName, 'ReqCreate Lost Wallet')
    assert.equal(res.data.request.foundItem.itemName, 'ReqCreate Found Wallet')
    createdRequestIds.push(res.data.request.id)
  })

  it('4. POST works without proof images', async () => {
    const { lostId, foundId } = await createTestPair('ReqNoProof')
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Amit Student',
        claimantEmail: 'amit@example.com',
        claimantPhone: '9876543210',
        claimantMessage: 'No photo needed here.',
      },
    })
    assert.equal(res.status, 201)
    assert.deepEqual(res.data.request.proofImages, [])
    createdRequestIds.push(res.data.request.id)
  })

  it('5. POST duplicate pending request for the same pair returns 400', async () => {
    const { lostId, foundId } = await createTestPair('ReqDup')
    const body = {
      lostItemId: lostId,
      foundItemId: foundId,
      claimantName: 'First Claimant',
      claimantEmail: 'first@example.com',
      claimantPhone: '9000000001',
      claimantMessage: 'First claim for this pair.',
    }
    await api('/api/recovery-requests', { method: 'POST', body })
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: { ...body, claimantName: 'Second Claimant' },
    })
    assert.equal(res.status, 400)
    assert.match(res.data.message, /already pending/)
  })

  it('6. POST with missing required fields returns 400 with errors', async () => {
    const { lostId, foundId } = await createTestPair('ReqMissing')
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: { lostItemId: lostId, foundItemId: foundId },
    })
    assert.equal(res.status, 400)
    assert.ok(res.data.errors.claimantName)
    assert.ok(res.data.errors.claimantEmail)
    assert.ok(res.data.errors.claimantPhone)
    assert.ok(res.data.errors.claimantMessage)
  })

  it('7. POST with a bad email or bad proof images returns 400', async () => {
    const { lostId, foundId } = await createTestPair('ReqBadProof')
    const badEmail = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Bad Email',
        claimantEmail: 'not-an-email',
        claimantPhone: '9000000002',
        claimantMessage: 'Bad email test.',
      },
    })
    assert.equal(badEmail.status, 400)
    assert.ok(badEmail.data.errors.claimantEmail)

    const badProof = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: foundId,
        claimantName: 'Bad Proof',
        claimantEmail: 'badproof@example.com',
        claimantPhone: '9000000003',
        claimantMessage: 'Bad proof test.',
        proofImages: 'data:image/png;base64,AAAA',
      },
    })
    assert.equal(badProof.status, 400)
    assert.ok(badProof.data.errors.proofImages)
  })

  it('8. POST with a missing lost item returns 404', async () => {
    const { foundId } = await createTestPair('ReqMissingLost')
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: 999999,
        foundItemId: foundId,
        claimantName: 'Some Student',
        claimantEmail: 'someone@example.com',
        claimantPhone: '9000000004',
        claimantMessage: 'Item is mine.',
      },
    })
    assert.equal(res.status, 404)
    assert.match(res.data.message, /Lost item not found/)
  })

  it('9. POST with a missing found item returns 404', async () => {
    const { lostId } = await createTestPair('ReqMissingFound')
    const res = await api('/api/recovery-requests', {
      method: 'POST',
      body: {
        lostItemId: lostId,
        foundItemId: 999999,
        claimantName: 'Some Student',
        claimantEmail: 'someone@example.com',
        claimantPhone: '9000000005',
        claimantMessage: 'Item is mine.',
      },
    })
    assert.equal(res.status, 404)
    assert.match(res.data.message, /Found item not found/)
  })

  it('10. GET by id is visible only to the claimant and the lost item owner', async () => {
    const request = await createPendingRequest('ReqSingle')
    const claimantView = await api(`/api/recovery-requests/${request.id}`)
    assert.equal(claimantView.status, 200)
    assert.equal(claimantView.data.request.id, request.id)
    assert.equal(claimantView.data.request.status, 'pending')

    const ownerView = await api(`/api/recovery-requests/${request.id}`, {}, ownerCookie)
    assert.equal(ownerView.status, 200)

    const strangerView = await api(`/api/recovery-requests/${request.id}`, {}, strangerCookie)
    assert.equal(strangerView.status, 403)
  })

  it('11. GET by id for a missing private request returns 404', async () => {
    const res = await api('/api/recovery-requests/999999', {}, ownerCookie)
    assert.equal(res.status, 404)
    assert.match(res.data.message, /Recovery request not found/)
  })

  it('12. a claimant cannot update another owned request status', async () => {
    const request = await createPendingRequest('ReqClaimantForbidden')
    const res = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    })
    assert.equal(res.status, 403)
  })

  it('13. the lost item owner approves a pending request', async () => {
    const request = await createPendingRequest('ReqApprove')
    const res = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, ownerCookie)
    assert.equal(res.status, 200)
    assert.equal(res.data.request.status, 'approved')
  })

  it('14. the owner can mark an approved request as recovered', async () => {
    const request = await createPendingRequest('ReqRecovered')
    await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, ownerCookie)
    const res = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    }, ownerCookie)
    assert.equal(res.status, 200)
    assert.equal(res.data.request.status, 'recovered')
  })

  it('15. rejected requests cannot move to any other status', async () => {
    const request = await createPendingRequest('ReqRejected')
    const rejected = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'rejected' },
    }, ownerCookie)
    assert.equal(rejected.status, 200)
    const res = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    }, ownerCookie)
    assert.equal(res.status, 400)
    assert.match(res.data.message, /cannot change/)
  })

  it('16. invalid status values and missing requests return errors', async () => {
    const request = await createPendingRequest('ReqInvalid')

    const badStatus = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'not-a-status' },
    }, ownerCookie)
    assert.equal(badStatus.status, 400)

    const skippedMiddle = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    }, ownerCookie)
    assert.equal(skippedMiddle.status, 400)

    const missing = await api('/api/recovery-requests/999999/status', {
      method: 'PATCH',
      body: { status: 'approved' },
    }, ownerCookie)
    assert.equal(missing.status, 404)
  })
})