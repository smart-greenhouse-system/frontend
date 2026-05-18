import { useCallback, useEffect, useState } from "react";
import {
  Thermometer,
  Droplets,
  TriangleAlert,
  PackageSearch,
} from "lucide-react";
import AIInsightsPanel from "../../../components/ui/AIInsightsPanel";
import RecommendedActionsPanel from "../../../components/ui/RecommendedActionsPanel";
import StatusBanner from "../../../components/ui/StatusBanner";
import Button from "../../../components/ui/Button";
import { getDashboardData } from "../../../lib/dashboardApi";

function formatKpiValue(key, value) {
  if (value == null || value === "") return "—";
  if (key === "temperatura") return `${value} °C`;
  if (key === "humedad_relativa") return `${value}%`;
  return String(value);
}

const kpiCards = [
  {
    id: "temperatura",
    label: "Temperatura",
    valueKey: "temperatura",
    icon: Thermometer,
    accent: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    id: "humedad_relativa",
    label: "Humedad relativa",
    valueKey: "humedad_relativa",
    icon: Droplets,
    accent: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    id: "alertas",
    label: "Alertas activas",
    valueKey: "alertas_activas",
    icon: TriangleAlert,
    accent: "text-red-600",
    bg: "bg-red-50",
  },
  {
    id: "insumos_bajos",
    label: "Insumos bajos",
    valueKey: "insumos_bajos",
    icon: PackageSearch,
    accent: "text-amber-600",
    bg: "bg-amber-50",
  },
];

function mapDashboardKpis(data) {
  const env = data?.ambiente ?? data?.environment ?? data?.kpis ?? data ?? {};
  const alertas = data?.alertas ?? data?.alerts ?? {};

  return {
    temperatura: env.temperatura ?? env.temperature,
    humedad_relativa: env.humedad_relativa ?? env.humidity,
    alertas_activas:
      alertas.total ?? alertas.activas ?? data?.alertas_activas ?? data?.alertas_count ?? 0,
    insumos_bajos: data?.insumos_bajos ?? data?.low_stock_count ?? data?.inventario_bajo ?? 0,
  };
}

function mapRecentMovements(data) {
  const raw =
    data?.movimientos_recientes ??
    data?.recent_activities ??
    data?.recent_inventory_movements ??
    [];
  if (!Array.isArray(raw)) return [];

  return raw.map((row, index) => ({
    id: row.id ?? row.movimiento_id ?? index,
    date: row.fecha ?? row.date ?? row.timestamp ?? "—",
    item: row.insumo ?? row.item ?? row.nombre ?? "—",
    action: row.movimiento ?? row.action ?? row.tipo ?? "—",
    qty: row.cantidad ?? row.qty ?? row.cantidad_texto ?? "—",
  }));
}

const DashboardHome = () => {
  const [kpis, setKpis] = useState({
    temperatura: null,
    humedad_relativa: null,
    alertas_activas: 0,
    insumos_bajos: 0,
  });
  const [movements, setMovements] = useState([]);
  const [dashboardStatus, setDashboardStatus] = useState("loading");
  const [dashboardError, setDashboardError] = useState("");
  const [statusBannerLoading, setStatusBannerLoading] = useState(true);

  const handleAiLoadingChange = useCallback((loading) => {
    setStatusBannerLoading(loading);
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardStatus("loading");
    setDashboardError("");
    try {
      const data = await getDashboardData();
      setKpis(mapDashboardKpis(data));
      setMovements(mapRecentMovements(data));
      setDashboardStatus("success");
    } catch (err) {
      setDashboardError(
        err.response?.data?.message || err.message || "No se pudo cargar el dashboard."
      );
      setDashboardStatus("error");
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-farm-green-dark">Dashboard General</h1>
        <p className="mt-1 text-sm text-gray-600">
          Vista rápida del estado ambiental, recomendaciones de la IA y movimientos de inventario.
        </p>
      </header>

      <RecommendedActionsPanel onLoadingChange={handleAiLoadingChange} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(({ id, label, valueKey, icon: Icon, accent, bg }) => (
          <article key={id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                {dashboardStatus === "loading" ? (
                  <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-gray-200" />
                ) : (
                  <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl">
                    {formatKpiValue(valueKey, kpis[valueKey])}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-xl p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${accent}`} />
              </span>
            </div>
          </article>
        ))}
      </div>

      {dashboardStatus === "error" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{dashboardError}</span>
          <Button type="button" className="w-auto px-3 py-1.5 text-sm" onClick={loadDashboard}>
            Reintentar KPIs
          </Button>
        </div>
      ) : null}

      <AIInsightsPanel onLoadingChange={handleAiLoadingChange} />

      {statusBannerLoading ? (
        <div
          className="h-10 w-full animate-pulse rounded-2xl bg-gray-200 shadow-sm"
          aria-busy="true"
          aria-label="Cargando estado del invernadero"
        />
      ) : (
        <StatusBanner alerts={kpis.alertas_activas} lowStock={kpis.insumos_bajos} />
      )}

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-farm-green-dark">
            Últimos movimientos de inventario
          </h2>
        </div>
        <div className="overflow-x-auto">
          {dashboardStatus === "loading" ? (
            <div className="space-y-2 p-5">
              <div className="h-8 animate-pulse rounded bg-gray-200" />
              <div className="h-8 animate-pulse rounded bg-gray-200" />
            </div>
          ) : movements.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              No hay movimientos recientes registrados.
            </p>
          ) : (
            <table className="min-w-full md:divide-y md:divide-gray-200">
              <thead className="hidden bg-farm-green-light/50 md:table-header-group">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Fecha
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Insumo
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Movimiento
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody className="block space-y-3 bg-white p-3 md:table-row-group md:space-y-0 md:p-0">
                {movements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="block rounded-xl border border-gray-200 p-3 shadow-sm md:table-row md:rounded-none md:border-0 md:p-0 md:shadow-none md:hover:bg-gray-50"
                  >
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Fecha
                      </span>
                      <span className="text-right text-gray-700 md:text-left">{movement.date}</span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:font-medium md:text-gray-800">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Insumo
                      </span>
                      <span className="text-right font-medium text-gray-800 md:text-left">
                        {movement.item}
                      </span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Movimiento
                      </span>
                      <span className="text-right text-gray-700 md:text-left">{movement.action}</span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Cantidad
                      </span>
                      <span className="text-right text-gray-700 md:text-left">{movement.qty}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>
    </section>
  );
};

export default DashboardHome;
