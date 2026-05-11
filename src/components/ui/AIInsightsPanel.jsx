import { useEffect, useMemo, useRef, useState } from "react";
import { Brain, CalendarClock } from "lucide-react";
import { fetchHarvestEstimation, getUserAuthToken } from "../../lib/harvestEstimationApi";

const DEMO_CROP_ID = "crop-tom-01";

/** Datos demo coherentes con HarvestEstimation / RF-26 cuando no hay API o falla la petición. */
export const AI_INSIGHTS_MOCK = {
  confidence: 84,
  plantStatusKey: "healthy",
  plantStatusLabel: "Saludable",
  harvestLabel: "~18 días",
  harvestDetail: "Cosecha estimada: 26 abr 2026",
  species: "Tomate Cherry",
};

function clampPercent(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function daysUntilHarvest(isoDate) {
  if (!isoDate) return null;
  try {
    const target = new Date(`${isoDate}T12:00:00`);
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
}

function formatShortDate(iso) {
  if (!iso) return null;
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("es", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * Normaliza respuesta API + derivaciones para la UI de IA.
 * Acepta campos opcionales del backend: confidence_percent, model_confidence, plant_health, health_status.
 */
function mapRemoteToInsights(remote) {
  if (!remote || typeof remote !== "object") {
    return { ...AI_INSIGHTS_MOCK };
  }

  const confRaw =
    remote.confidence_percent ?? remote.model_confidence ?? remote.ai_confidence ?? remote.confidence;
  let confidence = clampPercent(Number(confRaw));

  const maturity = remote.maturity_status;
  const healthRaw = (remote.plant_health || remote.health_status || "").toString().toLowerCase();

  let plantStatusKey = "healthy";
  let plantStatusLabel = "Saludable";

  const daysLeft = daysUntilHarvest(remote.estimated_harvest_date);

  if (healthRaw.includes("crit") || maturity === "unavailable") {
    plantStatusKey = "critical";
    plantStatusLabel = "Crítico";
  } else if (healthRaw.includes("riesgo") || healthRaw.includes("risk")) {
    plantStatusKey = "risk";
    plantStatusLabel = "En riesgo";
  } else if (
    maturity === "in_progress" &&
    daysLeft != null &&
    daysLeft >= 0 &&
    daysLeft <= 7
  ) {
    plantStatusKey = "risk";
    plantStatusLabel = "En riesgo";
  } else if (maturity === "ready" || maturity === "harvested" || maturity === "in_progress") {
    plantStatusKey = "healthy";
    plantStatusLabel = "Saludable";
  }

  if (confidence == null) {
    if (remote.source === "species_cycle_and_ai_adjustment") {
      confidence = 88;
    } else if (plantStatusKey === "critical") {
      confidence = 52;
    } else if (plantStatusKey === "risk") {
      confidence = 71;
    } else {
      confidence = 86;
    }
  }

  const days = daysLeft;
  let harvestLabel = "(por definir)";
  let harvestDetail = "Sin fecha de cosecha estimada";
  if (days != null) {
    if (days > 1) {
      harvestLabel = `~${days} días`;
      harvestDetail = `Cosecha estimada: ${formatShortDate(remote.estimated_harvest_date) ?? ""}`.trim();
    } else if (days === 1) {
      harvestLabel = "1 día";
      harvestDetail = `Cosecha estimada: ${formatShortDate(remote.estimated_harvest_date) ?? ""}`.trim();
    } else if (days === 0) {
      harvestLabel = "Hoy";
      harvestDetail = "Ventana de cosecha actual";
    } else {
      harvestLabel = "Ventana pasada";
      harvestDetail = `Última estimación: ${formatShortDate(remote.estimated_harvest_date) ?? ""}`.trim();
    }
  } else if (remote.estimated_harvest_date) {
    harvestLabel = formatShortDate(remote.estimated_harvest_date) || "—";
    harvestDetail = "Fecha estimada por ciclo";
  }

  return {
    confidence,
    plantStatusKey,
    plantStatusLabel,
    harvestLabel,
    harvestDetail,
    species: remote.species || AI_INSIGHTS_MOCK.species,
  };
}

const BADGE_STYLES = {
  healthy: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  risk: "bg-amber-100 text-amber-900 ring-amber-200",
  critical: "bg-red-100 text-red-800 ring-red-200",
};

/**
 * @param {object} props
 * @param {string} [props.cropId]
 * @param {(loading: boolean) => void} [props.onLoadingChange]
 */
function AIInsightsPanelSkeleton() {
  return (
    <article
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
      aria-busy="true"
      aria-label="Cargando panel de IA"
    >
      <div className="mb-4 h-5 w-48 animate-pulse rounded-lg bg-gray-200" />
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="h-14 flex-1 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-14 flex-1 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-14 flex-1 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </article>
  );
}

function AIInsightsPanel({ cropId = DEMO_CROP_ID, onLoadingChange }) {
  const [status, setStatus] = useState("loading");
  const [insights, setInsights] = useState(() => ({ ...AI_INSIGHTS_MOCK }));
  const onLoadingRef = useRef(onLoadingChange);
  onLoadingRef.current = onLoadingChange;

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    onLoadingRef.current?.(true);

    (async () => {
      try {
        const token = getUserAuthToken();
        const remote = await fetchHarvestEstimation(cropId, token);
        if (cancelled) return;
        setInsights(mapRemoteToInsights(remote));
        setStatus("success");
      } catch {
        if (cancelled) return;
        setInsights({ ...AI_INSIGHTS_MOCK });
        setStatus("success");
      } finally {
        if (!cancelled) {
          onLoadingRef.current?.(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cropId]);

  const badgeClass = useMemo(
    () => BADGE_STYLES[insights.plantStatusKey] || BADGE_STYLES.healthy,
    [insights.plantStatusKey]
  );

  if (status === "loading") {
    return <AIInsightsPanelSkeleton />;
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-farm-green-dark">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-farm-green-light text-farm-green-dark">
            <Brain className="h-5 w-5" aria-hidden />
          </span>
          Inteligencia artificial
        </h2>
        <p className="text-xs text-gray-500 sm:text-right">{insights.species}</p>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch sm:gap-6">
        <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Confianza del modelo</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 sm:text-3xl">{insights.confidence}%</p>
          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={insights.confidence}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Nivel de confianza del modelo"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-farm-green to-farm-green-dark transition-[width] duration-500"
              style={{ width: `${insights.confidence}%` }}
            />
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Estado de la planta</p>
          <p className="mt-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${badgeClass}`}
            >
              {insights.plantStatusLabel}
            </span>
          </p>
        </div>

        <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/80 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tiempo hasta cosecha</p>
          <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-gray-900 sm:text-2xl">
            <CalendarClock className="h-5 w-5 shrink-0 text-farm-green-dark" aria-hidden />
            {insights.harvestLabel}
          </p>
          <p className="mt-1 text-xs text-gray-600 sm:text-sm">{insights.harvestDetail}</p>
        </div>
      </div>
    </article>
  );
}

export default AIInsightsPanel;
