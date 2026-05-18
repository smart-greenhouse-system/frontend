import api from "../api/api.js";

const DEFAULT_BASE = "";

export function getApiBaseUrl() {
  const raw = import.meta.env?.VITE_API_BASE_URL;
  if (raw === undefined || raw === null || raw === "") return DEFAULT_BASE;
  return String(raw).replace(/\/$/, "");
}

export function getOperatorToken() {
  return localStorage.getItem("operator_token") ?? localStorage.getItem("token") ?? "";
}

/**
 * POST /api/crops/{crop_id}/notes
 * Body: { note: string, date: "YYYY-MM-DD" }
 */
export async function postCropNote(cropId, body) {
  const res = await api.post(`/api/crops/${encodeURIComponent(cropId)}/notes`, body);
  return res.data;
}

/**
 * POST /api/crops/{crop_id}/harvest
 * Body: { harvest_date: "YYYY-MM-DD", harvest_quantity?: number }
 */
export async function postCropHarvest(cropId, body) {
  const res = await api.post(`/api/crops/${encodeURIComponent(cropId)}/harvest`, body);
  return res.data;
}
