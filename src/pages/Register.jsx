import { useContext, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Button from "../components/Button";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRN_RE = /^(2022|2023|2024|2025)\d{12}$/;

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
  const [prn, setPrn] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(field, value) {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "prn") setPrn(value);
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
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address.";

    const trimmedPrn = prn.replace(/[\s-]/g, "");
    if (trimmedPrn && !PRN_RE.test(trimmedPrn))
      next.prn =
        "Enter a 16-digit PRN starting with 2022, 2023, 2024 or 2025, or leave it blank.";

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
      const trimmedPrn = prn.replace(/[\s-]/g, "");
      await register(
        name.trim(),
        email.trim(),
        password,
        trimmedPrn ? trimmedPrn : undefined
      );
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Registration error:", error);
      setFormError(
        (error && error.message) ||
          "Could not create your account. Please try again."
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
      Already have an account?{" "}
      <Link
        to="/login"
        state={{ from: location.state && location.state.from }}
        className="font-semibold text-ink underline underline-offset-4 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Sign in
      </Link>
    </>
  );

  return (
    <AuthLayout
      description="Government College of Engineering, Chandrapur"
      footer={footer}
    >
      <h1 className="type-title text-2xl text-ink">Create an account</h1>
        <p className="mt-1.5 text-sm leading-6 text-mute">
          Join the campus registry to report items and track recovery requests.
        </p>

        {formError && (
          <div
            className="animate-alert-in mt-4 rounded-control border border-lost/30 bg-lost/10 p-3 text-sm text-lost"
            role="alert"
          >
            <p className="font-semibold">Registration failed</p>
            <p className="mt-1">{formError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <AuthField
            id="register-name"
            label="Full Name"
            type="text"
            name="name"
            value={name}
            onChange={(e) => handleChange("name", e.target.value)}
            autoComplete="name"
            placeholder="e.g. Aarti Sharma"
            maxLength={120}
            required
            error={errors.name}
          />
          <AuthField
            id="register-email"
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
            id="register-prn"
            label="PRN"
            type="text"
            name="prn"
            value={prn}
            onChange={(e) => handleChange("prn", e.target.value)}
            autoComplete="off"
            placeholder="e.g. 202212345678901"
            inputMode="numeric"
            maxLength={16}
            error={errors.prn}
            helper="Optional. Adding it lets you sign in with your PRN instead of email."
          />
          <AuthField
            id="register-password"
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => handleChange("password", e.target.value)}
            autoComplete="new-password"
            placeholder="Choose a password"
            required
            error={errors.password}
            helper="At least 8 characters."
          />
          <AuthField
            id="register-confirm"
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            required
            error={errors.confirmPassword}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
      </form>
    </AuthLayout>
  );
}

export default Register;
