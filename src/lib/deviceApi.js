import api from "../api/api.js";

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

export async function getDevices() {
  const { data } = await api.get("/devices");
  const rows = Array.isArray(data) ? data : data?.devices ?? [];
  return rows.map(normalizeDevice).filter(Boolean);
}
