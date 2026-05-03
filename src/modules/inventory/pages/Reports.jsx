import { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const mockConsumptionData = [
  { day: "Lun", water: 120 },
  { day: "Mar", water: 140 },
  { day: "Mie", water: 110 },
  { day: "Jue", water: 160 },
  { day: "Vie", water: 130 },
  { day: "Sab", water: 100 },
  { day: "Dom", water: 90 },
];

const Reports = () => {
  const [filters, setFilters] = useState({
    reportType: "Consumo",
    fromDate: "",
    toDate: "",
    greenhouse: "Norte",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasNoData, setHasNoData] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);

  const chartData = useMemo(() => (hasNoData ? [] : mockConsumptionData), [hasNoData]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateReport = () => {
    setIsLoading(true);
    setReportGenerated(false);

    setTimeout(() => {
      setIsLoading(false);
      setReportGenerated(true);
      console.log("Reporte generado con filtros:", filters);
    }, 900);
  };

  const handleExport = (format) => {
    console.log(`Exportando reporte en formato ${format}`, filters);
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-farm-green-dark">Reportes y Analítica</h1>
        <p className="mt-1 text-sm text-gray-600">
          Genera reportes por rango de fechas e identifica patrones de operación.
        </p>
      </header>

      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label
              htmlFor="reportType"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Tipo de Reporte
            </label>
            <select
              id="reportType"
              name="reportType"
              value={filters.reportType}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20"
            >
              <option value="Consumo">Consumo</option>
              <option value="Rendimiento">Rendimiento</option>
              <option value="Clima">Clima</option>
              <option value="Actuadores">Actuadores</option>
            </select>
          </div>

          <Input
            id="fromDate"
            name="fromDate"
            type="date"
            label="Desde"
            value={filters.fromDate}
            onChange={handleFilterChange}
            className="xl:col-span-1"
          />

          <Input
            id="toDate"
            name="toDate"
            type="date"
            label="Hasta"
            value={filters.toDate}
            onChange={handleFilterChange}
            className="xl:col-span-1"
          />

          <div className="xl:col-span-2">
            <label
              htmlFor="greenhouse"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Invernadero
            </label>
            <select
              id="greenhouse"
              name="greenhouse"
              value={filters.greenhouse}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20"
            >
              <option value="Norte">Norte</option>
              <option value="Sur">Sur</option>
              <option value="Central">Central</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" className="w-auto px-5" onClick={handleGenerateReport}>
            Generar Reporte
          </Button>
          <Button
            type="button"
            className="w-auto bg-farm-green px-5 hover:bg-farm-green-dark"
            onClick={() => handleExport("CSV")}
          >
            Exportar (CSV)
          </Button>
          <Button
            type="button"
            className="w-auto bg-farm-green px-5 hover:bg-farm-green-dark"
            onClick={() => handleExport("PDF")}
          >
            Exportar (PDF)
          </Button>

          <label className="ml-auto inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={hasNoData}
              onChange={(event) => setHasNoData(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-farm-green focus:ring-farm-green/40"
            />
            Simular sin datos
          </label>
        </div>
      </article>

      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-farm-green-dark" />
          <h2 className="text-base font-semibold text-farm-green-dark">
            Consumo de agua (L) por día
          </h2>
        </div>

        {isLoading ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-600">
            Generando reporte...
          </div>
        ) : reportGenerated && chartData.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 text-center text-sm text-gray-600">
            No hay datos suficientes para generar este reporte en el rango seleccionado
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="water" name="Litros consumidos" fill="#2d6a2d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>
    </section>
  );
};

export default Reports;
