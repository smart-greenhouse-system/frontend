import api from "../api/api.js";

/**
 * Normaliza un ítem del inventario al formato de UI (campos en español).
 */
export function normalizeInventoryItem(raw) {
  if (!raw || typeof raw !== "object") return null;

  const id = raw.id ?? raw.item_id ?? raw.inventario_id;
  if (id == null) return null;

  const activo = raw.activo ?? raw.active;
  if (activo === false) return null;

  return {
    id,
    nombre: raw.nombre ?? raw.name ?? "",
    categoria: raw.categoria ?? raw.category ?? "",
    stock: Number(raw.stock_actual ?? raw.stock ?? raw.cantidad ?? 0),
    unidad: raw.unidad ?? raw.unit ?? "",
    stock_minimo:
      raw.stock_minimo != null
        ? Number(raw.stock_minimo)
        : raw.min_stock != null
          ? Number(raw.min_stock)
          : null,
  };
}

function extractInventoryList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.inventario)) return data.inventario;
  if (Array.isArray(data?.inventory)) return data.inventory;
  return [];
}

/**
 * GET /api/inventory
 * Lista herramientas e insumos.
 */
export async function getInventory() {
  const res = await api.get("/api/inventory");
  return extractInventoryList(res.data)
    .map(normalizeInventoryItem)
    .filter(Boolean);
}

/**
 * POST /api/inventory
 * Crea un ítem (nombre, categoria, stock_actual, unidad, stock_minimo opcional).
 */
export async function createInventoryItem(payload) {
  const res = await api.post("/api/inventory", payload);
  const created = res.data?.item ?? res.data;
  return normalizeInventoryItem(created) ?? created;
}

/**
 * PATCH /api/inventory/{id}
 * Actualiza campos parciales del ítem.
 */
export async function updateInventoryItem(id, payload) {
  const res = await api.patch(`/api/inventory/${encodeURIComponent(id)}`, payload);
  const updated = res.data?.item ?? res.data;
  return normalizeInventoryItem(updated) ?? updated;
}

/**
 * Baja lógica vía PATCH (sin DELETE en contrato).
 */
export async function deactivateInventoryItem(id) {
  return updateInventoryItem(id, { activo: false });
}
