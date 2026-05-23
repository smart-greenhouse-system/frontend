import api from "../api/api.js";

/**
 * @typedef {Object} ImageAnalysisPredictionResponse
 * @property {string} id
 * @property {string} tipo
 * @property {string} device_id
 * @property {string} cultivo
 * @property {boolean} success
 * @property {string} estado_planta
 * @property {number} confianza
 * @property {number} tiempo_cosecha_dias
 * @property {string} created_at
 */

/**
 * @typedef {Object} CreatePredictionResponse
 * @property {string} message
 * @property {boolean} processed
 * @property {boolean} automatic_mode
 * @property {boolean} actuator_executed
 * @property {number} timeAction
 */

/**
 * @typedef {Object} PredictionResponse
 * @property {string} id
 * @property {string} device_id
 * @property {string} actuador_id
 * @property {number} timeAction
 * @property {boolean} processed
 * @property {boolean} automatic_mode
 * @property {boolean} executed
 * @property {string} created_at
 */

/**
 * Obtiene el último análisis de imagen disponible.
 * @returns {Promise<ImageAnalysisPredictionResponse>}
 */
export async function getLatestImageAnalysis() {
  const { data } = await api.get("/predictions/latest-image-analysis");
  return data;
}

/**
 * Obtiene el historial completo de análisis de imágenes.
 * @returns {Promise<ImageAnalysisPredictionResponse[]>}
 */
export async function getImageAnalysisHistory() {
  const { data } = await api.get("/predictions/image-analysis");
  return data;
}

/**
 * Crea una nueva predicción (programa ON automático con OFF programado).
 * @param {{ device_id: string, procesado: boolean, actuador_id: string, timeAction: string }} payload
 * @returns {Promise<CreatePredictionResponse>}
 */
export async function createPrediction(payload) {
  const { data } = await api.post("/predictions", payload);
  return data;
}

/**
 * Obtiene el historial de predicciones creadas.
 * @returns {Promise<PredictionResponse[]>}
 */
export async function getPredictionHistory() {
  const { data } = await api.get("/predictions");
  return data;
}
