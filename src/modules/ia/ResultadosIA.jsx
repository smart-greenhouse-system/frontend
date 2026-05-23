import { useCallback, useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import Button from "../../components/ui/Button";
import PredictionInsightsPanel from "./components/PredictionInsightsPanel";
import RunAnalysisForm from "./components/RunAnalysisForm";
import {
  getImageAnalysisHistory,
  getLatestImageAnalysis,
} from "../../lib/predictionApi";

function formatRowDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const ResultadosIA = () => {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [latestRes, historyRes] = await Promise.allSettled([
      getLatestImageAnalysis(),
      getImageAnalysisHistory(),
    ]);

    if (latestRes.status === "fulfilled") {
      setLatest(latestRes.value);
    } else {
      setLatest(null);
    }

    if (historyRes.status === "fulfilled") {
      const sorted = [...historyRes.value].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setHistory(sorted);
    } else {
      setHistory([]);
    }

    if (latestRes.status === "rejected" && historyRes.status === "rejected") {
      setError(
        latestRes.reason?.message ??
          historyRes.reason?.message ??
          "No se pudieron cargar los resultados de IA."
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Resultados de IA</h1>
          <p className="mt-1 text-sm text-gray-500">
            Análisis de imagen más reciente e historial (`GET /api/predictions/*`).
          </p>
        </div>
        <Button
          type="button"
          className="inline-flex w-auto items-center gap-2 px-4 py-2 text-sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <RunAnalysisForm onSuccess={loadData} />

      {loading && !latest ? (
        <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />
      ) : (
        <PredictionInsightsPanel analysis={latest} />
      )}

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <History className="h-5 w-5 text-farm-green-dark" />
          <h2 className="text-base font-semibold text-farm-green-dark">
            Historial de análisis
          </h2>
        </div>

        {loading && history.length === 0 ? (
          <div className="space-y-2 p-5">
            <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
          </div>
        ) : history.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            No hay análisis previos registrados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-farm-green-light/40 text-left text-xs uppercase tracking-wide text-farm-green-dark">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Cultivo</th>
                  <th className="px-5 py-3">Dispositivo</th>
                  <th className="px-5 py-3">Estado planta</th>
                  <th className="px-5 py-3">Confianza</th>
                  <th className="px-5 py-3">Cosecha (días)</th>
                  <th className="px-5 py-3">OK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((row) => (
                  <tr key={row.id ?? `${row.device_id}-${row.created_at}`} className="hover:bg-gray-50/80">
                    <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                      {formatRowDate(row.created_at)}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800">{row.cultivo || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs">{row.device_id || "—"}</td>
                    <td className="px-5 py-3 capitalize">{row.estado_planta || "—"}</td>
                    <td className="px-5 py-3 tabular-nums">
                      {row.confianza != null ? `${row.confianza}%` : "—"}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {row.tiempo_cosecha_dias ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          row.success
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800",
                        ].join(" ")}
                      >
                        {row.success ? "Sí" : "No"}
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

export default ResultadosIA;
