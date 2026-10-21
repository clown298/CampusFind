# CampusFind permission matrix

Authorization is decided by the server on every request. The browser only hides
UI it already knows the user cannot use; it never grants anything.

The `users.role` column is the source of truth for a user's role. One extra
boolean column holds an explicit grant: `can_review_recovery`.

The role is written in two trusted places only:

- the schema bootstrap (an existing account whose email matches `ADMIN_EMAIL`
  or `STAFF_EMAILS` is promoted),
- the registration handler, which always writes `student` unless the email
  matches one of those same lists.

A registration or login request can never carry a role of its own. The JWT only
contains the user id and token version; `requireAuth` re-reads the role and
permissions from the database on every request, so a change takes effect
immediately and a stale token cannot outlive a revoked grant.

## Roles

| Role | How it is created | What it can do |
| --- | --- | --- |
| `student` | Self-registration, or the provisioning script | Report items, submit and view their own recovery requests |
| `staff` | Registration by an email in `STAFF_EMAILS`, or the provisioning script | Everything a student can do, plus recovery review when explicitly granted `can_review_recovery` |
| `admin` | Registration by the `ADMIN_EMAIL` address | Everything staff can do, plus moderating any report |

## Capability matrix

| Capability | student | staff (granted) | admin |
| --- | --- | --- | --- |
| Browse lost and found listings | yes | yes | yes |
| Create a lost or found report | yes | yes | yes |
| Edit or delete **own** report | yes | yes | yes |
| Edit or delete **someone else's** report | no | no | yes |
| View own recovery request | yes | yes | yes |
| View **all** recovery requests | no | yes (with grant) | yes |
| Submit a recovery request | yes | yes | yes |
| Approve / reject / mark recovered | no | yes (with grant) | yes |
| Change own password | yes | yes | yes |

## How each capability is enforced

- **Ownership of reports** — `canManageItem(user, ownerId)` in
  `backend/server.js`. It returns true for the admin account or when the
  request user id matches the report owner id. Applied on every `PUT` and
  `DELETE` for lost and found items.
- **Recovery review** — `canReviewRecovery(user)`, which is true for the admin
  account or when `can_review_recovery` is set. Applied by the
  `requireReviewRecovery` middleware on `PATCH /api/recovery-requests/:id/status`,
  and used by the recovery list and single-request view so a reviewer sees the
  full queue while a student sees only their own requests.
- **Temporary credentials** — accounts created by the provisioning script get a
  password made from the first six digits of their PRN and
  `must_change_password = true`. While that flag is set, the
  `requirePasswordChange` middleware rejects every write route with `403`
  `PASSWORD_CHANGE_REQUIRED`, so the account cannot do anything until
  `POST /api/auth/change-password` succeeds. Changing the password also bumps
  `token_version`, which invalidates any other session that was using the
  temporary credential.

## Logging in

- **Students** may sign in with their PRN (16 digits, starting 2022–2025) and
  password, or with their email and password. Both paths always check the
  stored password hash; a well-formed PRN for an account that does not exist
  returns the same generic error as a wrong password, so login does not reveal
  whether a PRN is registered.
- **Staff and admin** sign in with their email and password. Choosing the
  staff tab in the login form does not grant anything; the role always comes
  from the database row that the password matched.
- Accounts registered before this feature existed keep their email and password
  and continue to work. Assign them a PRN with
  `node scripts/provision-students.js --assign-prn <email> <prn>` when they
  want to use PRN login.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | Exact email that owns the admin account. Defaults to `nayeemaalma@gmail.com`. Tests override it. |
| `STAFF_EMAILS` | Comma-separated emails given the staff role at registration. |
