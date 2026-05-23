import { useEffect, useState, useRef, useCallback } from "react";
import { Brain, RefreshCw, Loader2, Sparkles, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { getLatestImageAnalysis, getImageAnalysisHistory, createPrediction } from "../../lib/predictionApi";
import { getDevices } from "../../lib/deviceApi";
import { getActuators } from "../../lib/actuatorApi";
import AnalysisCard from "./components/AnalysisCard";

const EMPTY_FORM = { device_id: "", actuador_id: "", timeAction: "" };

const PrediccionesIA = () => {
  const mountedRef = useRef(true);

  // --- data ---
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [loading, setLoading] = useState({ latest: true, history: true });

  // --- error ---
  const [error, setError] = useState(null);

  // --- form ---
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [latestData, historyData, devData, actData] = await Promise.all([
        getLatestImageAnalysis(),
        getImageAnalysisHistory(),
        getDevices(),
        getActuators(),
      ]);
      if (!mountedRef.current) return;
      setLatest(latestData ?? null);
      setHistory(Array.isArray(historyData) ? historyData : []);
      setDevices(Array.isArray(devData) ? devData : []);
      setActuators(Array.isArray(actData) ? actData : []);
      setError(null);
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.response?.data?.message || err.message || "Error al cargar datos de IA");
      }
    } finally {
      if (mountedRef.current) setLoading({ latest: false, history: false });
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── form helpers ──

  const filteredActuators = form.device_id
    ? actuators.filter((a) => a.device_id === form.device_id)
    : [];

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setFormError("");
    setResult(null);
    try {
      const res = await createPrediction({
        device_id: form.device_id,
        procesado: true,
        actuador_id: form.actuador_id,
        timeAction: form.timeAction,
      });
      if (mountedRef.current) {
        setResult(res);
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      if (mountedRef.current) {
        setFormError(err?.response?.data?.message || err.message || "Error al crear predicción");
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [form]);

  return (
    <div className="min-h-screen space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Predicciones IA</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Análisis de cultivos con inteligencia artificial
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading.latest || loading.history}
          className="inline-flex items-center gap-1.5 rounded-xl bg-farm-green-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-farm-green hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading.latest ? "animate-spin" : ""}`} strokeWidth={2} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
          <p className="font-semibold">Error al obtener datos</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}

      {/* ── ÚLTIMO ANÁLISIS ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-farm-green-dark" strokeWidth={2} />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Último Análisis</h2>
        </div>
        {loading.latest ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : latest ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnalysisCard analysis={latest} featured />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <Brain className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-medium text-gray-500">No hay análisis disponibles</p>
            <p className="text-xs text-gray-400 mt-1">Esperando datos del sistema de IA.</p>
          </div>
        )}
      </section>

      {/* ── HISTORIAL ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-farm-green-dark" strokeWidth={2} />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            Historial de Análisis
            {history.length > 0 && (
              <span className="ml-2 font-normal text-gray-400">({history.length})</span>
            )}
          </h2>
        </div>
        {loading.history ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <Brain className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-medium text-gray-500">Sin historial</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {history.map((item) => (
              <AnalysisCard key={item.id} analysis={item} />
            ))}
          </div>
        )}
      </section>

      {/* ── FORMULARIO DE PREDICCIÓN ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-4 w-4 text-farm-green-dark" strokeWidth={2} />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Nueva Predicción</h2>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Dispositivo</label>
              <select
                value={form.device_id}
                onChange={(e) => setForm({ device_id: e.target.value, actuador_id: "", timeAction: "" })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
              >
                <option value="">Seleccionar…</option>
                {devices.map((d) => (
                  <option key={d.device_id} value={d.device_id}>{d.nombre || d.device_id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Actuador</label>
              <select
                value={form.actuador_id}
                onChange={(e) => setForm((f) => ({ ...f, actuador_id: e.target.value }))}
                disabled={!form.device_id}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {form.device_id ? "Seleccionar actuador…" : "Primero elige un dispositivo"}
                </option>
                {filteredActuators.map((a) => (
                  <option key={a.actuator_id} value={a.actuator_id}>
                    {a.nombre || a.actuador} ({a.actuator_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Tiempo OFF automático <span className="text-gray-400 font-normal">(segundos)</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.timeAction}
                onChange={(e) => setForm((f) => ({ ...f, timeAction: e.target.value }))}
                placeholder="Ej: 3600"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
          )}

          {result && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />
                <p className="text-sm font-semibold text-green-800">Predicción creada</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-700 sm:grid-cols-4">
                {result.message && <p className="col-span-full mb-1">{result.message}</p>}
                <p>Procesado: <span className="font-semibold">{result.processed ? "Sí" : "No"}</span></p>
                <p>Modo automático: <span className="font-semibold">{result.automatic_mode ? "Activado" : "Desactivado"}</span></p>
                <p>Actuador ejecutado: <span className="font-semibold">{result.actuator_executed ? "Sí" : "No"}</span></p>
                <p>Time action: <span className="font-semibold">{result.timeAction ?? "—"}s</span></p>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={saving || !form.device_id || !form.actuador_id || !form.timeAction}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-farm-green-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-farm-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" strokeWidth={2} />
              )}
              {saving ? "Enviando…" : "Crear Predicción"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrediccionesIA;
