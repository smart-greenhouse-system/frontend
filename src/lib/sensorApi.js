import api from "../api/api.js";

/**
 * GET /api/sensors/latest
 * Obtiene las lecturas más recientes de todos los dispositivos.
 * Response: [{ device_id, temperatura, humedad_relativa, humedad_suelo, iluminacion, timestamp }]
 */
export async function getLatestReadings() {
  const res = await api.get("/api/sensors/latest");
  return res.data;
}

/**
 * GET /api/sensors/history/{device_id}
 * Obtiene el historial de lecturas de un dispositivo específico.
 * Response: [{ device_id, temperatura, humedad_relativa, humedad_suelo, iluminacion, timestamp }]
 */
export async function getSensorHistory(deviceId) {
  const res = await api.get(`/api/sensors/history/${encodeURIComponent(deviceId)}`);
  return res.data;
}
