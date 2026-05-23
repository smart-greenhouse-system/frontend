import { useCallback, useEffect, useState } from "react";
import { Play, Loader2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { getActuators } from "../../../lib/actuatorApi";
import { createPrediction } from "../../../lib/predictionApi";
import { getDevices } from "../../../lib/deviceApi";
import { getLatestReadings } from "../../../lib/sensorApi";

const EMPTY_FORM = {
  device_id: "",
  actuador_id: "",
  timeAction: "",
  procesado: false,
};

function extractDeviceIds(devices) {
  if (!Array.isArray(devices)) return [];
  return devices.map((d) => d.device_id).filter(Boolean);
}

function extractActuatorOptions(actuators) {
  if (!Array.isArray(actuators)) return [];
  return actuators.map((a) => ({
    id: a.actuator_id ?? a.id ?? "",
    label: a.nombre
      ? `${a.nombre} (${a.actuador ?? a.device_id ?? ""})`
      : a.actuador ?? a.actuator_id ?? a.id ?? "",
  })).filter((a) => a.id);
}

export default function RunAnalysisForm({ onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [devices, setDevices] = useState([]);
  const [actuators, setActuators] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState(null);

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [devicesRes, actuatorsRes, sensorsRes] = await Promise.allSettled([
        getDevices(),
        getActuators(),
        getLatestReadings(),
      ]);

      let ids = [];
      if (devicesRes.status === "fulfilled") {
        ids = extractDeviceIds(devicesRes.value);
      }
      if (ids.length === 0 && sensorsRes.status === "fulfilled") {
        ids = [...new Set(sensorsRes.value.map((r) => r.device_id).filter(Boolean))];
      }

      setDevices(ids);
      if (actuatorsRes.status === "fulfilled") {
        setActuators(extractActuatorOptions(actuatorsRes.value));
      }

      setForm((prev) => ({
        ...prev,
        device_id: prev.device_id || ids[0] || "",
      }));
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.device_id.trim()) {
      setFormError("Selecciona un dispositivo.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setResult(null);

    try {
      const response = await createPrediction({
        device_id: form.device_id.trim(),
        procesado: form.procesado,
        actuador_id: form.actuador_id.trim() || undefined,
        timeAction: form.timeAction.trim() || undefined,
      });
      setResult(response);
      onSuccess?.();
    } catch (err) {
      setFormError(err?.message ?? "No se pudo ejecutar el análisis.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="rounded-2xl border border-farm-green/25 bg-gradient-to-br from-farm-green-light/40 to-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-farm-green-dark sm:text-lg">
        Ejecutar nuevo análisis
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Envía una petición a POST /api/predictions para procesar la predicción con IA.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="device_id" className="mb-2 block text-sm font-medium text-gray-700">
            Dispositivo
          </label>
          <select
            id="device_id"
            name="device_id"
            value={form.device_id}
            onChange={handleChange}
            disabled={loadingOptions || submitting}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20 disabled:bg-gray-100"
          >
            <option value="">Selecciona dispositivo</option>
            {devices.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="actuador_id" className="mb-2 block text-sm font-medium text-gray-700">
            Actuador (opcional)
          </label>
          <select
            id="actuador_id"
            name="actuador_id"
            value={form.actuador_id}
            onChange={handleChange}
            disabled={loadingOptions || submitting}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-farm-green focus:ring-2 focus:ring-farm-green/20 disabled:bg-gray-100"
          >
            <option value="">Ninguno</option>
            {actuators.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          id="timeAction"
          name="timeAction"
          label="Duración de acción (opcional, segundos)"
          type="number"
          min="0"
          value={form.timeAction}
          onChange={handleChange}
          placeholder="Ej. 30"
          disabled={submitting}
        />

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white/80 px-4 py-3">
          <input
            type="checkbox"
            name="procesado"
            checked={form.procesado}
            onChange={handleChange}
            disabled={submitting}
            className="h-4 w-4 rounded border-gray-300 text-farm-green focus:ring-farm-green/30"
          />
          <span className="text-sm text-gray-700">
            Marcar como ya procesado (<code className="text-xs">procesado</code>)
          </span>
        </label>

        {formError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
        ) : null}

        {result ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">{result.message}</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>Procesado: {result.processed ? "Sí" : "No"}</li>
              <li>Modo automático: {result.automatic_mode ? "Activo" : "Inactivo"}</li>
              <li>Actuador ejecutado: {result.actuator_executed ? "Sí" : "No"}</li>
              {result.timeAction != null ? (
                <li>Duración: {result.timeAction}s</li>
              ) : null}
            </ul>
          </div>
        ) : null}

        <Button
          type="submit"
          className="inline-flex w-auto items-center justify-center gap-2 px-5 py-2.5"
          disabled={submitting || loadingOptions}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          {submitting ? "Procesando…" : "Ejecutar análisis IA"}
        </Button>
      </form>
    </article>
  );
}
