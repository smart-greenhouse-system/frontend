import api from "../api/api.js";

export function normalizeImageAnalysis(raw) {
  if (!raw || typeof raw !== "object") return null;

  const confianzaRaw = raw.confianza ?? raw.confidence;
  let confianzaPercent = null;
  if (typeof confianzaRaw === "number" && !Number.isNaN(confianzaRaw)) {
    confianzaPercent = confianzaRaw <= 1 ? Math.round(confianzaRaw * 100) : Math.round(confianzaRaw);
  }

  return {
    id: raw.id ?? null,
    tipo: raw.tipo ?? raw.type ?? "",
    device_id: raw.device_id ?? raw.deviceId ?? "",
    cultivo: raw.cultivo ?? raw.crop ?? "",
    success: raw.success !== false,
    estado_planta: raw.estado_planta ?? raw.plant_status ?? "",
    confianza: confianzaPercent,
    tiempo_cosecha_dias: raw.tiempo_cosecha_dias ?? raw.harvest_days ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? null,
  };
}

export async function getLatestImageAnalysis() {
  const { data } = await api.get("/predictions/latest-image-analysis");
  return normalizeImageAnalysis(data);
}

export async function getImageAnalysisHistory() {
  const { data } = await api.get("/predictions/image-analysis");
  const rows = Array.isArray(data) ? data : data?.predictions ?? [];
  return rows.map(normalizeImageAnalysis).filter(Boolean);
}

/**
 * POST /api/predictions
 * Dispara procesamiento de predicción / análisis IA.
 *
 * @param {{ device_id: string; procesado?: boolean; actuador_id?: string; timeAction?: string | number }} payload
 */
export async function createPrediction(payload) {
  const body = {
    device_id: payload.device_id,
    procesado: payload.procesado ?? false,
  };
  if (payload.actuador_id) body.actuador_id = payload.actuador_id;
  if (payload.timeAction != null && payload.timeAction !== "") {
    body.timeAction = String(payload.timeAction);
  }

  const { data } = await api.post("/predictions", body);
  return {
    message: data?.message ?? "Predicción procesada",
    processed: Boolean(data?.processed ?? data?.procesado),
    automatic_mode: Boolean(data?.automatic_mode ?? data?.modo_automatico),
    actuator_executed: Boolean(data?.actuator_executed ?? data?.actuador_ejecutado),
    timeAction: data?.timeAction ?? data?.time_action ?? null,
  };
}
