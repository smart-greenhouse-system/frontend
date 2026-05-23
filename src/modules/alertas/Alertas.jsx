import { useEffect, useMemo, useState, useCallback } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Cpu,
  Info,
  Loader2,
  OctagonAlert,
  RefreshCw,
} from "lucide-react";
import { getEventos } from "../../lib/eventoApi";

/* ─────────────── mapeo tipo → severidad ─────────────── */

const TIPO_SEVERITY = {
  INFO: "info",
  SISTEMA: "info",
  ADVERTENCIA: "advertencia",
  IA: "advertencia",
  PELIGRO: "peligro",
  ERROR: "peligro",
  CRITICO: "peligro",
};

const SEVERITY_META = {
  info: {
    label: "Info",
    Icon: Info,
    rowClass: "border-l-[4px] border-blue-500 bg-white ring-1 ring-slate-200/90 shadow-sm",
    badgeClass: "bg-blue-600 text-white shadow-sm",
  },
  advertencia: {
    label: "Advertencia",
    Icon: AlertTriangle,
    rowClass: "border-l-[4px] border-amber-500 bg-white ring-1 ring-slate-200/90 shadow-sm",
    badgeClass: "bg-amber-500 text-amber-950 shadow-sm",
  },
  peligro: {
    label: "Peligro",
    Icon: OctagonAlert,
    rowClass: "border-l-[4px] border-red-600 bg-white ring-1 ring-slate-200/90 shadow-sm",
    badgeClass: "bg-red-600 text-white shadow-sm",
  },
};

/* ─────────────── helpers ─────────────── */

function alertKey(ev) {
  return `${ev.origen}|${ev.tipo}|${ev.mensaje}`;
}

function mapEvento(ev) {
  const rawTipo = (ev.tipo || "").toUpperCase();
  const severity = TIPO_SEVERITY[rawTipo] ?? "info";
  return {
    _key: alertKey(ev),
    severity,
    mensaje: ev.mensaje || "",
    dispositivo: ev.origen || "—",
    timestamp: ev.created_at || ev.createdAt || new Date().toISOString(),
    read: false,
  };
}

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium" });
  } catch {
    return iso;
  }
}

const SEVERITY_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "info", label: "Info" },
  { value: "advertencia", label: "Advertencia" },
  { value: "peligro", label: "Peligro" },
];

const LS_READ_KEY = "alertas_leidas";

function loadReadKeys() {
  try {
    const raw = localStorage.getItem(LS_READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveReadKeys(keys) {
  try { localStorage.setItem(LS_READ_KEY, JSON.stringify([...keys])); } catch { /* noop */ }
}

/* ─────────────── Componente ─────────────── */

const Alertas = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("");
  const [readKeys, setReadKeys] = useState(loadReadKeys);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEventos();
      const mapped = (Array.isArray(data) ? data : []).map(mapEvento);
      setAlerts(mapped);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "No se pudieron cargar las alertas.";
      setError(msg);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const filteredAlerts = useMemo(() => {
    const withRead = alerts.map((a) => ({ ...a, read: readKeys.has(a._key) }));
    const sorted = [...withRead].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let result = sorted;
    if (severityFilter !== "all") {
      result = result.filter((a) => a.severity === severityFilter);
    }
    if (originFilter) {
      result = result.filter((a) => a.dispositivo === originFilter);
    }
    return result;
  }, [alerts, severityFilter, originFilter, readKeys]);

  const unreadCount = useMemo(
    () => alerts.filter((a) => !readKeys.has(a._key)).length,
    [alerts, readKeys]
  );

  const originOptions = useMemo(() => {
    const set = new Set(alerts.map((a) => a.dispositivo));
    return [...set].sort();
  }, [alerts]);

  const toggleRead = (key) => {
    setReadKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveReadKeys(next);
      return next;
    });
  };

  const markAllRead = () => {
    const allKeys = new Set(alerts.map((a) => a._key));
    saveReadKeys(allKeys);
    setReadKeys(allKeys);
  };

  return (
    <div className="min-h-screen space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Alertas</h1>
          {unreadCount > 0 && (
            <span className="inline-flex min-h-[1.75rem] min-w-[1.75rem] items-center justify-center rounded-full bg-red-600 px-2 text-sm font-bold tabular-nums text-white shadow-lg ring-2 ring-white/50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-farm-green-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-farm-green hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
          <p className="font-semibold">Error al cargar alertas</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-farm-green-light border-t-farm-green-dark" />
          <p className="mt-4 text-sm font-medium text-gray-500">Cargando alertas…</p>
        </div>
      ) : (
        <>
          {/* ── FILTROS ── */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              {SEVERITY_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSeverityFilter(value)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    severityFilter === value
                      ? "bg-farm-green-dark text-white shadow-md ring-2 ring-farm-green/35"
                      : "bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 hover:bg-gray-200/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
              aria-label="Filtrar por origen"
            >
              <option value="">Todos los orígenes</option>
              {originOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* ── LISTA ── */}
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
              <Bell className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-500">
                {alerts.length === 0 ? "No hay alertas registradas" : "No hay alertas con estos filtros"}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredAlerts.map((alert) => {
                const meta = SEVERITY_META[alert.severity];
                const Icon = meta.Icon;
                const isRead = alert.read;

                return (
                  <li key={alert._key}>
                    <article
                      className={`relative overflow-hidden rounded-2xl p-5 pl-5 transition-all duration-200 sm:p-6 sm:pl-6 ${
                        meta.rowClass
                      } ${isRead ? "opacity-[0.34]" : "hover:shadow-md"}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleRead(alert._key)}
                        title={isRead ? "Marcar como no leída" : "Marcar como leída"}
                        aria-label={isRead ? "Marcar como no leída" : "Marcar como leída"}
                        className="absolute right-2 top-2 z-10 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-farm-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-green/40"
                      >
                        <CheckCheck className="h-4 w-4" aria-hidden />
                      </button>

                      <div className="flex min-w-0 flex-col pr-10">
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${meta.badgeClass}`}>
                            <Icon className="h-3 w-3 opacity-90" strokeWidth={2.5} aria-hidden />
                            {meta.label}
                          </span>
                          <time className="text-right text-xs font-medium tabular-nums text-gray-500" dateTime={alert.timestamp}>
                            {formatTimestamp(alert.timestamp)}
                          </time>
                        </div>

                        <p className={`mt-4 text-base font-medium leading-snug text-gray-900 sm:text-lg ${
                          isRead ? "text-gray-500 line-through decoration-gray-400 decoration-2" : ""
                        }`}>
                          {alert.mensaje}
                        </p>

                        <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                          <Cpu className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} aria-hidden />
                          <span className="font-mono text-gray-600">{alert.dispositivo}</span>
                        </p>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}

          {alerts.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-lg border border-farm-green/30 bg-white px-4 py-2.5 text-sm font-semibold text-farm-green-dark shadow-sm transition hover:bg-farm-green-light/80"
              >
                Marcar todas como leídas
              </button>
              <p className="text-xs text-gray-400">
                {alerts.length} alerta{alerts.length !== 1 ? "s" : ""} · {unreadCount} sin leer
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Alertas;
