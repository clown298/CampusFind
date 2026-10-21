import { createContext, useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

export const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest("/api/auth/me");
        if (cancelled) return;
        setUser(data && data.user ? data.user : null);
      } catch {
        if (cancelled) return;
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login({ email, prn, password }) {
    const body = prn ? { prn, password } : { email, password };
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body,
    });
    const loggedIn = data && data.user;
    if (!loggedIn) {
      const err = new Error("Login failed. Please try again.");
      err.code = "API_ERROR";
      throw err;
    }
    setUser(loggedIn);
    return loggedIn;
  }

  async function register(name, email, password, prn) {
    const body = { name, email, password };
    if (prn) body.prn = prn;
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body,
    });
    const newUser = data && data.user;
    if (!newUser) {
      const err = new Error("Registration failed. Please try again.");
      err.code = "API_ERROR";
      throw err;
    }
    setUser(newUser);
    return newUser;
  }

  async function changePassword(currentPassword, newPassword) {
    const data = await apiRequest("/api/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
    const updated = data && data.user;
    if (!updated) {
      const err = new Error("Could not update your password.");
      err.code = "API_ERROR";
      throw err;
    }
    setUser(updated);
    return updated;
  }

  async function logout() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }

  async function refreshUser() {
    try {
      const data = await apiRequest("/api/auth/me");
      setUser(data && data.user ? data.user : null);
      return data && data.user ? data.user : null;
    } catch {
      setUser(null);
      return null;
    }
  }

  const permissions = (user && user.permissions) || {};

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: Boolean(user && user.isAdmin),
        isStaff: Boolean(user && user.role === "staff"),
        role: (user && user.role) || "student",
        mustChangePassword: Boolean(user && user.mustChangePassword),
        canReviewRecovery: Boolean(permissions.reviewRecovery),
        login,
        register,
        changePassword,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;