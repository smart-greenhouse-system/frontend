import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckCheck,
  Clock3,
  Loader2,
  RefreshCcw,
  Trash2,
  OctagonAlert,
} from "lucide-react";
import Button from "../../../components/ui/Button";
import { getUserAuthToken } from "../../../lib/alertsApi";
import {
  deleteNotification,
  fetchNotifications,
  updateNotificationStatus,
} from "../../../lib/notificationsApi";

const SEVERITY_META = {
  critical: {
    label: "Crítica",
    badgeClass: "bg-red-600 text-white",
    rowClass: "bg-red-50/60",
    Icon: OctagonAlert,
  },
  warning: {
    label: "Advertencia",
    badgeClass: "bg-amber-400 text-amber-950",
    rowClass: "bg-amber-50/50",
    Icon: AlertTriangle,
  },
};

const STATUS_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "Sin leer" },
  { value: "read", label: "Leídas" },
];

function normalizeNotification(raw, index) {
  return {
    notification_id: String(raw?.notification_id ?? raw?.id ?? `notification-${index}`),
    alert_id: String(raw?.alert_id ?? raw?.alertId ?? ""),
    title: String(raw?.title ?? "Notificación"),
    message: String(raw?.message ?? ""),
    severity: raw?.severity === "critical" ? "critical" : "warning",
    status: raw?.status === "read" ? "read" : raw?.status === "archived" ? "archived" : "unread",
    suggested_action: String(raw?.suggested_action ?? raw?.suggestedAction ?? ""),
    created_at: String(raw?.created_at ?? raw?.createdAt ?? new Date().toISOString()),
  };
}

function formatAbsoluteTime(iso) {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const relativeFormatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

function formatRelativeTime(iso) {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) {
    return iso;
  }

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 60) {
    return "Hace unos segundos";
  }

  if (absSeconds < 3600) {
    return relativeFormatter.format(-Math.round(absSeconds / 60), "minute");
  }

  if (absSeconds < 86400) {
    return relativeFormatter.format(-Math.round(absSeconds / 3600), "hour");
  }

  return relativeFormatter.format(-Math.round(absSeconds / 86400), "day");
}

const NotificationsCenterPage = () => {
  const mountedRef = useRef(true);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyKey, setBusyKey] = useState("");

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadNotifications = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = getUserAuthToken();
      const data = await fetchNotifications(token);

      if (!mountedRef.current) {
        return;
      }

      const list = Array.isArray(data?.notifications) ? data.notifications : [];
      setNotifications(list.map(normalizeNotification));
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setNotifications([]);
      setError(err instanceof Error ? err.message : "No se pudieron cargar las notificaciones.");
    } finally {
      if (!mountedRef.current) {
        return;
      }

      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const counts = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((item) => item.status === "unread").length;
    const read = notifications.filter((item) => item.status === "read").length;
    const critical = notifications.filter((item) => item.severity === "critical").length;

    return { total, unread, read, critical };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const sorted = [...notifications].sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );

    if (statusFilter === "all") {
      return sorted;
    }

    return sorted.filter((item) => item.status === statusFilter);
  }, [notifications, statusFilter]);

  const handleAction = async (notificationId, action, nextStatus) => {
    const actionKey = `${action}:${notificationId}`;
    setBusyKey(actionKey);

    try {
      const token = getUserAuthToken();

      if (action === "delete") {
        const shouldDelete = window.confirm("¿Eliminar esta notificación de forma permanente?");
        if (!shouldDelete) {
          return;
        }

        await deleteNotification(notificationId, token);
      } else {
        await updateNotificationStatus(notificationId, nextStatus, token);
      }

      await loadNotifications(true);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(err instanceof Error ? err.message : "No se pudo actualizar la notificación.");
    } finally {
      if (mountedRef.current) {
        setBusyKey("");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-3xl border border-farm-green/10 bg-white shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-farm-green-dark" aria-hidden />
          <p className="mt-4 text-sm font-medium text-gray-600">Cargando notificaciones…</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-farm-green-light/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-farm-green-dark">
            <Bell className="h-4 w-4" />
            Centro de notificaciones
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-farm-green-dark">Panel de eventos y alertas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Revisa alertas recientes, marca como leídas, archiva o elimina de forma permanente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => void loadNotifications(true)}
            disabled={refreshing}
            className="flex w-auto items-center gap-2 rounded-xl px-5 py-2.5"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {refreshing ? "Actualizando…" : "Actualizar"}
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <p className="font-semibold">No se pudieron cargar las notificaciones</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total", value: counts.total, tone: "bg-white" },
          { label: "Sin leer", value: counts.unread, tone: "bg-farm-green-light/40" },
          { label: "Leídas", value: counts.read, tone: "bg-white" },
          { label: "Críticas", value: counts.critical, tone: "bg-red-50" },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className={["mt-3 rounded-xl px-4 py-3 text-2xl font-semibold text-gray-900", card.tone].join(" ")}>
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-farm-green-dark">Lista de notificaciones</h2>
              <p className="mt-1 text-sm text-gray-600">
                Ordenadas de más recientes a más antiguas. Las archivadas desaparecen automáticamente de esta vista.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={[
                    "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                    statusFilter === filter.value
                      ? "bg-farm-green-dark text-white shadow-md ring-2 ring-farm-green/35"
                      : "bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 hover:bg-gray-200/80",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-800">No notifications available</p>
            <p className="mt-1 text-xs text-gray-500">
              El centro está vacío ahora mismo. Las nuevas alertas aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead className="bg-farm-green-light/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">Evento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">Severidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">Tiempo relativo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">Acción sugerida</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">Opciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredNotifications.map((notification, index) => {
                  const severityMeta = SEVERITY_META[notification.severity] ?? SEVERITY_META.warning;
                  const SeverityIcon = severityMeta.Icon;
                  const isUnread = notification.status === "unread";
                  const markBusy = busyKey === `read:${notification.notification_id}`;
                  const archiveBusy = busyKey === `archive:${notification.notification_id}`;
                  const deleteBusy = busyKey === `delete:${notification.notification_id}`;
                  const rowClass = isUnread ? severityMeta.rowClass : "bg-white";

                  return (
                    <tr key={notification.notification_id} className={rowClass}>
                      <td className="align-top px-4 py-4 text-sm font-semibold text-gray-700">{index + 1}</td>

                      <td className="align-top px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-farm-green-dark text-white shadow-sm">
                            <SeverityIcon className="h-5 w-5" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">{notification.title}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              ID alerta: <span className="font-mono text-gray-700">{notification.alert_id || "—"}</span>
                            </p>
                            <span
                              className={[
                                "mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                                isUnread ? "bg-farm-green-dark text-white" : "bg-gray-100 text-gray-700",
                              ].join(" ")}
                            >
                              {isUnread ? "Sin leer" : notification.status === "read" ? "Leída" : "Archivada"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="align-top px-4 py-4 text-sm text-gray-700">
                        <p className="max-w-[24rem] leading-6">{notification.message}</p>
                      </td>

                      <td className="align-top px-4 py-4">
                        <span className={["inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide", severityMeta.badgeClass].join(" ")}>
                          {severityMeta.label}
                        </span>
                      </td>

                      <td className="align-top px-4 py-4 text-sm text-gray-700">
                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden />
                          <span title={formatAbsoluteTime(notification.created_at)}>{formatRelativeTime(notification.created_at)}</span>
                        </div>
                      </td>

                      <td className="align-top px-4 py-4 text-sm text-gray-700">
                        <p className="max-w-[20rem] leading-6">{notification.suggested_action || "—"}</p>
                      </td>

                      <td className="align-top px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {isUnread ? (
                            <button
                              type="button"
                              disabled={markBusy}
                              onClick={() => void handleAction(notification.notification_id, "read", "read")}
                              className="inline-flex items-center gap-1.5 rounded-full border border-farm-green/30 bg-white px-3 py-2 text-xs font-semibold text-farm-green-dark transition hover:bg-farm-green-light/70 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {markBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                              Marcar como leída
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                              <CheckCheck className="h-3.5 w-3.5" />
                              Leída
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={archiveBusy}
                            onClick={() => void handleAction(notification.notification_id, "archive", "archived")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {archiveBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                            Archivar
                          </button>

                          <button
                            type="button"
                            disabled={deleteBusy}
                            onClick={() => void handleAction(notification.notification_id, "delete")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deleteBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
};

export default NotificationsCenterPage;