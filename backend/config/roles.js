// Admin identity for the CampusFind demo.
//
// There is exactly one admin account, identified by one exact email address.
// There is no admin registration page, no domain rule and no second admin.
//
// To move to a real `users.role = 'admin'` column later, change only
// isAdminEmail() to read that column; every caller already goes through
// isAdminUser(), so the recovery workflow stays untouched.
const DEFAULT_ADMIN_EMAIL = 'nayeemaalma@gmail.com'

// ADMIN_EMAIL only exists so the API tests can point at a throwaway account.
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
  .trim()
  .toLowerCase()

// Accounts are stored lower-cased, so compare lower-cased: this stays an exact
// match instead of a loose/domain-based rule.
function isAdminEmail(email) {
  if (typeof email !== 'string') return false
  return email.trim().toLowerCase() === ADMIN_EMAIL
}

function isAdminUser(user) {
  return Boolean(user) && isAdminEmail(user.email)
}

module.exports = {
  DEFAULT_ADMIN_EMAIL,
  ADMIN_EMAIL,
  isAdminEmail,
  isAdminUser,
}