import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import { getUserAuthToken } from "../../../lib/alertsApi.js";
import {
  fetchHarvestEstimation,
  fetchIaPlantGrowth,
  fetchIaPredictions,
} from "../../../lib/harvestEstimationApi.js";

const ACTIVE_CROPS = [
  { crop_id: "crop-demo-1", name: "Tomate Cherry", greenhouse: "Invernadero Norte" },
  { crop_id: "crop-demo-2", name: "Lechuga Romana", greenhouse: "Invernadero Sur" },
];

function formatEsDate(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** RF-26 — maturity_status */
const MATURITY_RF = {
  in_progress: { emoji: "🌱", label: "En desarrollo" },
  ready: { emoji: "✅", label: "Listo para cosecha" },
  harvested: { emoji: "🌾", label: "Cosechado" },
  unavailable: { emoji: "⛔", label: "No disponible" },
};

/** Contrato IA sección D — estado_planta (saludable, enferma, etc.) */
function plantStateFromIa(estadoRaw) {
  if (!estadoRaw || typeof estadoRaw !== "string") return { emoji: "❔", label: "Sin dato IA", key: "unknown" };
  const s = estadoRaw.trim().toLowerCase();
  const map = [
    { keys: ["saludable", "healthy", "ok"], emoji: "🌿", label: "Saludable" },
    { keys: ["enferma", "enfermo", "diseased", "sick"], emoji: "🥀", label: "Enferma" },
    { keys: ["estrés", "estres", "stress", "water_stress"], emoji: "💧", label: "Estrés / aviso" },
    { keys: ["debil", "débil", "weak"], emoji: "🫠", label: "Debilidad" },
    { keys: ["normal", "regular"], emoji: "🌱", label: "Normal" },
  ];
  for (const row of map) {
    if (row.keys.some((k) => s.includes(k))) return { emoji: row.emoji, label: row.label, key: s };
  }
  return { emoji: "🌿", label: estadoRaw, key: s };
}

function sourceBadge(source) {
  if (source === "species_cycle_and_ai_adjustment") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-900">
        <span aria-hidden>🤖</span> Ciclo + ajuste IA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
      <span aria-hidden>📐</span> Solo ciclo de especie
    </span>
  );
}

const HarvestEstimation = () => {
  const [rows, setRows] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [predError, setPredError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  const loadRow = useCallback(async (crop) => {
    const token = getUserAuthToken();
    let estimation = null;
    let estimationMeta = { missingCycle: false, message: "" };

    try {
      estimation = await fetchHarvestEstimation(crop.crop_id, token);
    } catch (e) {
      if (e?.code === "MISSING_CROP_CYCLE" || e?.body?.code === "MISSING_CROP_CYCLE") {
        estimationMeta = { missingCycle: true, message: e?.message || "Ciclo no configurado" };
      } else {
        estimationMeta = { missingCycle: false, message: e?.message || "Error" };
      }
    }

    const growth = await fetchIaPlantGrowth(token, crop.crop_id);
    const estadoPlanta = growth?.estado_planta ?? growth?.estado ?? null;

    return {
      crop,
      estimation,
      estimationMeta,
      growth,
      estadoPlanta,
      plantVisual: plantStateFromIa(estadoPlanta),
    };
  }, []);

  const refreshAll = useCallback(async () => {
    const token = getUserAuthToken();
    const loaded = await Promise.all(ACTIVE_CROPS.map((c) => loadRow(c)));
    setRows(loaded);

    setPredError("");
    try {
      const p = await fetchIaPredictions(token);
      setPredictions(p);
    } catch (e) {
      setPredictions(null);
      setPredError(e?.message || "");
    }
  }, [loadRow]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial de estimaciones e IA
    void refreshAll();
  }, [refreshAll]);

  const refreshOne = useCallback(
    async (cropId) => {
      const crop = ACTIVE_CROPS.find((c) => c.crop_id === cropId);
      if (!crop) return;
      setRefreshingId(cropId);
      const updated = await loadRow(crop);
      setRows((prev) => prev.map((r) => (r.crop.crop_id === cropId ? updated : r)));
      setRefreshingId(null);
    },
    [loadRow],
  );

  const selected = useMemo(() => rows.find((r) => r.crop.crop_id === selectedId) ?? null, [rows, selectedId]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-farm-green-dark">Estimación de cosecha</h1>
        <p className="mt-2 text-sm text-gray-600">
          RF-26: planificación por cultivo activo. Integración con predicciones y estado de planta (contrato IA C y D).
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-sky-900">Predicciones ambientales (IA · sección C)</h2>
          {predError ? (
            <p className="mt-2 text-sm text-amber-800">{predError}</p>
          ) : predictions ? (
            <div className="mt-3 space-y-2 text-sm text-gray-800">
              <p>
                <span className="font-medium">Temperatura prevista:</span>{" "}
                {predictions?.predicciones?.temperatura != null
                  ? `${predictions.predicciones.temperatura} °C`
                  : "—"}
              </p>
              <p>
                <span className="font-medium">Humedad relativa prevista:</span>{" "}
                {predictions?.predicciones?.humedad_relativa != null
                  ? `${predictions.predicciones.humedad_relativa} %`
                  : "—"}
              </p>
              {predictions?.alerta ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                  <span className="font-medium">Alerta:</span> {predictions.alerta}
                </p>
              ) : null}
              <p className="text-xs text-gray-500">
                Fuente: <code className="rounded bg-white/80 px-1">GET /api/ia/predictions</code>
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Cargando predicciones…</p>
          )}
        </article>
        <div className="flex items-stretch">
          <Button type="button" onClick={() => void refreshAll()} className="h-full min-h-[48px]">
            Actualizar todo
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-farm-green-light/50 px-5 py-4">
          <h2 className="text-base font-semibold text-farm-green-dark">Cultivos activos y cosecha estimada</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-farm-green-light/70">
                <th className="px-4 py-3 text-xs font-bold uppercase text-farm-green-dark">Cultivo</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-farm-green-dark">Invernadero</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-farm-green-dark">Siembra</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-farm-green-dark">Ciclo (días)</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-farm-green-dark">Estado (IA planta)</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-farm-green-dark">Madurez (ciclo)</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-farm-green-dark">Cosecha estimada</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-farm-green-dark">Origen</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0
                ? ACTIVE_CROPS.map((c, i) => (
                    <tr key={c.crop_id} className={i % 2 ? "bg-farm-green-light/20" : "bg-white"}>
                      <td className="px-4 py-3" colSpan={8}>
                        Cargando…
                      </td>
                    </tr>
                  ))
                : rows.map((r, idx) => {
                    const est = r.estimation;
                    const sow = est?.sowing_date;
                    const cycle =
                      est?.expected_cycle_days != null && est.expected_cycle_days !== ""
                        ? String(est.expected_cycle_days)
                        : r.estimationMeta?.missingCycle
                          ? "(por definir)"
                          : "—";
                    const harvest =
                      est?.estimated_harvest_date != null
                        ? formatEsDate(est.estimated_harvest_date)
                        : r.estimationMeta?.missingCycle
                          ? "(por definir)"
                          : "—";
                    const mat = est?.maturity_status;
                    const matVis = MATURITY_RF[mat] ?? { emoji: "❔", label: mat || "—" };
                    const src = est?.source;

                    return (
                      <tr
                        key={r.crop.crop_id}
                        className={[
                          "cursor-pointer border-b border-gray-100 transition hover:bg-farm-green-light/30",
                          idx % 2 ? "bg-farm-green-light/15" : "bg-white",
                          selectedId === r.crop.crop_id ? "ring-2 ring-inset ring-farm-green/40" : "",
                        ].join(" ")}
                        onClick={() => setSelectedId(r.crop.crop_id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(r.crop.crop_id);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{r.crop.name}</td>
                        <td className="px-4 py-3 text-gray-700">{r.crop.greenhouse}</td>
                        <td className="px-4 py-3 text-gray-700">{sow ? formatEsDate(sow) : "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{cycle}</td>
                        <td className="px-4 py-3">
                          <span className="whitespace-nowrap">
                            <span aria-hidden>{r.plantVisual?.emoji}</span>{" "}
                            <span className="font-medium text-gray-800">{r.plantVisual?.label}</span>
                          </span>
                          {r.estadoPlanta ? (
                            <span className="mt-0.5 block text-xs text-gray-500">API: {r.estadoPlanta}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="whitespace-nowrap">
                            <span aria-hidden>{matVis.emoji}</span> {matVis.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800">
                          <span className="inline-flex items-center gap-1">
                            <span aria-hidden>📅</span>
                            {harvest}
                          </span>
                        </td>
                        <td className="px-4 py-3">{src ? sourceBadge(src) : <span className="text-gray-400">—</span>}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h2 className="text-lg font-semibold text-farm-green-dark">
              Detalle — {selected.crop.name}{" "}
              <span className="font-normal text-gray-600">({selected.crop.greenhouse})</span>
            </h2>
            <Button
              type="button"
              className="w-auto min-w-[180px]"
              disabled={refreshingId === selected.crop.crop_id}
              onClick={() => void refreshOne(selected.crop.crop_id)}
            >
              {refreshingId === selected.crop.crop_id ? "Actualizando…" : "Actualizar estimación"}
            </Button>
          </div>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase text-gray-500">Especie (RF-26)</dt>
              <dd className="mt-1 text-gray-900">{selected.estimation?.species ?? "—"}</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase text-gray-500">Fecha de siembra</dt>
              <dd className="mt-1 text-gray-900">
                {selected.estimation?.sowing_date ? formatEsDate(selected.estimation.sowing_date) : "—"}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase text-gray-500">Ciclo esperado (días)</dt>
              <dd className="mt-1 text-gray-900">
                {selected.estimation?.expected_cycle_days != null && selected.estimation.expected_cycle_days !== ""
                  ? selected.estimation.expected_cycle_days
                  : "(por definir)"}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase text-gray-500">Cosecha estimada</dt>
              <dd className="mt-1 inline-flex items-center gap-2 text-gray-900">
                <span aria-hidden>📅</span>
                {selected.estimation?.estimated_harvest_date
                  ? formatEsDate(selected.estimation.estimated_harvest_date)
                  : "(por definir)"}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase text-gray-500">Origen de la predicción</dt>
              <dd className="mt-2">{selected.estimation?.source ? sourceBadge(selected.estimation.source) : "—"}</dd>
              <dd className="mt-2 text-xs text-gray-600">
                {selected.estimation?.source === "species_cycle_and_ai_adjustment"
                  ? "La fecha incorpora ajuste según modelo de madurez / IA."
                  : selected.estimation?.source === "species_cycle"
                    ? "Calculado solo con siembra + ciclo de la especie."
                    : selected.estimationMeta?.missingCycle
                      ? selected.estimationMeta.message
                      : "Sin datos de estimación."}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <dt className="text-xs font-semibold uppercase text-gray-500">Estado planta (IA · sección D)</dt>
              <dd className="mt-1 text-lg">
                <span aria-hidden>{selected.plantVisual?.emoji}</span>{" "}
                <span className="font-medium text-gray-900">{selected.plantVisual?.label}</span>
              </dd>
              <dd className="mt-1 text-xs text-gray-500">
                <code className="rounded bg-white px-1">GET /api/ia/growth</code>
                {selected.growth?.timestamp ? ` · ${selected.growth.timestamp}` : ""}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase text-gray-500">Madurez según cultivo (RF-26)</dt>
              <dd className="mt-1 text-gray-900">
                {(() => {
                  const m = selected.estimation?.maturity_status;
                  const v = MATURITY_RF[m];
                  if (!v) return m || "—";
                  return (
                    <span>
                      {v.emoji} {v.label} <span className="text-gray-500">({m})</span>
                    </span>
                  );
                })()}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="text-center text-sm text-gray-500">Selecciona un cultivo en la tabla para ver el detalle.</p>
      )}
    </div>
  );
};

export default HarvestEstimation;
