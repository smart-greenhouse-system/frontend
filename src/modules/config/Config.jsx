import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { getConfig, updateConfig } from "../../lib/configApi";

const Config = () => {
  const mountedRef = useRef(true);
  const [config, setConfig] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getConfig();
        if (!cancelled && mountedRef.current) {
          setConfig(data);
        }
      } catch {
        // silencioso
      } finally {
        if (!cancelled && mountedRef.current) {
          setInitialized(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleChange = useCallback((field, value) => {
    setConfig((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!config) return;
      setSaving(true);
      try {
        const updated = await updateConfig(config);
        if (!mountedRef.current) return;
        setConfig(updated);
        setFeedback({ type: "success", message: "Configuración guardada correctamente" });
      } catch (err) {
        if (!mountedRef.current) return;
        setFeedback({
          type: "error",
          message: err.message ?? "Error al guardar la configuración",
        });
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [config]
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-gray-900/10 ring-1 ring-black/5">
        <div className="bg-farm-green-dark px-8 py-6 text-white">
          <h1 className="text-3xl font-semibold">Configuración del invernadero</h1>
          <p className="mt-1 text-sm text-farm-green-light/90">
            Parámetros generales del sistema SmartGreenHouse.
          </p>
        </div>

        <div className="px-8 py-10 sm:px-10">
          {!initialized ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="h-10 w-10 animate-spin rounded-full border-2 border-farm-green-light border-t-farm-green-dark"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-gray-600">
                Cargando configuración…
              </p>
            </div>
          ) : !config ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-10 w-10 text-gray-400" aria-hidden />
              <p className="mt-4 text-sm font-medium text-gray-600">
                No se pudo cargar la configuración del invernadero.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="nombre_invernadero"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Nombre del invernadero
                </label>
                <input
                  id="nombre_invernadero"
                  type="text"
                  value={config.nombre_invernadero ?? ""}
                  onChange={(e) => handleChange("nombre_invernadero", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20"
                  placeholder="Ej. Invernadero Norte"
                />
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  id="modo_automatico"
                  type="checkbox"
                  checked={config.modo_automatico === true}
                  onChange={(e) => handleChange("modo_automatico", e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-farm-green focus:ring-farm-green"
                />
                <label htmlFor="modo_automatico" className="text-sm font-medium text-gray-700">
                  Modo automático
                </label>
                <span className="ml-auto text-xs text-gray-500">
                  {config.modo_automatico ? "Activado" : "Desactivado"}
                </span>
              </div>

              <div>
                <label
                  htmlFor="frecuencia_analisis_ia_min"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Frecuencia de análisis IA (minutos)
                </label>
                <input
                  id="frecuencia_analisis_ia_min"
                  type="number"
                  min="1"
                  step="1"
                  value={config.frecuencia_analisis_ia_min ?? ""}
                  onChange={(e) =>
                    handleChange("frecuencia_analisis_ia_min", Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20"
                  placeholder="Ej. 30"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Intervalo en minutos entre análisis automáticos con IA.
                </p>
              </div>

              {feedback ? (
                <div
                  className={[
                    "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
                    feedback.type === "success"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800",
                  ].join(" ")}
                  role="alert"
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {feedback.message}
                </div>
              ) : null}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-farm-green-dark px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-farm-green disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="h-4 w-4" aria-hidden />
                  )}
                  {saving ? "Guardando…" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Config;
