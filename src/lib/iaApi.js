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

/**
 * Normaliza la respuesta de GET /api/predictions para la UI.
 */
export function normalizePredictions(data) {
  if (!data || typeof data !== "object") {
    return {
      predicciones: {},
      alertas: [],
      acciones_recomendadas: [],
      timestamp: null,
    };
  }

  const rawActions =
    data.acciones_recomendadas ??
    data.recommended_actions ??
    data.recomendaciones ??
    data.actions ??
    [];

  const acciones = (Array.isArray(rawActions) ? rawActions : []).map((action, index) => {
    if (typeof action === "string") {
      return {
        id: `action-${index}`,
        titulo: action,
        descripcion: "",
        prioridad: "media",
      };
    }
    return {
      id: action.id ?? action.accion_id ?? `action-${index}`,
      titulo: action.titulo ?? action.title ?? action.accion ?? "Acción recomendada",
      descripcion: action.descripcion ?? action.description ?? "",
      prioridad: (action.prioridad ?? action.priority ?? "media").toString().toLowerCase(),
      tipo: action.tipo ?? action.type ?? null,
    };
  });

  const predicciones =
    data.predicciones ??
    data.predictions ??
    (data.temperatura != null || data.humedad_relativa != null ? data : {});

  const alertas = data.alertas ?? data.alerts ?? (data.alerta ? [data.alerta] : []);

  return {
    predicciones,
    alertas: Array.isArray(alertas) ? alertas : [alertas].filter(Boolean),
    acciones_recomendadas: acciones,
    timestamp: data.timestamp ?? data.fecha ?? null,
  };
}

/**
 * GET /api/predictions
 * Alertas de IA, predicciones ambientales y acciones recomendadas.
 */
export async function getPredictions() {
  const res = await api.get("/api/predictions");
  return normalizePredictions(res.data);
}
