import api from "../api/api.js";

export function normalizeInventoryItem(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.id == null) return null;
  return {
    id: raw.id,
    nombre: raw.nombre ?? "",
    cantidad: raw.cantidad ?? 0,
    unidad: raw.unidad ?? "",
    threshold_minimo: raw.threshold_minimo ?? null,
  };
}

export async function getInventory() {
  const { data } = await api.get("/inventory");
  if (Array.isArray(data)) {
    return data.map(normalizeInventoryItem).filter(Boolean);
  }
  return [];
}

export async function createInventoryItem(payload) {
  const { data } = await api.post("/inventory", payload);
  return normalizeInventoryItem(data) ?? data;
}

export async function updateInventoryItem(id, payload) {
  const { data } = await api.patch(`/inventory/${encodeURIComponent(id)}`, payload);
  return normalizeInventoryItem(data) ?? data;
}
