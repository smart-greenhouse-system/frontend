import { getApiBaseUrl } from "./cropApi.js";

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchNotifications(token) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/notifications`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "No se pudieron cargar las notificaciones");
    err.code = data?.code;
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export async function updateNotificationStatus(notificationId, status, token) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/notifications/${encodeURIComponent(notificationId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "No se pudo actualizar la notificación");
    err.code = data?.code;
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export async function deleteNotification(notificationId, token) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/notifications/${encodeURIComponent(notificationId)}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "No se pudo eliminar la notificación");
    err.code = data?.code;
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}