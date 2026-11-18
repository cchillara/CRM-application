import { auth } from "../../firebase.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");
const PORTAL_URL = `${API_BASE_URL}/user-portal`;

async function request(path, options = {}) {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : localStorage.getItem("token") || localStorage.getItem("firebaseToken");
  const response = await fetch(`${PORTAL_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Request failed (${response.status})`);
  return result?.data ?? result;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });
export const getProfile = () => request("/profile");
export const updateProfile = (data) => request("/profile", json("PATCH", data));
export const getLeads = () => request("/leads");
export const updateLead = (id, data) => request(`/leads/${encodeURIComponent(id)}`, json("PATCH", data));
export const getDeals = () => request("/deals");
export const updateDeal = (id, data) => request(`/deals/${encodeURIComponent(id)}`, json("PATCH", data));
export const getTasks = () => request("/tasks");
export const createTask = (data) => request("/tasks", json("POST", data));
export const updateTask = (id, data) => request(`/tasks/${encodeURIComponent(id)}`, json("PATCH", data));
export const deleteTask = (id) => request(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
export const getReports = () => request("/reports");
export const getNotifications = () => request("/notifications");
export const markNotificationRead = (id) => request(`/notifications/${encodeURIComponent(id)}/read`, json("PATCH", {}));
export const createSupportTicket = (data) => request("/support-tickets", json("POST", data));
