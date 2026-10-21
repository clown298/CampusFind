// Role and permission rules for CampusFind.
//
// The database column users.role is the single source of truth for a user's
// role. Email-based rules below exist only as a bootstrap so that a freshly
// provisioned database already has the admin account, and so the API tests can
// point the admin at a throwaway account via ADMIN_EMAIL.
//
// Rule: a client can never choose its own role. Registration always writes
// 'student' unless the email matches a bootstrap list below, and every request
// re-reads the role from the database in requireAuth().
const DEFAULT_ADMIN_EMAIL = 'nayeemaalma@gmail.com'

const ROLES = Object.freeze({
  STUDENT: 'student',
  STAFF: 'staff',
  ADMIN: 'admin',
})

const VALID_ROLES = new Set(Object.values(ROLES))

// ADMIN_EMAIL only exists so the API tests can point at a throwaway account.
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL)
  .trim()
  .toLowerCase()

// STAFF_EMAILS bootstraps staff accounts that are allowed to review recovery
// requests. Comma-separated. These accounts still need a real staff record in
// the users table; the list only decides the role written at registration.
function parseEmailList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

const STAFF_EMAILS = new Set(parseEmailList(process.env.STAFF_EMAILS))

// A student PRN is 16 digits and starts with an admission year in the range
// the campus currently serves. Validated on registration and on PRN login.
const PRN_LENGTH = 16
const PRN_YEARS = ['2022', '2023', '2024', '2025']
const PRN_RE = new RegExp(`^(${PRN_YEARS.join('|')})\\d{12}$`)

function normalizePrn(value) {
  return String(value == null ? '' : value).replace(/[\s-]/g, '')
}

function isValidPrn(value) {
  return PRN_RE.test(normalizePrn(value))
}

function prnError(value) {
  const prn = normalizePrn(value)
  if (!prn) return 'PRN is required.'
  if (!/^\d+$/.test(prn)) return 'PRN must contain digits only.'
  if (prn.length !== PRN_LENGTH) return `PRN must be exactly ${PRN_LENGTH} digits.`
  if (!PRN_RE.test(prn)) {
    return `PRN must start with one of ${PRN_YEARS.join(', ')}.`
  }
  return null
}

// Accounts are stored lower-cased, so compare lower-cased: this stays an exact
// match instead of a loose/domain-based rule.
function isAdminEmail(email) {
  if (typeof email !== 'string') return false
  return email.trim().toLowerCase() === ADMIN_EMAIL
}

function isStaffEmail(email) {
  if (typeof email !== 'string') return false
  return STAFF_EMAILS.has(email.trim().toLowerCase())
}

// Role written for a newly registered account. The browser never supplies it.
function roleForNewAccount(email) {
  if (isAdminEmail(email)) return ROLES.ADMIN
  if (isStaffEmail(email)) return ROLES.STAFF
  return ROLES.STUDENT
}

function isAdminUser(user) {
  return Boolean(user) && (user.role === ROLES.ADMIN || isAdminEmail(user.email))
}

function isStaffUser(user) {
  return Boolean(user) && user.role === ROLES.STAFF
}

// Permission checks. Admin keeps full recovery control; staff only reviews
// when explicitly granted the permission.
function canReviewRecovery(user) {
  if (!user) return false
  if (isAdminUser(user)) return true
  return Boolean(user.can_review_recovery)
}

module.exports = {
  ROLES,
  VALID_ROLES,
  DEFAULT_ADMIN_EMAIL,
  ADMIN_EMAIL,
  STAFF_EMAILS,
  PRN_LENGTH,
  PRN_YEARS,
  PRN_RE,
  normalizePrn,
  isValidPrn,
  prnError,
  isAdminEmail,
  isStaffEmail,
  roleForNewAccount,
  isAdminUser,
  isStaffUser,
  canReviewRecovery,
}
