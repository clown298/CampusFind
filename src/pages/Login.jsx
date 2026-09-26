import { useContext, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Button from "../components/Button";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

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
      <div className="w-full min-w-0 bg-ink">
        <div className="mx-auto w-full max-w-md px-4 py-16">
          <div
            className="rounded-card border border-line bg-surface p-8 text-center"
            role="status"
          >
            <p className="text-sm font-semibold text-mute">
              Checking your session…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const footer = (
    <>
      Don&rsquo;t have an account?{" "}
      <Link
        to="/register"
        state={{ from: location.state && location.state.from }}
        className="font-semibold text-ink underline underline-offset-4 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Create account
      </Link>
    </>
  );

  return (
    <AuthLayout
      description="Government College of Engineering, Chandrapur"
      footer={footer}
    >
      <h2 className="type-title text-2xl text-ink">
        Welcome back
      </h2>
        <p className="mt-2 text-sm leading-6 text-mute">
          Sign in to report items, track your reports, and manage recovery
          requests.
        </p>

        {formError && (
          <div
            className="mt-6 rounded-card border border-lost/30 bg-lost/10 p-4 text-sm text-lost"
            role="alert"
          >
            <p className="font-semibold">Login failed</p>
            <p className="mt-1">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <AuthField
            id="login-email"
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => handleChange("email", e.target.value)}
            autoComplete="email"
            placeholder="you@campus.edu"
            required
            error={errors.email}
          />
          <AuthField
            id="login-password"
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => handleChange("password", e.target.value)}
            autoComplete="current-password"
            placeholder="Your password"
            required
            error={errors.password}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
    </AuthLayout>
  );
}

export default Login;