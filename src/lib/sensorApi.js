import api from "../api/api.js";

/**
 * GET /api/sensores
 * Obtiene lecturas de sensores con nombres en español
 * Response: [{ device_id, humedad_relativa, humedad_suelo, temperatura, iluminacion }]
 */
export async function getLatestReadings() {
  const res = await api.get("/api/sensores");
  return res.data;
}
