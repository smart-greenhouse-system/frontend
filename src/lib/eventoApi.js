import api from "../api/api.js";

/**
 * @typedef {Object} EventoResponse
 * @property {string} origen
 * @property {string} tipo
 * @property {string} mensaje
 */

/**
 * Obtiene todos los eventos registrados.
 * @returns {Promise<EventoResponse[]>}
 */
export async function getEventos() {
  const { data } = await api.get("/eventos");
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
