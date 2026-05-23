import api from "../api/api.js";

/**
 * @typedef {Object} ActuatorResponse
 * @property {string} actuator_id
 * @property {string} device_id
 * @property {string} actuador
 * @property {string} nombre
 * @property {string} estado
 * @property {boolean} enabled
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ExecuteActuatorResponse
 * @property {string} message
 * @property {string} deviceId
 * @property {string} actuator
 * @property {string} action
 * @property {boolean} executed
 */

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
 * Obtiene todos los actuadores registrados.
 * @returns {Promise<ActuatorResponse[]>}
 */
export async function getActuators() {
  const { data } = await api.get("/actuators");
  return data;
}

/**
 * Crea un nuevo actuador asociado a un device existente.
 * @param {{ actuator_id: string, device_id: string, actuador: string, nombre: string, estado: string, enabled: boolean }} payload
 * @returns {Promise<ActuatorResponse>}
 */
export async function createActuator(payload) {
  const { data } = await api.post("/actuators", payload);
  return data;
}

/**
 * Actualiza un actuador existente.
 * @param {string} id
 * @param {{ device_id?: string, actuador?: string, nombre?: string, estado?: string, enabled?: boolean }} payload
 * @returns {Promise<ActuatorResponse>}
 */
export async function updateActuator(id, payload) {
  const { data } = await api.patch(`/actuators/${encodeURIComponent(id)}`, payload);
  return data;
}

/**
 * Elimina un actuador.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteActuator(id) {
  await api.delete(`/actuators/${encodeURIComponent(id)}`);
}

/**
 * Envía un comando (ON/OFF) a un actuador.
 * @param {{ device_id: string, actuador: string, accion: string }} command
 * @returns {Promise<ExecuteActuatorResponse>}
 */
export async function sendCommand({ device_id, actuador, accion }) {
  const { data } = await api.post("/actuators/execute", {
    device_id,
    actuador,
    accion,
  });
  return data;
}

/**
 * Obtiene todos los eventos de actuadores.
 * @returns {Promise<ActuatorEventResponse[]>}
 */
export async function getActuatorEvents() {
  const { data } = await api.get("/actuator-events");
  return data;
}

/**
 * Obtiene los eventos de actuadores filtrados por deviceId.
 * @param {string} deviceId
 * @returns {Promise<ActuatorEventResponse[]>}
 */
export async function getActuatorEventsByDevice(deviceId) {
  const { data } = await api.get(`/actuator-events/${encodeURIComponent(deviceId)}`);
  return data;
}
