import { getApiBaseUrl } from "./cropApi.js";

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchGreenhouseConfig(token) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/config`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "No se pudo cargar la configuración general");
    err.code = data?.code;
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export async function patchGreenhouseConfig(body, token) {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/config`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "No se pudo guardar la configuración general");
    err.code = data?.code;
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}