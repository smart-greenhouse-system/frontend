import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  getActuatorEvents,
  mapActuatorEventsToAlerts,
} from "../../lib/actuatorEventsApi";

const READ_STORAGE_KEY = "greenhouse_alerts_read";

const SEVERITY_META = {
  info: {
    label: "Info",
    Icon: Info,
    rowClass:
      "border-l-[4px] border-blue-500 bg-white ring-1 ring-slate-200/90 shadow-sm",
    badgeClass: "bg-blue-600 text-white shadow-sm",
  },
  advertencia: {
    label: "Advertencia",
    Icon: AlertTriangle,
    rowClass:
      "border-l-[4px] border-amber-500 bg-white ring-1 ring-slate-200/90 shadow-sm",
    badgeClass: "bg-amber-500 text-amber-950 shadow-sm",
  },
  peligro: {
    label: "Peligro",
    Icon: OctagonAlert,
    rowClass:
      "border-l-[4px] border-red-600 bg-white ring-1 ring-slate-200/90 shadow-sm",
    badgeClass: "bg-red-600 text-white shadow-sm",
  },
};

function loadReadIds() {
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids) {
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
}

function applyReadState(alerts, readIds) {
  return alerts.map((a) => ({ ...a, read: readIds.has(a.id) }));
}

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return iso;
  }
}

const FILTER_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "info", label: "Info" },
  { value: "advertencia", label: "Advertencia" },
  { value: "peligro", label: "Peligro" },
];

const Alertas = () => {
  const mountedRef = useRef(true);
  const readIdsRef = useRef(loadReadIds());
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const events = await getActuatorEvents();
      if (!mountedRef.current) return;

      const mapped = mapActuatorEventsToAlerts(events);
      setAlerts(applyReadState(mapped, readIdsRef.current));
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.message ?? "No se pudieron cargar los eventos.");
      setAlerts([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = useMemo(() => {
    const sorted = [...alerts].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    if (severityFilter === "all") return sorted;
    return sorted.filter((a) => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.read).length,
    [alerts]
  );

  const markAsRead = (id) => {
    setMarkingId(id);
    readIdsRef.current.add(id);
    saveReadIds(readIdsRef.current);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    setMarkingId(null);
  };

  const markAllAsRead = () => {
    alerts.forEach((a) => readIdsRef.current.add(a.id));
    saveReadIds(readIdsRef.current);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="rounded-t-2xl bg-farm-green-dark px-8 py-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20"
                aria-hidden
              >
                <Bell className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold">Alertas</h1>
                  {unreadCount > 0 ? (
                    <span
                      className="inline-flex min-h-[1.75rem] min-w-[1.75rem] items-center justify-center rounded-full bg-red-600 px-2 text-sm font-bold tabular-nums text-white shadow-lg ring-2 ring-white/25"
                      title={`${unreadCount} sin leer`}
                      aria-label={`${unreadCount} alertas sin leer`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-farm-green-light/90">
                  Eventos de actuadores desde GET /api/actuator-events.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadAlerts}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="space-y-8 px-8 py-10 sm:px-10">
          {error && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <p className="font-medium">Error al cargar alertas</p>
              <p className="mt-1 text-red-700">{error}</p>
              <button
                type="button"
                onClick={loadAlerts}
                className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2
                className="h-10 w-10 animate-spin text-farm-green-dark"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-gray-600">
                Cargando eventos…
              </p>
            </div>
          ) : (
            <>
              <div
                className="flex flex-nowrap items-center justify-end gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="group"
                aria-label="Filtro por severidad"
              >
                {FILTER_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSeverityFilter(value)}
                    className={[
                      "shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                      severityFilter === value
                        ? "bg-farm-green-dark text-white shadow-md ring-2 ring-farm-green/35"
                        : "bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 hover:bg-gray-200/80",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filteredAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 px-6 py-14 text-center">
                  <p className="text-sm font-medium text-gray-800">
                    {alerts.length === 0
                      ? "No hay eventos registrados todavía."
                      : "No hay alertas en esta categoría."}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Los eventos aparecen cuando el backend registra acciones en
                    actuadores.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredAlerts.map((alert) => {
                    const meta =
                      SEVERITY_META[alert.severity] ?? SEVERITY_META.info;
                    const Icon = meta.Icon;
                    const isRead = alert.read;
                    const isMarking = markingId === alert.id;

                    return (
                      <li key={alert.id}>
                        <article
                          className={[
                            "relative overflow-hidden rounded-2xl p-5 pl-5 transition-[box-shadow,opacity] duration-200 sm:p-6 sm:pl-6",
                            meta.rowClass,
                            isRead ? "opacity-[0.34]" : "hover:shadow-md",
                          ].join(" ")}
                        >
                          {!isRead ? (
                            <button
                              type="button"
                              disabled={isMarking}
                              onClick={() => markAsRead(alert.id)}
                              title="Marcar como leída"
                              aria-label="Marcar como leída"
                              className="absolute right-2 top-2 z-10 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-farm-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-green/40 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isMarking ? (
                                <Loader2
                                  className="h-4 w-4 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <CheckCheck className="h-4 w-4" aria-hidden />
                              )}
                            </button>
                          ) : null}

                          <div className="flex min-w-0 flex-col pr-10">
                            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                              <span
                                className={[
                                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white",
                                  meta.badgeClass,
                                ].join(" ")}
                              >
                                <Icon
                                  className="h-3 w-3 opacity-90"
                                  strokeWidth={2.5}
                                  aria-hidden
                                />
                                {meta.label}
                              </span>
                              <time
                                className="text-right text-xs font-medium tabular-nums text-gray-500"
                                dateTime={alert.timestamp}
                              >
                                {formatTimestamp(alert.timestamp)}
                              </time>
                            </div>

                            <p
                              className={[
                                "mt-4 text-base font-medium leading-snug text-gray-900 sm:text-lg",
                                isRead
                                  ? "text-gray-500 line-through decoration-gray-400 decoration-2"
                                  : "",
                              ].join(" ")}
                            >
                              {alert.mensaje}
                            </p>

                            <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
                              <Cpu
                                className="h-3.5 w-3.5 shrink-0 text-gray-400"
                                strokeWidth={2}
                                aria-hidden
                              />
                              <span className="font-mono text-gray-600">
                                {alert.dispositivo}
                              </span>
                            </p>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="border-t border-gray-100 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={alerts.length === 0 || unreadCount === 0}
                    className="w-full rounded-lg border border-farm-green/30 bg-white px-4 py-2.5 text-sm font-semibold text-farm-green-dark shadow-sm transition hover:bg-farm-green-light/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-green/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Marcar todas como leídas
                  </button>
                  <p className="text-xs text-gray-500 sm:max-w-md sm:text-right">
                    Fuente: eventos de actuadores. La severidad se infiere del
                    estado del evento; «leído» se guarda en este navegador.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alertas;
