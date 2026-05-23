import api from "../api/api.js";

const KEY_ALIASES = {
  temperatura: ["temperatura", "temperature", "temp"],
  humedad_relativa: ["humedad_relativa", "humedad", "humedad_aire", "hr", "humidity"],
  humedad_suelo: ["humedad_suelo", "soil_moisture", "humidity_soil", "hum_suelo", "moisture"],
  iluminacion: ["iluminacion", "luz", "light", "illuminance", "lux"],
};

function findFirstKey(map, aliases) {
  for (const alias of aliases) {
    if (alias in map) return alias;
  }
  return null;
}

function normalizeSensorEntry(entry) {
  if (!entry) return null;
  const sensores = entry.sensores ?? {};
  return {
    id: entry.id ?? null,
    device_id: entry.device_id ?? entry.deviceId ?? null,
    temperatura: sensores[findFirstKey(sensores, KEY_ALIASES.temperatura)] ?? null,
    humedad_relativa: sensores[findFirstKey(sensores, KEY_ALIASES.humedad_relativa)] ?? null,
    humedad_suelo: sensores[findFirstKey(sensores, KEY_ALIASES.humedad_suelo)] ?? null,
    iluminacion: sensores[findFirstKey(sensores, KEY_ALIASES.iluminacion)] ?? null,
    timestamp: entry.created_at ?? entry.createdAt ?? null,
  };
}

export async function getLatestReadings() {
  const res = await api.get("/sensors/latest");
  const data = res.data;
  if (Array.isArray(data)) {
    return data.map(normalizeSensorEntry).filter(Boolean);
  }
  return [normalizeSensorEntry(data)].filter(Boolean);
}

export async function getSensorHistory(deviceId) {
  const res = await api.get(`/sensors/history/${encodeURIComponent(deviceId)}`);
  const data = res.data;
  const rows = Array.isArray(data) ? data : data?.readings ?? data?.data ?? [];
  return rows.map(normalizeSensorEntry).filter(Boolean);
}
