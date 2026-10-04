// Pure unit tests for the admin rule: one exact email, no domain matching.
// This file intentionally does NOT set ADMIN_EMAIL, so it asserts the shipped
// default used by the running app.
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
  DEFAULT_ADMIN_EMAIL,
  isAdminEmail,
  isAdminUser,
} = require('../config/roles')

describe('Admin rule', () => {
  it('1. the only admin email is the existing campus admin account', () => {
    assert.equal(DEFAULT_ADMIN_EMAIL, 'nayeemaalma@gmail.com')
  })

  it('2. that exact email is admin', () => {
    assert.equal(isAdminEmail('nayeemaalma@gmail.com'), true)
    assert.equal(isAdminUser({ email: 'nayeemaalma@gmail.com' }), true)
  })

  it('3. matching ignores surrounding space and letter case only', () => {
    assert.equal(isAdminEmail('  Nayeemaalma@Gmail.com '), true)
  })

  it('4. every other account is a student', () => {
    const others = [
      'student@campus.test',
      'nayeemaalma@gmail.com.evil.test',
      'admin@gmail.com',
      'nayeemaalma@gmail.co',
      'nayeemaalma+admin@gmail.com',
      'xnayeemaalma@gmail.com',
      '@gmail.com',
      '',
    ]
    for (const email of others) {
      assert.equal(isAdminEmail(email), false, `${email} must not be admin`)
    }
  })

  it('5. missing users are never admin', () => {
    assert.equal(isAdminUser(null), false)
    assert.equal(isAdminUser(undefined), false)
    assert.equal(isAdminUser({}), false)
    assert.equal(isAdminUser({ email: null }), false)
  })
})