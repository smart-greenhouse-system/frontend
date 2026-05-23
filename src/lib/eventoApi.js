import api from "../api/api.js";

/**
 * @typedef {Object} ActuatorEventResponse
 * @property {string} id
 * @property {string} device_id
 * @property {string} actuator
 * @property {string} action
 * @property {boolean} executed
 * @property {string} origin
 * @property {string} event_type
 * @property {string} status
 * @property {string} topic
 * @property {number} time_action
 * @property {string} created_at
 */

/**
 * Obtiene el historial de eventos de actuadores (fuente de alertas).
 * @returns {Promise<ActuatorEventResponse[]>}
 */
export async function getEventos() {
  const { data } = await api.get("/actuator-events");
  return data;
}

/**
 * Crea un nuevo evento.
 * @param {{ origen: string, tipo: string, mensaje: string }} payload
 * @returns {Promise<EventoResponse>}
 */
export async function createEvento(payload) {
  const { data } = await api.post("/eventos", payload);
  return data;
}
