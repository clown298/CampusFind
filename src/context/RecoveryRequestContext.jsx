import { createContext, useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

export const RecoveryRequestContext = createContext();

function RecoveryRequestProvider({ children }) {
  const [recoveryRequests, setRecoveryRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  function dismissLoadError() {
    setLoadError(null);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await apiRequest("/api/recovery-requests");
        if (cancelled) return;
        const requests =
          data && Array.isArray(data.requests) ? data.requests : [];
        setRecoveryRequests(requests);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        console.error(
          "[RecoveryRequestContext] Failed to load recovery requests from API:",
          err
        );
        setLoadError(
          "Could not load recovery requests. Please check your connection and try again."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function createRecoveryRequest(payload) {
    const data = await apiRequest("/api/recovery-requests", {
      method: "POST",
      body: payload,
    });
    const savedRequest = data && data.request;
    if (!savedRequest) {
      const err = new Error("Failed to submit recovery request.");
      err.code = "API_ERROR";
      throw err;
    }
    setRecoveryRequests((prev) => [savedRequest, ...prev]);
    return savedRequest;
  }

  async function updateRecoveryRequestStatus(id, status) {
    const data = await apiRequest(`/api/recovery-requests/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    const updatedRequest = data && data.request;
    if (!updatedRequest) {
      const err = new Error("Failed to update recovery request.");
      err.code = "API_ERROR";
      throw err;
    }
    setRecoveryRequests((prev) =>
      prev.map((request) =>
        String(request.id) === String(updatedRequest.id)
          ? updatedRequest
          : request
      )
    );
    return updatedRequest;
  }

  return (
    <RecoveryRequestContext.Provider
      value={{
        recoveryRequests,
        isLoading,
        loadError,
        dismissLoadError,
        createRecoveryRequest,
        updateRecoveryRequestStatus,
      }}
    >
      {children}
    </RecoveryRequestContext.Provider>
  );
}

export default RecoveryRequestProvider;