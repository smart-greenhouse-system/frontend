import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import { getSensorHistory } from "../../../lib/sensorApi";

const LINES = [
  { key: "temperatura",      color: "#ef4444", label: "Temp (°C)" },
  { key: "humedad_suelo",    color: "#06b6d4", label: "Hum. Suelo (%)" },
  { key: "humedad_relativa", color: "#14b8a6", label: "Hum. Relativa (%)" },
  { key: "iluminacion",      color: "#f59e0b", label: "Iluminación (lux)" },
];

function formatTick(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = new Date(label);
  const time = d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium" });

  return (
    <div className="rounded-lg border border-gray-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-medium text-gray-500">{time}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs" style={{ color: entry.color }}>
          <span className="font-semibold">{entry.name}:</span> {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function SensorHistoryChart({ deviceId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleLines, setVisibleLines] = useState(() =>
    Object.fromEntries(LINES.map((l) => [l.key, true]))
  );
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
      const data = await getSensorHistory(deviceId);
      if (!mountedRef.current) return;
      const rows = Array.isArray(data) ? data : data?.readings ?? data?.data ?? [];
      const sorted = [...rows].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      setHistory(sorted);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.response?.data?.message || err.message || "Error al cargar historial");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleLine = (key) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-gray-800 sm:text-lg">
          Historial — <span className="font-mono text-farm-green-dark">{deviceId}</span>
        </h3>
        {/* Toggle buttons */}
        <div className="flex flex-wrap gap-1.5">
          {LINES.map(({ key, color, label }) => (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                visibleLines[key]
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-400"
              }`}
              style={visibleLines[key] ? { backgroundColor: color } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTick}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {LINES.map(({ key, color, label }) =>
              visibleLines[key] ? (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
