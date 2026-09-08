import { useContext, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import PageShell from "../components/PageShell";
import Button from "../components/Button";

function Login() {
  const { isAuthenticated, loading, login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const from =
    location.state && location.state.from
      ? `${location.state.from.pathname || "/"}${location.state.from.search || ""}`
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field, value) {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
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

  async function handleSubmit(e) {
    e.preventDefault();

    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setFormError(
        (error && error.message) || "Could not log in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Login" description="Log in to your CampusFind account.">
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
      title="Login"
      description="Log in to submit reports, request recoveries, and manage your reports."
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
              <p className="font-semibold">Login failed</p>
              <p className="mt-1">{formError}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Email
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                autoComplete="email"
                placeholder="you@campus.edu"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.email
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.email && (
                <p
                  id="login-email-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Password
                <span className="ml-1 text-lost" aria-hidden="true">
                  *
                </span>
                <span className="sr-only">(required)</span>
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => handleChange("password", e.target.value)}
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
                className={`w-full min-h-[44px] rounded-[6px] border px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-surface transition-colors duration-150 ${
                  errors.password
                    ? "border-lost bg-lost/5 focus-visible:ring-lost"
                    : "border-line bg-surface hover:border-mute/40"
                }`}
              />
              {errors.password && (
                <p
                  id="login-password-error"
                  className="mt-1.5 text-sm font-medium text-lost"
                >
                  {errors.password}
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
              variant="ink"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Logging in…" : "Login"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-mute">
          Don't have an account?{" "}
          <Link
            to="/register"
            state={{ from: location.state && location.state.from }}
            className="font-semibold text-ink underline underline-offset-4 hover:text-brick focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Register
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

export default Login;