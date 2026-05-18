import api from "../api/api.js";

export function getUserAuthToken() {
  return localStorage.getItem("token") ?? localStorage.getItem("operator_token") ?? "";
}

export function getStoredUserId() {
  return localStorage.getItem("user_id") ?? "";
}

/**
 * GET /api/alerts?greenhouse_id=&from=&to=
 * Response: { alerts: [{ alert_id, source, description, severity, timestamp }] }
 */
export async function fetchAlerts({ greenhouseId, from, to }) {
  const params = new URLSearchParams();
  if (greenhouseId) params.set("greenhouse_id", greenhouseId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await api.get(`/api/alerts?${params.toString()}`);
  return res.data;
}

/**
 * PATCH /api/users/{user_id}/notification-preferences (RF-34; usado para guardar canales RF-24)
 */
export async function patchNotificationPreferences(userId, body) {
  const res = await api.patch(`/api/users/${encodeURIComponent(userId)}/notification-preferences`, body);
  return res.data;
}
