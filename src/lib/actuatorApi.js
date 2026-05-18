import api from "../api/api.js";

/**
 * POST /api/actuadores
 * Envía comando a actuador
 * Body: { device_id, actuador, accion }
 */
export async function sendCommand({ device_id, actuador, accion }) {
  const res = await api.post("/api/actuadores", {
    device_id,
    actuador,
    accion,
  });
  return res.data;
}
