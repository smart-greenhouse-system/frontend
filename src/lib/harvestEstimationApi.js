import { getApiBaseUrl } from "./cropApi.js";

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * RF-26 — GET /api/v1/crops/{crop_id}/harvest-estimation
 */
export async function fetchHarvestEstimation(cropId, token) {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/crops/${encodeURIComponent(cropId)}/harvest-estimation`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Error al cargar estimación");
    err.code = data?.code;
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * Contrato IA sección C — GET /api/ia/predictions
 */
export async function fetchIaPredictions(token) {
  const base = getApiBaseUrl();
  const url = `${base}/api/ia/predictions`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Predicciones no disponibles");
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Contrato IA sección D — GET /api/ia/growth
 * Opcional: crop_id si el backend lo soporta (no figura en el plan base).
 */
export async function fetchIaPlantGrowth(token, cropId = null) {
  const base = getApiBaseUrl();
  const qs = cropId ? `?crop_id=${encodeURIComponent(cropId)}` : "";
  const url = `${base}/api/ia/growth${qs}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) return null;
  return data;
}
