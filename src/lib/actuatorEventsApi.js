import api from "../api/api.js";

export function normalizeActuatorEvent(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw.event_id;
  if (!id) return null;

  return {
    id,
    device_id: raw.device_id ?? raw.deviceId ?? "",
    actuator: raw.actuator ?? raw.actuador ?? "",
    action: raw.action ?? raw.accion ?? "",
    executed: Boolean(raw.executed),
    origin: raw.origin ?? raw.origen ?? "",
    event_type: raw.event_type ?? raw.tipo ?? "",
    status: raw.status ?? "",
    topic: raw.topic ?? "",
    time_action: raw.time_action ?? raw.timeAction ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? null,
  };
}

export async function getActuatorEvents(deviceId) {
  const path = deviceId
    ? `/actuator-events/${encodeURIComponent(deviceId)}`
    : "/actuator-events";
  const { data } = await api.get(path);
  const rows = Array.isArray(data) ? data : data?.events ?? [];
  return rows.map(normalizeActuatorEvent).filter(Boolean);
}

/**
 * Convierte un evento de actuador al formato de la UI de Alertas.
 * Severidad derivada de status, event_type y executed (sin endpoint dedicado de alertas).
 */
export function mapActuatorEventToAlert(event) {
  if (!event) return null;

  const status = (event.status ?? "").toString().toLowerCase();
  const eventType = (event.event_type ?? "").toString().toLowerCase();

  let severity = "info";
  if (
    event.executed === false ||
    status.includes("fail") ||
    status.includes("error") ||
    status.includes("crit") ||
    eventType.includes("error") ||
    eventType.includes("fail")
  ) {
    severity = "peligro";
  } else if (
    status.includes("warn") ||
    status.includes("pend") ||
    eventType.includes("warn")
  ) {
    severity = "advertencia";
  }

  const actuator = event.actuator || "Actuador";
  const action = event.action || "—";
  const origin = event.origin ? ` · origen: ${event.origin}` : "";
  const duration = event.time_action != null ? ` · duración: ${event.time_action}s` : "";
  const statusNote = event.status ? ` · estado: ${event.status}` : "";
  const confirmacion = event.executed ? "" : " · no confirmado";

  return {
    id: event.id,
    severity,
    mensaje: `${actuator}: ${action}${origin}${duration}${statusNote}${confirmacion}`,
    dispositivo: event.device_id || "—",
    timestamp: event.created_at ?? new Date().toISOString(),
    read: false,
    event_type: event.event_type,
    executed: event.executed,
  };
}

export function mapActuatorEventsToAlerts(events) {
  return (events ?? []).map(mapActuatorEventToAlert).filter(Boolean);
}
