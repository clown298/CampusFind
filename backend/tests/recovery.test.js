process.env.NODE_ENV = 'test'
// Point the single-admin rule at a throwaway account so the tests never touch
// the real admin login. Production keeps the default admin email.
process.env.ADMIN_EMAIL = 'campusfind.admin.test@campus.test'

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
let finderCookie = null
let adminCookie = null
let claimantUserId = null
let ownerUserId = null
const createdItemIds = { lost: [], found: [] }
const createdRequestIds = []
const createdUserIds = []

async function registerUser(name, email) {
  const address =
    email ||
    `${name.replace(/\s+/g, '')}_${Date.now()}_${Math.random().toString(16).slice(2)}@campus.test`
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email: address, password: 'password123' }),
  })
  assert.equal(res.status, 201)
  const body = await res.json()
  createdUserIds.push(body.user.id)
  return { id: body.user.id, cookie: res.headers.get('set-cookie').split(';')[0] }
}

async function createTestPair(prefix, finderId = null) {
  // The lost item belongs to the owner; the claimant is a separate user.
  const lost = await pool.query(
    `INSERT INTO lost_items (item_name, category, description, location, date_lost, contact, user_id)
     VALUES ($1, $2, $3, $4, CURRENT_DATE - 3, $5, $6) RETURNING id, item_name`,
    [`${prefix} Lost Wallet`, 'Accessories', 'Recovery API test item', 'Test Lab', 'Test Contact', ownerUserId]
  )
  const found = await pool.query(
    `INSERT INTO found_items (item_name, category, description, location, date_found, contact, user_id)
     VALUES ($1, $2, $3, $4, CURRENT_DATE - 1, $5, $6) RETURNING id, item_name`,
    [`${prefix} Found Wallet`, 'Accessories', 'Recovery API test item', 'Test Lab', 'Test Contact', finderId]
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

async function createPendingRequestWithFinder(prefix, finderId) {
  const { lostId, foundId } = await createTestPair(prefix, finderId)
  const res = await api('/api/recovery-requests', {
    method: 'POST',
    body: {
      lostItemId: lostId,
      foundItemId: foundId,
      claimantName: 'Amit Student',
      claimantEmail: 'amit@example.com',
      claimantPhone: '9876543210',
      claimantMessage: 'This black wallet is mine, it has a small coin pocket.',
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

  // The student who filed the Found report (the finder).
  const finder = await registerUser('Recovery Finder')
  finderCookie = finder.cookie

  const admin = await registerUser('Recovery Admin', process.env.ADMIN_EMAIL)
  adminCookie = admin.cookie
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

  it('13. the admin approves a pending request', async () => {
    const request = await createPendingRequest('ReqApprove')
    const res = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, adminCookie)
    assert.equal(res.status, 200)
    assert.equal(res.data.request.status, 'approved')
  })

  it('14. the admin marks an approved request as recovered', async () => {
    const request = await createPendingRequest('ReqRecovered')
    await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, adminCookie)
    const res = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    }, adminCookie)
    assert.equal(res.status, 200)
    assert.equal(res.data.request.status, 'recovered')
  })

  it('15. rejected requests cannot move to any other status', async () => {
    const request = await createPendingRequest('ReqRejected')
    const rejected = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'rejected' },
    }, adminCookie)
    assert.equal(rejected.status, 200)
    const res = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    }, adminCookie)
    assert.equal(res.status, 400)
    assert.match(res.data.message, /cannot change/)
  })

  it('16. invalid status values and missing requests return errors', async () => {
    const request = await createPendingRequest('ReqInvalid')

    const badStatus = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'not-a-status' },
    }, adminCookie)
    assert.equal(badStatus.status, 400)

    const skippedMiddle = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    }, adminCookie)
    assert.equal(skippedMiddle.status, 400)

    const missing = await api('/api/recovery-requests/999999/status', {
      method: 'PATCH',
      body: { status: 'approved' },
    }, adminCookie)
    assert.equal(missing.status, 404)
  })

  it('17. students get 403 for approve, reject and mark recovered', async () => {
    const forApprove = await createPendingRequest('ReqStudentApprove')
    for (const status of ['approved', 'rejected']) {
      const res = await api(`/api/recovery-requests/${forApprove.id}/status`, {
        method: 'PATCH',
        body: { status },
      }, ownerCookie)
      assert.equal(res.status, 403)
      assert.match(res.data.message, /admin/i)
    }
    // Still pending: the student's attempts changed nothing.
    const claimantTry = await api(`/api/recovery-requests/${forApprove.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, claimantCookie)
    assert.equal(claimantTry.status, 403)

    const strangerTry = await api(`/api/recovery-requests/${forApprove.id}/status`, {
      method: 'PATCH',
      body: { status: 'rejected' },
    }, strangerCookie)
    assert.equal(strangerTry.status, 403)

    await api(`/api/recovery-requests/${forApprove.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, adminCookie)
    const stillApproved = await api(`/api/recovery-requests/${forApprove.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    }, ownerCookie)
    assert.equal(stillApproved.status, 403)

    const view = await api(`/api/recovery-requests/${forApprove.id}`, {}, ownerCookie)
    assert.equal(view.status, 200)
    assert.equal(view.data.request.status, 'approved')
  })

  it('18. a student cannot reach admin endpoints without a session or as a student', async () => {
    const request = await createPendingRequest('ReqStudentEndpoint')

    const loggedOut = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, null)
    assert.equal(loggedOut.status, 401)

    for (const status of ['approved', 'rejected', 'recovered']) {
      const res = await api(`/api/recovery-requests/${request.id}/status`, {
        method: 'PATCH',
        body: { status },
      }, claimantCookie)
      assert.equal(res.status, 403)
    }

    const rows = await pool.query('SELECT status FROM recovery_requests WHERE id = $1', [
      request.id,
    ])
    assert.equal(rows.rows[0].status, 'pending')
  })

  it('19. the admin sees every request, students only their own', async () => {
    const request = await createPendingRequest('ReqAdminQueue')

    const adminList = await api('/api/recovery-requests', {}, adminCookie)
    assert.equal(adminList.status, 200)
    assert.ok(
      adminList.data.requests.some((r) => r.id === request.id),
      'admin should see a request they are not part of'
    )

    const strangerList = await api('/api/recovery-requests', {}, strangerCookie)
    assert.equal(strangerList.status, 200)
    assert.ok(!strangerList.data.requests.some((r) => r.id === request.id))
  })

  it('20. the admin can open any request, a stranger still cannot', async () => {
    const request = await createPendingRequest('ReqAdminDetail')

    const adminView = await api(`/api/recovery-requests/${request.id}`, {}, adminCookie)
    assert.equal(adminView.status, 200)
    assert.equal(adminView.data.request.id, request.id)

    const strangerView = await api(`/api/recovery-requests/${request.id}`, {}, strangerCookie)
    assert.equal(strangerView.status, 403)
  })

  it('21. only the admin account is flagged as admin', async () => {
    const admin = await api('/api/auth/me', {}, adminCookie)
    assert.equal(admin.status, 200)
    assert.equal(admin.data.user.email, process.env.ADMIN_EMAIL)
    assert.equal(admin.data.user.isAdmin, true)

    for (const cookie of [ownerCookie, claimantCookie, strangerCookie]) {
      const res = await api('/api/auth/me', {}, cookie)
      assert.equal(res.status, 200)
      assert.equal(res.data.user.isAdmin, false)
    }
  })

  it('22. the admin list keeps resolved requests (full history)', async () => {
    const approved = await createPendingRequest('ReqHistoryApproved')
    await api(`/api/recovery-requests/${approved.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, adminCookie)

    const rejected = await createPendingRequest('ReqHistoryRejected')
    await api(`/api/recovery-requests/${rejected.id}/status`, {
      method: 'PATCH',
      body: { status: 'rejected' },
    }, adminCookie)

    const recovered = await createPendingRequest('ReqHistoryRecovered')
    await api(`/api/recovery-requests/${recovered.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, adminCookie)
    await api(`/api/recovery-requests/${recovered.id}/status`, {
      method: 'PATCH',
      body: { status: 'recovered' },
    }, adminCookie)

    const res = await api('/api/recovery-requests', {}, adminCookie)
    assert.equal(res.status, 200)
    const byId = new Map(res.data.requests.map((r) => [r.id, r]))
    assert.equal(byId.get(approved.id).status, 'approved')
    assert.equal(byId.get(rejected.id).status, 'rejected')
    assert.equal(byId.get(recovered.id).status, 'recovered')

    const statuses = new Set(res.data.requests.map((r) => r.status))
    assert.ok(statuses.has('pending'), 'admin history should keep pending items too')
  })

  it('23. the admin can list every Lost and Found report', async () => {
    const lost = await api('/api/lost-items', {}, adminCookie)
    const found = await api('/api/found-items', {}, adminCookie)
    assert.equal(lost.status, 200)
    assert.equal(found.status, 200)
    assert.ok(lost.data.items.length > 0)
    assert.ok(found.data.items.length > 0)
    // Reports created by other students are visible to the admin.
    assert.ok(lost.data.items.some((item) => item.userId === ownerUserId))
  })

  it('24. the student who filed the Found report cannot approve or reject', async () => {
    const finder = await pool.query(
      'SELECT id FROM users WHERE name = $1 ORDER BY id DESC LIMIT 1',
      ['Recovery Finder']
    )
    const request = await createPendingRequestWithFinder(
      'ReqFinder',
      finder.rows[0].id
    )

    for (const status of ['approved', 'rejected', 'recovered']) {
      const res = await api(`/api/recovery-requests/${request.id}/status`, {
        method: 'PATCH',
        body: { status },
      }, finderCookie)
      assert.equal(res.status, 403)
      assert.match(res.data.message, /admin/i)
    }

    // The finder is not a party to the request, so it stays closed to them.
    const view = await api(`/api/recovery-requests/${request.id}`, {}, finderCookie)
    assert.equal(view.status, 403)

    // Only the admin can move it forward.
    const adminRes = await api(`/api/recovery-requests/${request.id}/status`, {
      method: 'PATCH',
      body: { status: 'approved' },
    }, adminCookie)
    assert.equal(adminRes.status, 200)
    assert.equal(adminRes.data.request.status, 'approved')
  })
})