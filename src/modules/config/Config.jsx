import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save, Info, AlertTriangle } from "lucide-react";
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

  const validationErrors = useMemo(() => {
    if (!config) return {};
    const errs = {};
    if (!config.nombre_invernadero || !config.nombre_invernadero.trim()) {
      errs.nombre_invernadero = "El nombre del invernadero es obligatorio";
    }
    const freq = config.frecuencia_analisis_ia_min;
    if (freq == null || freq < 1 || !Number.isFinite(freq)) {
      errs.frecuencia_analisis_ia_min = "Debe ser un número mayor o igual a 1";
    }
    return errs;
  }, [config]);

  const isFormValid = Object.keys(validationErrors).length === 0;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!config || !isFormValid) return;
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
    [config, isFormValid]
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
                  className={`w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition focus:ring-2 ${
                    validationErrors.nombre_invernadero
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-farm-green focus:ring-farm-green/20"
                  }`}
                  placeholder="Ej. Invernadero Norte"
                />
                {validationErrors.nombre_invernadero && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.nombre_invernadero}</p>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <input
                    id="modo_automatico"
                    type="checkbox"
                    checked={config.modo_automatico === true}
                    onChange={(e) => handleChange("modo_automatico", e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-gray-300 text-farm-green focus:ring-farm-green"
                  />
                  <div className="flex-1 min-w-0">
                    <label htmlFor="modo_automatico" className="text-sm font-semibold text-gray-800">
                      Modo automático
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      El sistema controlará los actuadores según las lecturas de sensores y predicciones IA.
                    </p>
                    {config.modo_automatico === true && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-100/60 px-3 py-2 text-xs font-medium text-amber-800">
                        <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
                        El control manual desde la sección Control podría estar restringido mientras el modo automático esté activo.
                      </div>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    config.modo_automatico ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                  }`}>
                    {config.modo_automatico ? "Activado" : "Desactivado"}
                  </span>
                </div>
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
                  className={`w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition focus:ring-2 ${
                    validationErrors.frecuencia_analisis_ia_min
                      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-farm-green focus:ring-farm-green/20"
                  }`}
                  placeholder="Ej. 30"
                />
                {validationErrors.frecuencia_analisis_ia_min ? (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.frecuencia_analisis_ia_min}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Intervalo en minutos entre análisis automáticos con IA.
                  </p>
                )}
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

              <div className="flex items-center justify-between pt-2">
                {!isFormValid && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <Info className="h-3.5 w-3.5" strokeWidth={2} />
                    Corrige los errores antes de guardar
                  </p>
                )}
                <button
                  type="submit"
                  disabled={saving || !isFormValid}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg bg-farm-green-dark px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-farm-green disabled:cursor-not-allowed disabled:opacity-50"
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
