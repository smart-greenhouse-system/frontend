import api from "../api/api.js";

export async function getConfig() {
  const { data } = await api.get("/config");
  return data;
}

export async function updateConfig(payload) {
  const { data } = await api.patch("/config", payload);
  return data;
}
