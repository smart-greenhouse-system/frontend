import api from "../api/api.js";

export async function getActuators() {
  const { data } = await api.get("/actuators");
  return data;
}

export async function createActuator(payload) {
  const { data } = await api.post("/actuators", payload);
  return data;
}

export async function updateActuator(id, payload) {
  const { data } = await api.patch(`/actuators/${encodeURIComponent(id)}`, payload);
  return data;
}

export async function deleteActuator(id) {
  await api.delete(`/actuators/${encodeURIComponent(id)}`);
}

export async function sendCommand({ device_id, actuador, accion }) {
  const { data } = await api.post("/actuators/execute", {
    device_id,
    actuador,
    accion,
  });
  return data;
}
