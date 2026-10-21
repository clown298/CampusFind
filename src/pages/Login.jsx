import { useContext, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Button from "../components/Button";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRN_RE = /^(2022|2023|2024|2025)\d{12}$/;

const MODES = [
  { id: "student", label: "Student" },
  { id: "staff", label: "Staff / Admin" },
];

function Login() {
  const { isAuthenticated, loading, login } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const from =
    location.state && location.state.from
      ? `${location.state.from.pathname || "/"}${location.state.from.search || ""}`
      : "/";

  const [mode, setMode] = useState("student");
  const [prn, setPrn] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const modeRefs = useRef([]);

  function selectMode(nextMode) {
    setMode(nextMode);
    setPrn("");
    setEmail("");
    setPassword("");
    setErrors({});
    setFormError("");
  }

  function onModeKeyDown(event, index) {
    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % MODES.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + MODES.length) % MODES.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = MODES.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const next = MODES[nextIndex].id;
    setMode(next);
    setErrors({});
    setFormError("");
    if (modeRefs.current[nextIndex]) modeRefs.current[nextIndex].focus();
  }

  function handleChange(field, value) {
    if (field === "prn") setPrn(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setErrors((prev) => {
      if (prev[field] || (field === "password" && prev.identifier)) {
        const next = { ...prev };
        delete next[field];
        delete next.identifier;
        return next;
      }
      return prev;
    });
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const next = {};
    if (mode === "student") {
      const trimmed = prn.replace(/[\s-]/g, "");
      if (!trimmed) next.prn = "PRN is required.";
      else if (!PRN_RE.test(trimmed))
        next.prn = "Enter a 16-digit PRN starting with 2022, 2023, 2024 or 2025.";
    } else if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!password) next.password = "Password is required.";

    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      if (mode === "student") {
        await login({ prn: prn.replace(/[\s-]/g, ""), password });
      } else {
        await login({ email: email.trim(), password });
      }
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
      <div className="flex w-full min-w-0 flex-1 items-center justify-center bg-paper px-4 py-16">
        <div
          className="w-full max-w-md rounded-card border border-line bg-surface p-8 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-mute">
            Checking your session…
          </p>
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
      motifAway={passwordFocused}
    >
      <h1 className="type-title text-2xl text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm leading-6 text-mute">
        Sign in to track your reports, recovery requests, and listings.
      </p>

      {formError && (
        <div
          className="mt-4 rounded-control border border-lost/30 bg-lost/10 p-3 text-sm text-lost animate-alert-in"
          role="alert"
        >
          <p className="font-semibold">Login failed</p>
          <p className="mt-1">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div>
          <span
            id="login-role-label"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Sign in as
          </span>
          <div
            role="radiogroup"
            aria-labelledby="login-role-label"
            className="grid grid-cols-2 gap-1 rounded-control border border-line bg-frost p-1"
          >
            {MODES.map((item, index) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    modeRefs.current[index] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectMode(item.id)}
                  onKeyDown={(e) => onModeKeyDown(e, index)}
                  className={`min-h-[40px] cursor-pointer rounded-[0.375rem] px-3 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-frost ${
                    active
                      ? "bg-surface text-ink shadow-sm"
                      : "text-ink/80 hover:text-ink hover:bg-surface/50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {mode === "student" ? (
          <AuthField
            id="login-prn"
            label="PRN"
            type="text"
            name="prn"
            value={prn}
            onChange={(e) => handleChange("prn", e.target.value)}
            autoComplete="off"
            placeholder="e.g. 202212345678901"
            inputMode="numeric"
            maxLength={16}
            required
            error={errors.prn}
            helper="Your 16-digit Permanent Registration Number."
          />
        ) : (
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
        )}

        <AuthField
          id="login-password"
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => handleChange("password", e.target.value)}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
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
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Login;
