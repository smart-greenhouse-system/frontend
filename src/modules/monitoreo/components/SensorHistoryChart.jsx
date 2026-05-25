import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import { getSensorHistory } from "../../../lib/sensorApi";

const CHART_DEFS = {
  temperatura: { label: "Tendencia de Temperatura", unit: "°C", color: "#ef4444", step: 5 },
  humedad_suelo: { label: "Tendencia de Humedad del Suelo", unit: "%", color: "#06b6d4", step: 10 },
  humedad_relativa: { label: "Tendencia de Humedad Relativa", unit: "%", color: "#14b8a6", step: 10 },
  iluminacion: { label: "Tendencia de Iluminación", unit: "lux", color: "#f59e0b", step: 500 },
};

function niceDomain(values, step) {
  if (!values || values.length === 0) return [0, step || 10];
  const clean = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
  if (clean.length === 0) return [0, step || 10];
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const s = step || 10;
  if (Math.abs(max - min) < 0.001) {
    const pad = s;
    return [Math.max(0, min - pad), max + pad];
  }
  return [Math.floor(min / s) * s, Math.ceil(max / s) * s];
}

function formatTick(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const time = d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium" });
  const val = payload[0]?.value;
  return (
    <div className="rounded-lg border border-gray-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-gray-500">{time}</p>
      <p className="text-xs font-semibold" style={{ color: payload[0]?.color }}>
        {val} {unit}
      </p>
    </div>
  );
}

export default function SensorHistoryChart({ deviceId, sensorKeys }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await getSensorHistory(deviceId);
      if (!mountedRef.current) return;
      const sorted = [...rows].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      setHistory(sorted);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.message || "Error al cargar historial");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const flattenedHistory = useMemo(() => {
    return history.map((row) => {
      const flat = { ...row };
      if (row.sensores) {
        Object.entries(row.sensores).forEach(([k, v]) => {
          flat[`raw_${k}`] = v;
        });
      }
      return flat;
    });
  }, [history]);

  const availableCharts = useMemo(() => {
    if (!history.length || !sensorKeys?.length) return [];

    const result = [];

    sensorKeys.forEach((key) => {
      const def = CHART_DEFS[key];
      if (def) {
        const values = history.map((r) => r[key]).filter((v) => typeof v === "number" && !Number.isNaN(v));
        if (values.length >= 2) {
          result.push({ key, ...def });
        }
      } else {
        const values = history.map((r) => r.sensores?.[key]).filter((v) => v != null);
        if (values.length >= 2) {
          const [min, max] = niceDomain(values, 10);
          result.push({
            key: `raw_${key}`,
            label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            unit: "",
            color: "#9ca3af",
            domain: [min, max],
            step: 10,
          });
        }
      }
    });

    return result;
  }, [history, sensorKeys]);

  const domains = useMemo(() => {
    const result = {};
    availableCharts.forEach(({ key, step }) => {
      const dataKey = key.startsWith("raw_") ? key : key;
      const values = flattenedHistory.map((r) => r[dataKey]);
      result[key] = niceDomain(values, step);
    });
    return result;
  }, [availableCharts, flattenedHistory]);

  if (!deviceId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 py-16 text-center">
        <BarChart3 className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-medium text-gray-400">
          Selecciona un dispositivo para ver el historial
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white/80 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-farm-green" />
        <p className="mt-3 text-sm text-gray-500">Cargando historial…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/80 px-5 py-8 text-center">
        <p className="text-sm font-medium text-red-700">{error}</p>
        <button
          onClick={fetchHistory}
          className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60 py-16 text-center">
        <BarChart3 className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-gray-400">Sin datos de historial para este dispositivo</p>
      </div>
    );
  }

  if (!availableCharts.length) {
    return null;
  }

  const gridCols = availableCharts.length === 1
    ? "sm:grid-cols-1"
    : availableCharts.length === 2
      ? "sm:grid-cols-2"
      : availableCharts.length === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="space-y-5">
      <h3 className="text-base font-bold text-gray-800 sm:text-lg">
        Historial — <span className="font-mono text-farm-green-dark">{deviceId}</span>
      </h3>

      <div className={`grid grid-cols-1 gap-5 ${gridCols}`}>
        {availableCharts.map(({ key, label, unit, color }) => (
          <div key={key} className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">
              {label}
            </h4>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={flattenedHistory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={formatTick}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis
                    domain={domains[key]}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <Tooltip content={<ChartTooltip unit={unit} />} />
                  <Line
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 2, strokeWidth: 1.5 }}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
