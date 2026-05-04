import { getApiBaseUrl } from "./cropApi.js";

export function getUserAuthToken() {
  return localStorage.getItem("token") ?? localStorage.getItem("operator_token") ?? "";
}

export function getStoredUserId() {
  return localStorage.getItem("user_id") ?? "";
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * GET /api/v1/alerts?greenhouse_id=&from=&to=
 * Response: { alerts: [{ alert_id, source, description, severity, timestamp }] }
 */
export async function fetchAlerts({ greenhouseId, from, to }, token) {
  const base = getApiBaseUrl();
  const params = new URLSearchParams();
  if (greenhouseId) params.set("greenhouse_id", greenhouseId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const url = `${base}/api/v1/alerts${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "No se pudieron cargar las alertas");
    err.code = data?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * PATCH /api/v1/users/{user_id}/notification-preferences (RF-34; usado para guardar canales RF-24)
 */
export async function patchNotificationPreferences(userId, body, token) {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/users/${encodeURIComponent(userId)}/notification-preferences`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "No se pudieron guardar las preferencias");
    err.code = data?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}
