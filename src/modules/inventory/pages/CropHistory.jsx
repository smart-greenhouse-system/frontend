import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";

const mockCropHistory = [
  {
    id: 1,
    species: "Tomate",
    sowingDate: "2026-01-10",
    estimatedHarvestDate: "2026-03-25",
    actualHarvestDate: "2026-03-23",
    operatorObservations: "Buen nivel de maduración, frutos homogéneos.",
  },
  {
    id: 2,
    species: "Lechuga",
    sowingDate: "2026-02-01",
    estimatedHarvestDate: "2026-03-10",
    actualHarvestDate: null,
    operatorObservations: "Se detectó crecimiento desigual por baja luz en semana 3.",
  },
  {
    id: 3,
    species: "Albahaca",
    sowingDate: "2026-01-25",
    estimatedHarvestDate: "2026-03-05",
    actualHarvestDate: "2026-03-08",
    operatorObservations: "Cosecha parcial escalonada por demanda del lote.",
  },
  {
    id: 4,
    species: "Tomate",
    sowingDate: "2026-03-03",
    estimatedHarvestDate: "2026-05-20",
    actualHarvestDate: null,
    operatorObservations: "Ciclo activo, aún en seguimiento de maduración.",
  },
];

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
};

const getDifferenceText = (estimatedDate, realDate) => {
  if (!realDate) return "Sin cosecha real registrada";

  const estimated = new Date(`${estimatedDate}T00:00:00`);
  const actual = new Date(`${realDate}T00:00:00`);
  const diffDays = Math.round((actual - estimated) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Cosecha en la fecha estimada";
  if (diffDays < 0) return `${Math.abs(diffDays)} días antes de lo estimado`;
  return `${diffDays} días después de lo estimado`;
};

const CropHistory = () => {
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedCrop, setSelectedCrop] = useState(null);

  const filteredHistory = useMemo(() => {
    return mockCropHistory.filter((crop) => {
      const matchesSpecies = speciesFilter ? crop.species === speciesFilter : true;
      const matchesFrom = fromDate ? crop.sowingDate >= fromDate : true;
      const matchesTo = toDate ? crop.sowingDate <= toDate : true;
      return matchesSpecies && matchesFrom && matchesTo;
    });
  }, [speciesFilter, fromDate, toDate]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-farm-green-dark">Histórico de Cultivos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Consulta cosechas anteriores y revisa el detalle completo por cultivo.
        </p>
      </header>

      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="species" className="mb-2 block text-sm font-medium text-gray-700">
              Especie
            </label>
            <select
              id="species"
              value={speciesFilter}
              onChange={(event) => setSpeciesFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20"
            >
              <option value="">Todas las especies</option>
              <option value="Tomate">Tomate</option>
              <option value="Lechuga">Lechuga</option>
              <option value="Albahaca">Albahaca</option>
            </select>
          </div>

          <Input
            id="fromDate"
            name="fromDate"
            type="date"
            label="Desde"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />

          <Input
            id="toDate"
            name="toDate"
            type="date"
            label="Hasta"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full md:divide-y md:divide-gray-200">
            <thead className="hidden bg-farm-green-light/50 md:table-header-group">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Cultivo
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Fecha Siembra
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Fecha Cosecha Estimada
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Fecha Cosecha Real
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="block space-y-3 bg-white p-3 md:table-row-group md:space-y-0 md:p-0">
              {filteredHistory.map((crop) => {
                const isCompleted = Boolean(crop.actualHarvestDate);
                return (
                  <tr
                    key={crop.id}
                    className="block cursor-pointer rounded-xl border border-gray-200 p-3 shadow-sm md:table-row md:rounded-none md:border-0 md:p-0 md:shadow-none md:hover:bg-gray-50"
                    onClick={() => setSelectedCrop(crop)}
                  >
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:font-medium md:text-gray-800">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Cultivo
                      </span>
                      <span className="text-right font-medium text-gray-800 md:text-left">{crop.species}</span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Siembra
                      </span>
                      <span className="text-right text-gray-700 md:text-left">{formatDate(crop.sowingDate)}</span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Estimada
                      </span>
                      <span className="text-right text-gray-700 md:text-left">
                        {formatDate(crop.estimatedHarvestDate)}
                      </span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Cosecha Real
                      </span>
                      <span className="text-right text-gray-700 md:text-left">
                        {crop.actualHarvestDate ? formatDate(crop.actualHarvestDate) : "-"}
                      </span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Estado
                      </span>
                      <span className="flex justify-end md:justify-start">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-2 font-medium text-green-700">
                            <CheckCircle2 className="h-4 w-4" /> Completado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 font-medium text-amber-700">
                            <AlertTriangle className="h-4 w-4" /> Datos Incompletos
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      <Modal
        isOpen={Boolean(selectedCrop)}
        onClose={() => setSelectedCrop(null)}
        title={selectedCrop ? `Detalle de ${selectedCrop.species}` : "Detalle de cultivo"}
      >
        {selectedCrop ? (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="grid gap-3 md:grid-cols-2">
              <p>
                <span className="font-semibold text-gray-900">Fecha de siembra:</span>{" "}
                {formatDate(selectedCrop.sowingDate)}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Fecha estimada:</span>{" "}
                {formatDate(selectedCrop.estimatedHarvestDate)}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Fecha real:</span>{" "}
                {selectedCrop.actualHarvestDate ? formatDate(selectedCrop.actualHarvestDate) : "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Diferencia:</span>{" "}
                {getDifferenceText(selectedCrop.estimatedHarvestDate, selectedCrop.actualHarvestDate)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="font-semibold text-gray-900">Observaciones del operador</p>
              <p className="mt-1">{selectedCrop.operatorObservations}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
};

export default CropHistory;
