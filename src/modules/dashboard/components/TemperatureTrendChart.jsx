import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChart as LineChartIcon, Loader2 } from "lucide-react";
import { getSensorHistory } from "../../../lib/sensorApi";

const WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_Y_MIN = 22;
const DEFAULT_Y_MAX = 25;

function formatTick(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function filterLast15Minutes(rows) {
  const cutoff = Date.now() - WINDOW_MS;
  return rows
    .filter((row) => {
      if (!row.timestamp || typeof row.temperatura !== "number") return false;
      return new Date(row.timestamp).getTime() >= cutoff;
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((row) => ({
      timestamp: row.timestamp,
      temperatura: row.temperatura,
    }));
}

function computeYDomain(points) {
  if (!points.length) return [DEFAULT_Y_MIN, DEFAULT_Y_MAX];
  const values = points.map((p) => p.temperatura);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const min = Math.min(DEFAULT_Y_MIN, Math.floor(dataMin * 10) / 10 - 0.5);
  const max = Math.max(DEFAULT_Y_MAX, Math.ceil(dataMax * 10) / 10 + 0.5);
  return [min, max];
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const time = new Date(label).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "medium",
  });
  const value = payload[0]?.value;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-gray-500">{time}</p>
      <p className="text-sm font-semibold text-orange-600">
        {typeof value === "number" ? `${value.toFixed(1)} °C` : "—"}
      </p>
    </div>
  );
}

/**
 * Gráfica compacta de temperatura — últimos 15 min (RF-30).
 * @param {string | null} deviceId
 * @param {number} [refreshToken] — incrementar para recargar con el dashboard
 */
export default function TemperatureTrendChart({ deviceId, refreshToken = 0 }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadHistory = useCallback(async () => {
    if (!deviceId) {
      setPoints([]);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const history = await getSensorHistory(deviceId);
      if (!mountedRef.current) return;
      setPoints(filterLast15Minutes(history));
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.message ?? "No se pudo cargar el historial.");
      setPoints([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshToken]);

  const yDomain = useMemo(() => computeYDomain(points), [points]);

  if (!deviceId) {
    return (
      <article className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-10 text-center shadow-sm">
        <LineChartIcon className="mx-auto h-8 w-8 text-gray-300" strokeWidth={1.5} />
        <p className="mt-2 text-sm text-gray-500">
          Sin dispositivo sensor para mostrar la tendencia.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-farm-green-dark">
            Temperatura — últimos 15 min
          </h2>
          <p className="text-xs text-gray-500">
            Dispositivo <span className="font-mono text-farm-green-dark">{deviceId}</span>
            {" · "}
            Escala operativa {DEFAULT_Y_MIN}–{DEFAULT_Y_MAX} °C
          </p>
        </div>
        {!loading && points.length > 0 ? (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200">
            {points.length} lectura{points.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="flex h-52 items-center justify-center sm:h-56">
          <Loader2 className="h-8 w-8 animate-spin text-farm-green" aria-hidden />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : points.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 text-center sm:h-56">
          <p className="text-sm font-medium text-gray-600">
            Sin lecturas de temperatura en los últimos 15 minutos.
          </p>
          <p className="mt-1 text-xs text-gray-400">
            El historial se obtiene de GET /api/sensors/history/{deviceId}
          </p>
        </div>
      ) : (
        <div className="h-52 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTick}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={{ stroke: "#e5e7eb" }}
                minTickGap={28}
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickFormatter={(v) => `${v}°`}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="temperatura"
                name="Temperatura"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
