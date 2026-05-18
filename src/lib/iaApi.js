import api from "../api/api.js";

/**
 * GET /api/plant-analysis
 * Obtiene análisis de plantas por IA
 * Response: { crop_id, health_status, growth_stage, recommendations: [...] }
 */
export async function getPlantAnalysis(cropId) {
  const res = await api.get(`/api/plant-analysis?crop_id=${encodeURIComponent(cropId)}`);
  return res.data;
}
