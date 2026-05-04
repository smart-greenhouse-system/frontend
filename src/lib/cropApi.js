const DEFAULT_BASE = "";

export function getApiBaseUrl() {
  const raw = import.meta.env?.VITE_API_BASE_URL;
  if (raw === undefined || raw === null || raw === "") return DEFAULT_BASE;
  return String(raw).replace(/\/$/, "");
}

export function getOperatorToken() {
  return localStorage.getItem("operator_token") ?? localStorage.getItem("token") ?? "";
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * POST /api/v1/crops/{crop_id}/notes
 * Body: { note: string, date: "YYYY-MM-DD" }
 */
export async function postCropNote(cropId, body, token) {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/crops/${encodeURIComponent(cropId)}/notes`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Request failed");
    err.code = data?.code;
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * POST /api/v1/crops/{crop_id}/harvest
 * Body: { harvest_date: "YYYY-MM-DD", harvest_quantity?: number }
 */
export async function postCropHarvest(cropId, body, token) {
  const base = getApiBaseUrl();
  const url = `${base}/api/v1/crops/${encodeURIComponent(cropId)}/harvest`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Request failed");
    err.code = data?.code;
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}
