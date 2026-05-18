import { useEffect, useState } from "react";
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { getPredictions } from "../../lib/iaApi";
import Button from "./Button";

const PRIORITY_STYLES = {
  alta: "border-l-red-500 bg-red-50/90",
  high: "border-l-red-500 bg-red-50/90",
  critica: "border-l-red-600 bg-red-100/90",
  critical: "border-l-red-600 bg-red-100/90",
  media: "border-l-amber-500 bg-amber-50/90",
  medium: "border-l-amber-500 bg-amber-50/90",
  baja: "border-l-emerald-500 bg-emerald-50/80",
  low: "border-l-emerald-500 bg-emerald-50/80",
};

const PRIORITY_LABELS = {
  alta: "Prioridad alta",
  high: "Prioridad alta",
  critica: "Crítica",
  critical: "Crítica",
  media: "Prioridad media",
  medium: "Prioridad media",
  baja: "Prioridad baja",
  low: "Prioridad baja",
};

function priorityClass(prioridad) {
  const key = (prioridad || "media").toLowerCase();
  return PRIORITY_STYLES[key] || PRIORITY_STYLES.media;
}

function priorityLabel(prioridad) {
  const key = (prioridad || "media").toLowerCase();
  return PRIORITY_LABELS[key] || "Recomendación";
}

function PanelSkeleton({ compact }) {
  return (
    <section
      className={[
        "rounded-2xl border-2 border-dashed border-farm-green/25 bg-gradient-to-br from-farm-green-light/60 to-white p-4 shadow-sm",
        compact ? "" : "sm:p-6",
      ].join(" ")}
      aria-busy="true"
      aria-label="Cargando acciones recomendadas"
    >
      <div className="mb-4 h-6 w-56 animate-pulse rounded-lg bg-gray-200" />
      <div className="h-20 animate-pulse rounded-xl bg-gray-200" />
      <div className="mt-3 h-20 animate-pulse rounded-xl bg-gray-200" />
    </section>
  );
}

/**
 * Panel destacado con acciones recomendadas desde GET /api/predictions.
 *
 * @param {object} props
 * @param {boolean} [props.compact] — layout más compacto en páginas secundarias
 * @param {(loading: boolean) => void} [props.onLoadingChange]
 */
export default function RecommendedActionsPanel({ compact = false, onLoadingChange }) {
  const [status, setStatus] = useState("loading");
  const [acciones, setAcciones] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const loadPredictions = async () => {
    setStatus("loading");
    setErrorMessage("");
    onLoadingChange?.(true);
    try {
      const data = await getPredictions();
      setAcciones(data.acciones_recomendadas ?? []);
      setStatus("success");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "No se pudieron cargar las recomendaciones de la IA.";
      setErrorMessage(msg);
      setAcciones([]);
      setStatus("error");
    } finally {
      onLoadingChange?.(false);
    }
  };

  useEffect(() => {
    loadPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return <PanelSkeleton compact={compact} />;
  }

  return (
    <section
      className={[
        "relative overflow-hidden rounded-2xl border-2 border-farm-green/30 bg-gradient-to-br from-farm-green-light via-white to-amber-50/40 shadow-md ring-1 ring-farm-green/10",
        compact ? "p-4" : "p-4 sm:p-6",
      ].join(" ")}
      aria-labelledby="recommended-actions-heading"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-farm-green/5" />
      <div className="pointer-events-none absolute -bottom-6 left-1/3 h-24 w-24 rounded-full bg-amber-200/20" />

      <header className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-farm-green text-white shadow-sm">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2
              id="recommended-actions-heading"
              className="text-lg font-bold tracking-tight text-farm-green-dark sm:text-xl"
            >
              Acciones recomendadas
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">
              La IA analizó sensores e inventario. Esto es lo que conviene hacer ahora.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="relative flex w-auto shrink-0 items-center gap-2 self-start rounded-xl bg-white px-3 py-2 text-sm text-farm-green-dark shadow-sm ring-1 ring-farm-green/20 hover:bg-farm-green-light"
          onClick={loadPredictions}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Actualizar
        </Button>
      </header>

      {status === "error" ? (
        <div className="relative mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <ul className="relative mt-4 space-y-3">
        {acciones.length === 0 && status === "success" ? (
          <li className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/80 px-4 py-4 text-sm text-gray-600">
            <Lightbulb className="h-5 w-5 shrink-0 text-farm-green" aria-hidden />
            No hay acciones pendientes. El invernadero está dentro de los parámetros esperados.
          </li>
        ) : null}

        {acciones.map((action) => (
          <li
            key={action.id}
            className={[
              "rounded-xl border border-gray-200/80 border-l-4 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition hover:shadow-md",
              priorityClass(action.prioridad),
            ].join(" ")}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-farm-green-dark/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-farm-green-dark">
                {priorityLabel(action.prioridad)}
              </span>
              {action.tipo ? (
                <span className="text-xs text-gray-500">{action.tipo}</span>
              ) : null}
            </div>
            <p className="mt-2 font-semibold text-gray-900">{action.titulo}</p>
            {action.descripcion ? (
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{action.descripcion}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
