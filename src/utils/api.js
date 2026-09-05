export const API_URL = "http://localhost:5000";

export async function apiRequest(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers:
        body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error(
      "Could not connect to the server. Please try again."
    );
    err.code = "NETWORK_ERROR";
    err.status = 0;
    throw err;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = new Error(
      (data && typeof data.message === "string" && data.message) ||
        "Something went wrong. Please try again."
    );
    err.code = "API_ERROR";
    err.status = response.status;
    err.errors = data && data.errors ? data.errors : null;
    throw err;
  }

  return data;
}