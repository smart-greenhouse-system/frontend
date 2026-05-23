import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Boxes,
  Brain,
  Droplets,
  PackageSearch,
  SlidersHorizontal,
  Thermometer,
  TriangleAlert,
} from "lucide-react";
import Button from "../../components/ui/Button";
import TemperatureTrendChart from "./components/TemperatureTrendChart";
import PredictionInsightsPanel from "../ia/components/PredictionInsightsPanel";
import SensorCard from "../monitoreo/components/SensorCard";
import { getActuatorEvents } from "../../lib/actuatorEventsApi";
import { getActuators } from "../../lib/actuatorApi";
import { getInventory } from "../../lib/inventoryApi";
import { getLatestImageAnalysis } from "../../lib/predictionApi";
import { getLatestReadings } from "../../lib/sensorApi";

const SENSOR_KEYS = ["temperatura", "humedad_relativa", "humedad_suelo", "iluminacion"];

function formatKpi(key, value) {
  if (value == null || value === "") return "—";
  if (key === "temperatura") return `${value} °C`;
  if (key === "humedad_relativa" || key === "humedad_suelo") return `${value}%`;
  if (key === "iluminacion") return `${Number(value).toLocaleString("es-ES")} lux`;
  return String(value);
}

function countLowStock(items) {
  return items.filter(
    (item) =>
      item.threshold_minimo != null && item.cantidad <= item.threshold_minimo
  ).length;
}

function countActiveActuators(actuators) {
  const list = Array.isArray(actuators) ? actuators : [];
  return list.filter((a) => {
    const estado = (a.estado ?? "").toString().toUpperCase();
    return estado === "ON" || estado === "ENCENDIDO" || estado === "ACTIVE";
  }).length;
}

function countRecentAlerts(events) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return events.filter((e) => {
    const t = e.created_at ? new Date(e.created_at).getTime() : 0;
    if (t < dayAgo) return false;
    const status = (e.status ?? "").toLowerCase();
    return status.includes("fail") || status.includes("error") || status.includes("warn");
  }).length;
}

const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sensorReading, setSensorReading] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [kpis, setKpis] = useState({
    temperatura: null,
    humedad_relativa: null,
    alertas: 0,
    insumos_bajos: 0,
    actuadores_activos: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [chartRefreshToken, setChartRefreshToken] = useState(0);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      getLatestReadings(),
      getLatestImageAnalysis(),
      getInventory(),
      getActuators(),
      getActuatorEvents(),
    ]);

    const [sensorsRes, predRes, invRes, actRes, eventsRes] = results;

    if (sensorsRes.status === "fulfilled") {
      const readings = sensorsRes.value;
      const primary = readings[0] ?? null;
      setSensorReading(primary);
      setKpis((prev) => ({
        ...prev,
        temperatura: primary?.temperatura ?? null,
        humedad_relativa: primary?.humedad_relativa ?? null,
      }));
    }

    if (predRes.status === "fulfilled") {
      setPrediction(predRes.value);
    } else {
      setPrediction(null);
    }

    if (invRes.status === "fulfilled") {
      setKpis((prev) => ({
        ...prev,
        insumos_bajos: countLowStock(invRes.value),
      }));
    }

    if (actRes.status === "fulfilled") {
      setKpis((prev) => ({
        ...prev,
        actuadores_activos: countActiveActuators(actRes.value),
      }));
    }

    if (eventsRes.status === "fulfilled") {
      const events = [...eventsRes.value].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setRecentEvents(events.slice(0, 5));
      setKpis((prev) => ({
        ...prev,
        alertas: countRecentAlerts(eventsRes.value) || events.length,
      }));
    }

    const allFailed = results.every((r) => r.status === "rejected");
    if (allFailed) {
      const firstErr = results.find((r) => r.status === "rejected");
      setError(firstErr?.reason?.message ?? "No se pudo cargar el dashboard.");
    }

    setChartRefreshToken((n) => n + 1);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const kpiCards = useMemo(
    () => [
      {
        id: "temperatura",
        label: "Temperatura",
        value: formatKpi("temperatura", kpis.temperatura),
        icon: Thermometer,
        accent: "text-orange-500",
        bg: "bg-orange-50",
      },
      {
        id: "humedad_relativa",
        label: "Humedad relativa",
        value: formatKpi("humedad_relativa", kpis.humedad_relativa),
        icon: Droplets,
        accent: "text-sky-600",
        bg: "bg-sky-50",
      },
      {
        id: "alertas",
        label: "Eventos / alertas (24h)",
        value: String(kpis.alertas),
        icon: TriangleAlert,
        accent: "text-red-600",
        bg: "bg-red-50",
      },
      {
        id: "insumos",
        label: "Insumos bajos",
        value: String(kpis.insumos_bajos),
        icon: PackageSearch,
        accent: "text-amber-600",
        bg: "bg-amber-50",
      },
    ],
    [kpis]
  );

  const quickLinks = [
    { to: "/monitoreo", label: "Monitoreo IoT", icon: Activity },
    { to: "/ia", label: "Resultados IA", icon: Brain },
    { to: "/control", label: "Control actuadores", icon: SlidersHorizontal },
    { to: "/inventory", label: "Inventario", icon: Boxes },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-farm-green-dark sm:text-3xl">
            Dashboard General
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Vista consolidada: sensores, IA, inventario y actuadores.
          </p>
        </div>
        <Button
          type="button"
          className="w-auto px-4 py-2 text-sm"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Actualizando…" : "Actualizar"}
        </Button>
      </header>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error} — Se muestran los módulos que respondieron correctamente.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        {kpiCards.map(({ id, label, value, icon: Icon, accent, bg }) => (
          <article
            key={id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            {loading ? (
              <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-gray-900 sm:text-2xl">
                    {value}
                  </p>
                </div>
                <span className={`rounded-xl p-2 ${bg}`}>
                  <Icon className={`h-5 w-5 ${accent}`} />
                </span>
              </div>
            )}
          </article>
        ))}
      </div>

      <TemperatureTrendChart
        deviceId={sensorReading?.device_id ?? null}
        refreshToken={chartRefreshToken}
      />

      <div className="flex flex-wrap gap-2">
        {quickLinks.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-farm-green-dark ring-1 ring-farm-green/20 transition hover:bg-farm-green-light"
          >
            <Icon className="h-4 w-4" />
            {label}
            <ArrowRight className="h-3.5 w-3.5 opacity-60" />
          </Link>
        ))}
      </div>

      {loading && !prediction ? (
        <div className="h-36 animate-pulse rounded-2xl bg-gray-100" />
      ) : (
        <PredictionInsightsPanel analysis={prediction} compact />
      )}

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-farm-green-dark">Sensores en tiempo real</h2>
          <Link to="/monitoreo" className="text-sm font-medium text-farm-green hover:underline">
            Ver monitoreo completo
          </Link>
        </div>
        {loading && !sensorReading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : sensorReading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SENSOR_KEYS.map((key) => (
              <SensorCard key={key} sensorKey={key} value={sensorReading[key]} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-8 text-center text-sm text-gray-500">
            Sin lecturas de sensores. Revisa GET /api/sensors/latest.
          </p>
        )}
      </div>

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-farm-green-dark">
            Últimos eventos de actuadores
          </h2>
          <span className="text-xs text-gray-500">
            Activos ahora: <strong>{kpis.actuadores_activos}</strong>
          </span>
        </div>
        {loading && recentEvents.length === 0 ? (
          <div className="space-y-2 p-5">
            <div className="h-8 animate-pulse rounded bg-gray-100" />
            <div className="h-8 animate-pulse rounded bg-gray-100" />
          </div>
        ) : recentEvents.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">Sin eventos recientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-farm-green-light/40 text-left text-xs uppercase tracking-wide text-farm-green-dark">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Dispositivo</th>
                  <th className="px-5 py-3">Actuador</th>
                  <th className="px-5 py-3">Acción</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {ev.created_at
                        ? new Date(ev.created_at).toLocaleString("es-ES", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-farm-green-dark">
                      {ev.device_id}
                    </td>
                    <td className="px-5 py-3 capitalize">{ev.actuator}</td>
                    <td className="px-5 py-3 font-medium">{ev.action}</td>
                    <td className="px-5 py-3">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          ev.executed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 text-gray-600",
                        ].join(" ")}
                      >
                        {ev.status || (ev.executed ? "OK" : "Pendiente")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
};

export default DashboardHome;
