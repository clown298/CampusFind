import { useContext, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register() {
  const { isAuthenticated, loading, register } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const from =
    location.state && location.state.from
      ? `${location.state.from.pathname || "/"}${location.state.from.search || ""}`
      : "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field, value) {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);
    setErrors((prev) => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
    setFormError("");
  }

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "Full name is required.";
    else if (name.trim().length > 120)
      next.name = "Full name must be 120 characters or fewer.";

    if (!email.trim()) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";

    if (!password) next.password = "Please choose a password.";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters.";

    if (password && confirmPassword !== password)
      next.confirmPassword = "Passwords do not match.";

    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const next = validate();
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Registration error:", error);
      setFormError(
        (error && error.message) || "Could not create your account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell
        title="Register"
        description="Create your CampusFind account."
      >
        <div
          className="mx-auto w-full max-w-md rounded-[8px] border border-line bg-surface px-5 py-10 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Checking your session…
          </p>
        </div>
      </PageShell>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <PageShell
      title="Register"
      description="Create a free CampusFind account to report items and request recoveries."
    >
      <div className="mx-auto w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-[6px] border border-line bg-surface p-5 sm:p-8"
        >
          {formError && (
            <div
              className="mb-6 rounded-[6px] border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
              role="alert"
            >
              <p className="font-semibold">Registration failed</p>
              <p className="mt-1">{formError}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="register-name"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Full Name
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="register-name"
                type="text"
                name="name"
                value={name}
                onChange={(e) => handleChange("name", e.target.value)}
                autoComplete="name"
                placeholder="e.g. Aarti Sharma"
                maxLength={120}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "register-name-error" : undefined}
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.name
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.name && (
                <p
                  id="register-name-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Email
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                autoComplete="email"
                placeholder="you@campus.edu"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "register-email-error" : undefined}
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.email
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.email && (
                <p
                  id="register-email-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Password
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="register-password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => handleChange("password", e.target.value)}
                autoComplete="new-password"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={
                  errors.password ? "register-password-error" : undefined
                }
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.password
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              <p className="mt-1.5 text-xs text-mute">
                At least 8 characters.
              </p>
              {errors.password && (
                <p
                  id="register-password-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="register-confirm"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Confirm Password
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="register-confirm"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                autoComplete="new-password"
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                aria-describedby={
                  errors.confirmPassword ? "register-confirm-error" : undefined
                }
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.confirmPassword
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.confirmPassword && (
                <p
                  id="register-confirm-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row">
            <Button
              variant="secondary"
              to="/"
              className="w-full sm:w-auto"
              aria-label="Cancel and go back to the homepage"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="save"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-mute">
          Already have an account?{" "}
          <Link
            to="/login"
            state={{ from: location.state && location.state.from }}
            className="font-semibold text-ink underline underline-offset-4 hover:text-brick focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Login
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

export default Register;