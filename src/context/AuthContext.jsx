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

  async function login(email, password) {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: { email, password },
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

  async function register(name, email, password) {
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: Boolean(user && user.isAdmin),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;