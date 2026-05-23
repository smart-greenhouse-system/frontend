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

export function normalizeDevice(raw) {
  if (!raw || typeof raw !== "object") return null;
  const device_id = raw.device_id ?? raw.deviceId;
  if (!device_id) return null;
  return {
    device_id,
    nombre: raw.nombre ?? raw.name ?? device_id,
    tipo: raw.tipo ?? raw.type ?? "",
    estado: raw.estado ?? raw.status ?? "",
    sensores: raw.sensores ?? raw.sensors ?? [],
    actuadores: raw.actuadores ?? raw.actuators ?? [],
    last_seen: raw.last_seen ?? raw.lastSeen ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? null,
  };
}

/**
 * Obtiene todos los dispositivos registrados.
 * @returns {Promise<DeviceResponse[]>}
 */
export async function getDevices() {
  const { data } = await api.get("/devices");
  const rows = Array.isArray(data) ? data : data?.devices ?? [];
  return rows.map(normalizeDevice).filter(Boolean);
}
