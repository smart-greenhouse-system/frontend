import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Sprout } from "lucide-react";
import Button from "../../../components/ui/Button";
import { fetchHarvestEstimation, getUserAuthToken } from "../../../lib/harvestEstimationApi";

const MATURITY_EMOJI = {
  in_progress: "🌱",
  ready: "🍅",
  harvested: "✅",
  unavailable: "⏸️",
};

const MATURITY_LABEL = {
  in_progress: "En desarrollo",
  ready: "Listo para cosecha",
  harvested: "Cosechado",
  unavailable: "No disponible",
};

/** Datos demo cuando no hay backend (preserva flujo RF-26). */
const DEMO_SUMMARY = [
  {
    crop_id: "crop-tom-01",
    species: "Tomate Cherry",
    greenhouse: "Invernadero Norte",
    sowing_date: "2026-02-10",
    cycle_days: 75,
    status_label: "Activo",
    estimated_harvest_date: "2026-04-26",
    maturity_status: "in_progress",
    cycle_defined: true,
  },
  {
    crop_id: "crop-lech-02",
    species: "Lechuga Romana",
    greenhouse: "Invernadero Sur",
    sowing_date: "2026-03-01",
    cycle_days: 45,
    status_label: "Activo",
    estimated_harvest_date: "2026-04-15",
    maturity_status: "ready",
    cycle_defined: true,
  },
  {
    crop_id: "crop-exp-03",
    species: "Especie en prueba",
    greenhouse: "Invernadero Norte",
    sowing_date: "2026-04-01",
    cycle_days: null,
    status_label: "Activo",
    estimated_harvest_date: null,
    maturity_status: "in_progress",
    cycle_defined: false,
  },
];

function formatDate(iso) {
  if (!iso) return "(por definir)";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("es");
  } catch {
    return iso;
  }
}

const HarvestEstimation = () => {
  const [rows, setRows] = useState(DEMO_SUMMARY);
  const [selectedId, setSelectedId] = useState(DEMO_SUMMARY[0]?.crop_id ?? "");
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const selected = useMemo(
    () => rows.find((r) => r.crop_id === selectedId) || null,
    [rows, selectedId]
  );

  const loadDetail = useCallback(async () => {
    if (!selectedId) return;
    setDetailError("");
    setLoadingDetail(true);
    try {
      const token = getUserAuthToken();
      const remote = await fetchHarvestEstimation(selectedId, token);
      if (remote && typeof remote === "object") {
        setDetail({
          crop_id: remote.crop_id,
          species: remote.species,
          sowing_date: remote.sowing_date,
          expected_cycle_days: remote.expected_cycle_days,
          estimated_harvest_date: remote.estimated_harvest_date,
          maturity_status: remote.maturity_status,
          source: remote.source,
        });
      } else {
        const row = rows.find((r) => r.crop_id === selectedId);
        if (row) {
          setDetail({
            crop_id: row.crop_id,
            species: row.species,
            sowing_date: row.sowing_date,
            expected_cycle_days: row.cycle_days,
            estimated_harvest_date: row.estimated_harvest_date,
            maturity_status: row.maturity_status,
            source: "species_cycle",
          });
        }
      }
    } catch (e) {
      setDetailError(e?.message || "Error al cargar detalle.");
      const row = rows.find((r) => r.crop_id === selectedId);
      if (row) {
        setDetail({
          crop_id: row.crop_id,
          species: row.species,
          sowing_date: row.sowing_date,
          expected_cycle_days: row.cycle_days,
          estimated_harvest_date: row.estimated_harvest_date,
          maturity_status: row.maturity_status,
          source: "species_cycle",
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedId, rows]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleRefreshEstimation = async () => {
    setRefreshing(true);
    setDetailError("");
    try {
      await loadDetail();
      setRows((prev) =>
        prev.map((r) => {
          if (r.crop_id !== selectedId) return r;
          if (!r.cycle_defined || !r.estimated_harvest_date) return r;
          const base = new Date(`${r.estimated_harvest_date}T00:00:00`);
          base.setDate(base.getDate() + 1);
          const next = base.toISOString().slice(0, 10);
          return { ...r, estimated_harvest_date: next };
        })
      );
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-farm-green-dark">Cosecha estimada</h1>
        <p className="mt-1 text-sm text-gray-600">
          Planificación por cultivo (RF-26): resumen de cultivos activos y detalle con estimación
          actualizable.
        </p>
      </header>

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-farm-green-light/50 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-farm-green-dark">
            <Sprout className="h-5 w-5" aria-hidden />
            Resumen de cultivos activos
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-farm-green-light/80">
                <th className="px-4 py-3 font-bold uppercase tracking-wide text-farm-green-dark">
                  Cultivo
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wide text-farm-green-dark">
                  Invernadero
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wide text-farm-green-dark">
                  Siembra
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wide text-farm-green-dark">
                  Ciclo (días)
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wide text-farm-green-dark">
                  Estado
                </th>
                <th className="px-4 py-3 font-bold uppercase tracking-wide text-farm-green-dark">
                  Cosecha estimada
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr
                  key={r.crop_id}
                  onClick={() => setSelectedId(r.crop_id)}
                  className={[
                    "cursor-pointer transition-colors",
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/90",
                    selectedId === r.crop_id ? "ring-2 ring-inset ring-farm-green/50" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{r.species}</td>
                  <td className="px-4 py-3 text-gray-700">{r.greenhouse}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(r.sowing_date)}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.cycle_days != null ? r.cycle_days : "(por definir)"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.status_label}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.cycle_defined ? formatDate(r.estimated_harvest_date) : "(por definir)"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      {selected ? (
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-farm-green-dark">Detalle del cultivo</h2>
          {detailError ? (
            <p className="mt-2 text-sm text-amber-800" role="alert">
              {detailError} (mostrando datos locales)
            </p>
          ) : null}
          {loadingDetail && !detail ? (
            <p className="mt-4 text-sm text-gray-500">Cargando estimación…</p>
          ) : detail ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Especie</dt>
                <dd className="text-gray-900">{detail.species}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Fecha de siembra</dt>
                <dd className="text-gray-900">{formatDate(detail.sowing_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Ciclo esperado</dt>
                <dd className="text-gray-900">
                  {detail.expected_cycle_days != null
                    ? `${detail.expected_cycle_days} días`
                    : "(por definir)"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">
                  Cosecha estimada 📅
                </dt>
                <dd className="flex items-center gap-2 text-gray-900">
                  <Calendar className="h-4 w-4 text-farm-green-dark" aria-hidden />
                  {formatDate(detail.estimated_harvest_date)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Maduración</dt>
                <dd className="text-gray-900">
                  <span className="mr-1" aria-hidden>
                    {MATURITY_EMOJI[detail.maturity_status] ?? "🌱"}
                  </span>
                  {MATURITY_LABEL[detail.maturity_status] ?? detail.maturity_status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">Fuente</dt>
                <dd className="text-gray-900">
                  {detail.source === "species_cycle_and_ai_adjustment"
                    ? "Ciclo de especie + ajuste IA"
                    : "Ciclo de especie"}
                </dd>
              </div>
            </dl>
          ) : null}
          <div className="mt-6 max-w-xs">
            <Button
              type="button"
              onClick={handleRefreshEstimation}
              disabled={refreshing || !selected?.cycle_defined}
              className={refreshing ? "opacity-80" : ""}
            >
              {refreshing ? "Actualizando…" : "Actualizar estimación"}
            </Button>
            {!selected?.cycle_defined ? (
              <p className="mt-2 text-xs text-gray-500">
                Sin ciclo configurado para esta especie; no se recalcula la fecha.
              </p>
            ) : null}
          </div>
        </article>
      ) : null}
    </section>
  );
};

export default HarvestEstimation;
