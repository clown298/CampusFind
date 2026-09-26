import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8"
        role="status"
      >
        <div className="rounded-card border border-line bg-surface px-5 py-10 text-center">
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

  return children;
}

export default ProtectedRoute;