import { getApiBaseUrl } from "./cropApi.js";

function authHeaders(token) {
  const h = { Accept: "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export function getUserAuthToken() {
  return localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
}

/**
 * GET /api/v1/crops/{crop_id}/harvest-estimation (RF-26)
 * Sin API base configurada devuelve null para que la vista use datos demo.
 */
export async function fetchHarvestEstimation(cropId, token) {
  const base = getApiBaseUrl();
  if (!base || !cropId) return null;
  const res = await fetch(`${base}/api/v1/crops/${encodeURIComponent(cropId)}/harvest-estimation`, {
    headers: authHeaders(token),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = data?.message || data?.code || res.statusText;
    throw new Error(msg || "No se pudo obtener la estimación");
  }
  return data;
}
