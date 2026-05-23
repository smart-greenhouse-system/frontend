import api from "../api/api.js";

/**
 * @typedef {Object} DeviceResponse
 * @property {string} device_id
 * @property {string} nombre
 * @property {string} tipo
 * @property {string} estado
 * @property {string[]} sensores
 * @property {string[]} actuadores
 * @property {string} last_seen
 * @property {string} created_at
 */

/**
 * Obtiene todos los dispositivos registrados.
 * @returns {Promise<DeviceResponse[]>}
 */
export async function getDevices() {
  const { data } = await api.get("/devices");
  return data;
}
