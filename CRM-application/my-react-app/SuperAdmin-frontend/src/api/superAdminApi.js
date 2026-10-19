// In local development Vite proxies /api to the Node API. Set
// VITE_API_BASE_URL only when the dashboard is deployed outside that proxy.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || "http://localhost:5173/login";

function getToken() {
  return localStorage.getItem("shnoorSuperAdminToken") || localStorage.getItem("superAdminToken");
}

export async function superAdminRequest(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("Your Super Admin session is missing. Please sign in again.");

  let response;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    response = await fetch(`${API_BASE_URL}/super-admin${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });
  } catch (cause) {
    const target = API_BASE_URL.startsWith("/") ? `${window.location.origin}${API_BASE_URL}` : API_BASE_URL;
    if (cause.name === "AbortError") {
      throw new Error(`The CRM API at ${target} did not respond within 15 seconds. Check that the backend and PostgreSQL are running.`);
    }
    throw new Error(`Cannot reach the CRM API at ${target}. Start the backend on port 5000 and verify its PostgreSQL connection.`);
  } finally {
    window.clearTimeout(timeout);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    const method = (options.method || "GET").toUpperCase();
    const endpoint = `${API_BASE_URL}/super-admin${path}`;
    const error = new Error(`${method} ${endpoint}: ${result.message || `Request failed (${response.status})`}`);
    error.status = response.status;
    if (response.status === 401 || response.status === 403) {
      ["superAdminToken", "superAdminUser", "shnoorSuperAdminToken", "shnoorSuperAdminUser"].forEach((key) => localStorage.removeItem(key));
      window.location.replace(LOGIN_URL);
    }
    throw error;
  }
  return result.data;
}

export async function superAdminDownload(path, fallbackFilename) {
  const token = getToken();
  if (!token) throw new Error("Your Super Admin session is missing. Please sign in again.");

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/super-admin${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    const target = API_BASE_URL.startsWith("/") ? `${window.location.origin}${API_BASE_URL}` : API_BASE_URL;
    throw new Error(`Cannot reach the CRM API at ${target}. Start the backend on port 5000 and verify its PostgreSQL connection.`);
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    const error = new Error(`GET ${API_BASE_URL}/super-admin${path}: ${result.message || `Request failed (${response.status})`}`);
    error.status = response.status;
    if (response.status === 401 || response.status === 403) {
      ["superAdminToken", "superAdminUser", "shnoorSuperAdminToken", "shnoorSuperAdminUser"].forEach((key) => localStorage.removeItem(key));
      window.location.replace(LOGIN_URL);
    }
    throw error;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallbackFilename;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
