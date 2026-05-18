import api from "../api/api.js";

export function getUserAuthToken() {
  return localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
}

/**
 * GET /api/crops/{crop_id}/harvest-estimation (RF-26)
 * Sin API base configurada devuelve null para que la vista use datos demo.
 */
export async function fetchHarvestEstimation(cropId) {
  if (!cropId) return null;
  const res = await api.get(`/api/crops/${encodeURIComponent(cropId)}/harvest-estimation`);
  return res.data;
}
