import { Brain, CalendarClock, Leaf } from "lucide-react";

const ESTADO_STYLES = {
  saludable: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  healthy: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  en_riesgo: "bg-amber-100 text-amber-900 ring-amber-200",
  riesgo: "bg-amber-100 text-amber-900 ring-amber-200",
  critico: "bg-red-100 text-red-800 ring-red-200",
  critical: "bg-red-100 text-red-800 ring-red-200",
};

function estadoBadgeClass(estado) {
  const key = (estado || "").toString().toLowerCase().replace(/\s+/g, "_");
  return ESTADO_STYLES[key] || "bg-gray-100 text-gray-800 ring-gray-200";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function PredictionInsightsPanel({ analysis, compact = false }) {
  if (!analysis) {
    return (
      <article className="rounded-2xl border border-dashed border-gray-200 bg-white/80 px-5 py-8 text-center text-sm text-gray-500">
        Sin análisis de imagen disponible.
      </article>
    );
  }

  const harvestLabel =
    analysis.tiempo_cosecha_dias != null
      ? analysis.tiempo_cosecha_dias === 0
        ? "Hoy"
        : analysis.tiempo_cosecha_dias === 1
          ? "1 día"
          : `~${analysis.tiempo_cosecha_dias} días`
      : "—";

  return (
    <article
      className={[
        "rounded-2xl border border-farm-green/20 bg-gradient-to-br from-white via-farm-green-light/30 to-white shadow-sm",
        compact ? "p-4" : "p-5 sm:p-6",
      ].join(" ")}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-farm-green text-white shadow-sm">
            <Brain className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-bold text-farm-green-dark sm:text-lg">
              Análisis de imagen (IA)
            </h2>
            <p className="text-xs text-gray-500">
              {analysis.cultivo || "Cultivo"} · {analysis.device_id || "—"}
            </p>
          </div>
        </div>
        {!analysis.success ? (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
            Análisis incompleto
          </span>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-gray-100 bg-white/90 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Confianza</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {analysis.confianza != null ? `${analysis.confianza}%` : "—"}
          </p>
          {analysis.confianza != null ? (
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={analysis.confianza}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-farm-green to-farm-green-dark"
                style={{ width: `${analysis.confianza}%` }}
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white/90 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Estado de la planta
          </p>
          <p className="mt-3 flex items-center gap-2">
            <Leaf className="h-5 w-5 text-farm-green-dark" aria-hidden />
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${estadoBadgeClass(analysis.estado_planta)}`}
            >
              {analysis.estado_planta || "Sin clasificar"}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white/90 p-3 sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Tiempo hasta cosecha
          </p>
          <p className="mt-1 flex items-center gap-2 text-xl font-bold text-gray-900">
            <CalendarClock className="h-5 w-5 text-farm-green-dark" aria-hidden />
            {harvestLabel}
          </p>
          <p className="mt-1 text-xs text-gray-500">{formatDate(analysis.created_at)}</p>
        </div>
      </div>
    </article>
  );
}
