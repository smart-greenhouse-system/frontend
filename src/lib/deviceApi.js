import api from "../api/api.js";

export async function getDevices() {
  const { data } = await api.get("/devices");
  return data;
}
