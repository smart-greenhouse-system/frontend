import { useCallback, useState } from "react";
import {
  Thermometer,
  Droplets,
  TriangleAlert,
  PackageSearch,
} from "lucide-react";
import AIInsightsPanel from "../../../components/ui/AIInsightsPanel";
import StatusBanner from "../../../components/ui/StatusBanner";

/** Valores numéricos compartidos entre KPI cards y StatusBanner */
const dashboardStats = {
  temperature: "25.5 °C",
  humidity: "60%",
  activeAlerts: 3,
  lowStock: 2,
};

const kpiCards = [
  {
    id: "temperature",
    label: "Temperatura",
    valueKey: "temperature",
    icon: Thermometer,
    accent: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    id: "humidity",
    label: "Humedad",
    valueKey: "humidity",
    icon: Droplets,
    accent: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    id: "alerts",
    label: "Alertas activas",
    valueKey: "activeAlerts",
    icon: TriangleAlert,
    accent: "text-red-600",
    bg: "bg-red-50",
  },
  {
    id: "low-stock",
    label: "Insumos bajos",
    valueKey: "lowStock",
    icon: PackageSearch,
    accent: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const recentInventoryMovements = [
  { id: 1, date: "2026-05-03 12:10", item: "Semillas de Tomate", action: "Ingreso", qty: "+20 paquetes" },
  { id: 2, date: "2026-05-03 11:48", item: "Fertilizante NPK", action: "Ajuste", qty: "+5 kg" },
  { id: 3, date: "2026-05-03 11:21", item: "Sustrato Orgánico", action: "Salida", qty: "-2 sacos" },
];

const DashboardHome = () => {
  const [statusBannerLoading, setStatusBannerLoading] = useState(true);
  const handleAiLoadingChange = useCallback((loading) => {
    setStatusBannerLoading(loading);
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-farm-green-dark">Dashboard General</h1>
        <p className="mt-1 text-sm text-gray-600">
          Vista rápida del estado ambiental y movimientos recientes del inventario.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(({ id, label, valueKey, icon: Icon, accent, bg }) => (
          <article key={id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 sm:text-2xl">
                  {dashboardStats[valueKey]}
                </p>
              </div>
              <span className={`shrink-0 rounded-xl p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${accent}`} />
              </span>
            </div>
          </article>
        ))}
      </div>

      <AIInsightsPanel onLoadingChange={handleAiLoadingChange} />

      {statusBannerLoading ? (
        <div
          className="h-10 w-full animate-pulse rounded-2xl bg-gray-200 shadow-sm"
          aria-busy="true"
          aria-label="Cargando estado del invernadero"
        />
      ) : (
        <StatusBanner alerts={dashboardStats.activeAlerts} lowStock={dashboardStats.lowStock} />
      )}

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-farm-green-dark">
            Últimos movimientos de inventario
          </h2>
        </div>
        <div className="overflow-x-auto">
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
              {recentInventoryMovements.map((movement) => (
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
        </div>
      </article>
    </section>
  );
};

export default DashboardHome;
