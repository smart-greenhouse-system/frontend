import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  fetchAlerts,
  getStoredUserId,
  getUserAuthToken,
  patchNotificationPreferences,
} from "../../../lib/alertsApi";

const SOURCE_LABELS = {
  temperature: "Temperatura",
  air_humidity: "Humedad del aire",
  soil_moisture: "Humedad del suelo",
  light_intensity: "Luz",
  sensor: "Sensor",
  actuator: "Actuador",
};

const SOURCE_ICONS = {
  temperature: "🌡️",
  air_humidity: "💧",
  soil_moisture: "💧",
  light_intensity: "☀️",
  sensor: "📡",
  actuator: "⚙️",
};

const DEMO_GREENHOUSES = [
  { id: "gh-norte", label: "Invernadero Norte" },
  { id: "gh-sur", label: "Invernadero Sur" },
];

const PREFS_STORAGE_KEY = "notification_channels_prefs";

function defaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 14);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

/** Normaliza ítems del array `alerts` del JSON de API */
function normalizeAlert(raw, index) {
  const alertId = raw?.alert_id ?? raw?.id ?? `row-${index}`;
  const source = typeof raw?.source === "string" ? raw.source : "sensor";
  const description = raw?.description ?? raw?.message ?? "—";
  const sev = raw?.severity === "critical" || raw?.severity === "warning" ? raw.severity : "warning";
  const timestamp = raw?.timestamp ?? raw?.created_at ?? raw?.occurred_at ?? new Date().toISOString();
  return { alert_id: alertId, source, description, severity: sev, timestamp };
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("es", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function AlertSummaryCards({ total, warnings, criticals }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <article className="rounded-2xl border border-emerald-200/80 bg-emerald-100 px-5 py-4 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-900">Total alertas</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-gray-900">{total}</p>
      </article>
      <article className="rounded-2xl border border-amber-200/60 bg-[#fff8e7] px-5 py-4 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-900">Advertencias</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-orange-600">{warnings}</p>
      </article>
      <article className="rounded-2xl border border-red-200/80 bg-red-100 px-5 py-4 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-900">Críticas</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-red-900">{criticals}</p>
      </article>
    </div>
  );
}

function readStoredChannelPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { push: true, email: true, inApp: true };
    const p = JSON.parse(raw);
    return {
      push: typeof p.push === "boolean" ? p.push : true,
      email: typeof p.email === "boolean" ? p.email : true,
      inApp: typeof p.in_app === "boolean" ? p.in_app : true,
    };
  } catch {
    return { push: true, email: true, inApp: true };
  }
}

function NotificationPreferencesPanel() {
  const [push, setPush] = useState(() => readStoredChannelPrefs().push);
  const [email, setEmail] = useState(() => readStoredChannelPrefs().email);
  const [inApp, setInApp] = useState(() => readStoredChannelPrefs().inApp);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setMessage("");
    const userId = getStoredUserId();
    if (!userId) {
      setError('Configura localStorage.setItem("user_id", "<id>") para guardar preferencias en el API.');
      return;
    }
    if (!push && !email && !inApp) {
      setError("Activa al menos un canal de notificación.");
      return;
    }

    const token = getUserAuthToken();
    const body = {
      events: {
        critical_alerts: true,
        warnings: true,
        offline_sensors: true,
        actuator_failures: true,
      },
      channels: { push, email, in_app: inApp },
      do_not_disturb: { enabled: false, start_time: "22:00", end_time: "07:00" },
    };

    setSaving(true);
    try {
      const data = await patchNotificationPreferences(userId, body, token);
      setMessage(data?.message || "Preferencias guardadas.");
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ push, email, in_app: inApp }));
    } catch (e) {
      setError(e?.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const rowClass =
    "flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-farm-green/40";

  return (
    <section className="rounded-2xl border border-gray-200 bg-farm-green-light/30 p-5 shadow-sm">
      <h2 className="text-base font-semibold text-farm-green-dark">Preferencias de notificación</h2>
      <p className="mt-1 text-sm text-gray-600">Activa o desactiva los canales de envío automático.</p>
      <div className="mt-4 space-y-3">
        <label className={rowClass}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-farm-green-dark focus:ring-farm-green"
            checked={inApp}
            onChange={(e) => setInApp(e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-800">Notificaciones en la app (in-app)</span>
        </label>
        <label className={rowClass}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-farm-green-dark focus:ring-farm-green"
            checked={email}
            onChange={(e) => setEmail(e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-800">Correo electrónico</span>
        </label>
        <label className={rowClass}>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-farm-green-dark focus:ring-farm-green"
            checked={push}
            onChange={(e) => setPush(e.target.checked)}
          />
          <span className="text-sm font-medium text-gray-800">Push</span>
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 text-sm text-emerald-800" role="status">
          {message}
        </p>
      ) : null}
      <div className="mt-4 max-w-xs">
        <Button type="button" onClick={handleSave} disabled={saving} className={saving ? "opacity-70" : ""}>
          {saving ? "Guardando…" : "Guardar preferencias"}
        </Button>
      </div>
    </section>
  );
}

const AlertsPage = () => {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [greenhouseId, setGreenhouseId] = useState(DEMO_GREENHOUSES[0]?.id ?? "");
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [severityFilter, setSeverityFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const loadAlerts = useCallback(async () => {
    if (!greenhouseId || !from || !to) return;
    setFetchError("");
    setLoading(true);
    try {
      const token = getUserAuthToken();
      const data = await fetchAlerts({ greenhouseId, from, to }, token);
      const rawList = Array.isArray(data?.alerts) ? data.alerts : [];
      setAlerts(rawList.map(normalizeAlert));
    } catch (e) {
      setAlerts([]);
      setFetchError(e?.message || "Error al cargar alertas.");
    } finally {
      setLoading(false);
    }
  }, [greenhouseId, from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- datos remotos GET /api/v1/alerts
    void loadAlerts();
  }, [loadAlerts]);

  const counts = useMemo(() => {
    const warnings = alerts.filter((a) => a.severity === "warning").length;
    const criticals = alerts.filter((a) => a.severity === "critical").length;
    return { total: alerts.length, warnings, criticals };
  }, [alerts]);

  const filteredRows = useMemo(() => {
    let list = [...alerts];
    if (severityFilter) list = list.filter((a) => a.severity === severityFilter);
    if (sourceFilter) list = list.filter((a) => a.source === sourceFilter);
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return list;
  }, [alerts, severityFilter, sourceFilter]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-farm-green-dark">Alertas</h1>
        <p className="mt-2 text-sm text-gray-600">
          Resumen, historial filtrable y preferencias de notificación (RF-23 / RF-24).
        </p>
      </header>

      <AlertSummaryCards total={counts.total} warnings={counts.warnings} criticals={counts.criticals} />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-farm-green-dark">Filtros</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="alert-gh" className="mb-2 block text-sm font-medium text-gray-700">
              Invernadero
            </label>
            <select
              id="alert-gh"
              value={greenhouseId}
              onChange={(e) => setGreenhouseId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20"
            >
              {DEMO_GREENHOUSES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            id="alert-from"
            name="from"
            label="Desde"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            id="alert-to"
            name="to"
            label="Hasta"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <div>
            <label htmlFor="alert-sev" className="mb-2 block text-sm font-medium text-gray-700">
              Severidad
            </label>
            <select
              id="alert-sev"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20"
            >
              <option value="">Todas</option>
              <option value="warning">Advertencia</option>
              <option value="critical">Crítico</option>
            </select>
          </div>
          <div>
            <label htmlFor="alert-src" className="mb-2 block text-sm font-medium text-gray-700">
              Origen
            </label>
            <select
              id="alert-src"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20"
            >
              <option value="">Todos</option>
              {Object.keys(SOURCE_LABELS).map((key) => (
                <option key={key} value={key}>
                  {SOURCE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={loadAlerts} className="w-auto min-w-[140px]" disabled={loading}>
            {loading ? "Actualizando…" : "Aplicar filtros"}
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-farm-green-light/50 px-5 py-4">
          <h2 className="text-base font-semibold text-farm-green-dark">Historial de alertas</h2>
          <p className="mt-1 text-xs text-gray-600">Orden cronológico: más recientes primero.</p>
        </div>
        {fetchError ? (
          <p className="px-5 py-6 text-center text-sm text-red-600">{fetchError}</p>
        ) : loading && alerts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">Cargando alertas…</p>
        ) : filteredRows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            {alerts.length === 0
              ? "No hay alertas en el rango seleccionado."
              : "Ninguna alerta coincide con los filtros de severidad u origen."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-farm-green-light/80">
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-farm-green-dark">
                    Fecha
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-farm-green-dark">
                    Origen
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-farm-green-dark">
                    Descripción
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-farm-green-dark">
                    Severidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr
                    key={`${row.alert_id}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/90"}
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-800">
                      {formatDateTime(row.timestamp)}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-800">
                      <span className="mr-1.5" aria-hidden>
                        {SOURCE_ICONS[row.source] ?? "📌"}
                      </span>
                      {SOURCE_LABELS[row.source] ?? row.source}
                    </td>
                    <td className="max-w-md px-5 py-3 text-sm text-gray-800">{row.description}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-bold">
                      {row.severity === "critical" ? (
                        <span className="text-red-600">Crítico</span>
                      ) : (
                        <span className="text-orange-600">Advertencia</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-gray-100 bg-farm-green-light/40 px-5 py-3 text-center text-xs text-gray-700">
              Leyenda: <span aria-hidden>🔴</span>{" "}
              <span className="font-semibold text-red-600">Crítica</span> &nbsp;·&nbsp;{" "}
              <span aria-hidden>🟡</span>{" "}
              <span className="font-semibold text-orange-600">Advertencia</span>
            </p>
          </div>
        )}
      </section>

      <NotificationPreferencesPanel />
    </div>
  );
};

export default AlertsPage;
