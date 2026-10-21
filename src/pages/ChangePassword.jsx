import { useContext, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Button from "../components/Button";
import AuthField from "../components/AuthField";
import AuthLayout from "../components/AuthLayout";

function ChangePassword() {
  const { isAuthenticated, loading, mustChangePassword, changePassword, logout } =
    useContext(AuthContext);
  const location = useLocation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function handleChange(field, value) {
    if (field === "currentPassword") setCurrentPassword(value);
    if (field === "newPassword") setNewPassword(value);
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
    if (!currentPassword) next.currentPassword = "Current password is required.";
    if (!newPassword) next.newPassword = "Please choose a new password.";
    else if (newPassword.length < 8)
      next.newPassword = "Password must be at least 8 characters.";
    else if (newPassword === currentPassword)
      next.newPassword = "Choose a password different from your current one.";
    if (newPassword && confirmPassword !== newPassword)
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
      await changePassword(currentPassword, newPassword);
      setDone(true);
    } catch (error) {
      console.error("Change password error:", error);
      const apiErrors = error && error.errors;
      if (apiErrors && typeof apiErrors === "object") {
        setErrors(apiErrors);
      }
      setFormError(
        (error && error.message) ||
          "Could not update your password. Please try again."
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

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: location.pathname, search: location.search } }}
      />
    );
  }

  if (done || !mustChangePassword) {
    return <Navigate to="/my-reports" replace />;
  }

  const footer = (
    <button
      type="button"
      onClick={() => logout()}
      className="font-semibold text-ink underline underline-offset-4 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      Sign out instead
    </button>
  );

  return (
    <AuthLayout
      description="Government College of Engineering, Chandrapur"
      footer={footer}
      badgeText="Account setup"
    >
      <h1 className="type-title text-2xl text-ink">Set a new password</h1>
      <p className="mt-1.5 text-sm leading-6 text-mute">
        Your account was issued a temporary password. Choose a new one before
        you continue.
      </p>

      {formError && (
        <div
          className="animate-alert-in mt-4 rounded-control border border-lost/30 bg-lost/10 p-3 text-sm text-lost"
          role="alert"
        >
          <p className="font-semibold">Could not update password</p>
          <p className="mt-1">{formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <AuthField
          id="change-current"
          label="Current password"
          type="password"
          name="currentPassword"
          value={currentPassword}
          onChange={(e) => handleChange("currentPassword", e.target.value)}
          autoComplete="current-password"
          placeholder="Your current password"
          required
          error={errors.currentPassword}
        />
        <AuthField
          id="change-new"
          label="New password"
          type="password"
          name="newPassword"
          value={newPassword}
          onChange={(e) => handleChange("newPassword", e.target.value)}
          autoComplete="new-password"
          placeholder="Choose a new password"
          required
          error={errors.newPassword}
          helper="At least 8 characters, and different from the current one."
        />
        <AuthField
          id="change-confirm"
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          autoComplete="new-password"
          placeholder="Re-enter the new password"
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
          {isSubmitting ? "Updating password…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default ChangePassword;
