import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity, Clock, Cpu, RefreshCw, Server, Wifi, WifiOff,
} from "lucide-react";
import { getLatestReadings } from "../../lib/sensorApi";
import SensorCard from "./components/SensorCard";
import SensorHistoryChart from "./components/SensorHistoryChart";

const SENSOR_KEYS = ["temperatura", "humedad_suelo", "humedad_relativa", "iluminacion"];
const AUTO_REFRESH_MS = 10_000; // 10 seconds

/* ─────────────────────────────────────────────────────────────
   MonitoreoIoT — Dashboard de sensores con auto-refresh
   ───────────────────────────────────────────────────────────── */

const MonitoreoIoT = () => {
  const mountedRef = useRef(true);

  // --- Leer deviceId desde URL (?deviceId=XXX) ---
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDeviceId = searchParams.get("deviceId") || null;

  // --- State: lecturas más recientes ---
  const [readings, setReadings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // --- State: historial por dispositivo ---
  const [selectedDeviceId, setSelectedDeviceId] = useState(urlDeviceId);

  // --- Cleanup ref ---
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // --- Fetch latest readings ---
  const fetchLatest = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await getLatestReadings();
      if (!mountedRef.current) return;

      // Normalize: API may return an array or a single object
      const normalized = Array.isArray(data) ? data : [data];
      setReadings(normalized);
      setLastUpdated(new Date());
      setError(null);

      // Auto-select first device if none selected
      if (!selectedDeviceId && normalized.length > 0) {
        const firstId = normalized[0].device_id;
        setSelectedDeviceId(firstId);
        setSearchParams({ deviceId: firstId }, { replace: true });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err?.response?.data?.message || err.message || "Error al cargar lecturas";
      if (!silent) {
        setError(msg);
        setReadings(null);
      }
      // On silent fail, keep old data visible
    } finally {
      if (!mountedRef.current) return;
      silent ? setRefreshing(false) : setLoading(false);
    }
  }, [selectedDeviceId]);

  // --- Auto-refresh con cleanup ---
  useEffect(() => {
    fetchLatest({ silent: false });

    const intervalId = setInterval(() => {
      fetchLatest({ silent: true });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [fetchLatest]);

  // --- Derived: current device data for cards ---
  const currentDevice = readings?.find((r) => r.device_id === selectedDeviceId) ?? readings?.[0];

  const formattedTimestamp = currentDevice?.timestamp
    ? new Date(currentDevice.timestamp).toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : null;

  const formattedLastUpdated = lastUpdated
    ? lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  // ── RENDER ──────────────────────────────────────────────

  return (
    <div className="min-h-screen space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">
            Monitoreo IoT
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Dashboard de sensores en tiempo real — auto-refresh cada {AUTO_REFRESH_MS / 1000}s
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh indicator */}
          {refreshing && (
            <span className="flex items-center gap-1.5 text-xs text-farm-green-dark">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-farm-green opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-farm-green-dark" />
              </span>
              Actualizando…
            </span>
          )}
          {formattedLastUpdated && (
            <span className="hidden items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200 sm:inline-flex">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
              {formattedLastUpdated}
            </span>
          )}
          <button
            onClick={() => fetchLatest({ silent: false })}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-farm-green-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-farm-green hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── ERROR STATE ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
          <p className="font-semibold">Error al obtener datos</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}

      {/* ── LOADING STATE ── */}
      {readings === null && loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-farm-green-light border-t-farm-green-dark" />
          <p className="mt-4 text-sm font-medium text-gray-500">Cargando lecturas del sensor…</p>
        </div>
      )}

      {/* ── DATA LOADED ── */}
      {readings && (
        <>
          {/* Device selector (if multiple) */}
          {readings.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {readings.map((r) => {
                const isActive = r.device_id === selectedDeviceId;
                return (
                  <button
                    key={r.device_id}
                    onClick={() => {
                      setSelectedDeviceId(r.device_id);
                      setSearchParams({ deviceId: r.device_id }, { replace: true });
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-farm-green-dark text-white shadow-md"
                        : "bg-white/80 text-gray-600 ring-1 ring-gray-200 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <Server className="h-4 w-4" strokeWidth={1.75} />
                    {r.device_id}
                    <span className={`h-2 w-2 rounded-full ${isActive ? "bg-green-400" : "bg-gray-300"}`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Node info bar */}
          {currentDevice && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-farm-green/15 bg-white/60 px-4 py-3 backdrop-blur-sm sm:px-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-farm-green-dark/10 text-farm-green-dark">
                <Cpu className="h-4.5 w-4.5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  Dispositivo: <span className="font-mono text-farm-green-dark">{currentDevice.device_id}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  sensores: {Object.keys(currentDevice.sensores ?? {}).length} &middot; última lectura: {formattedTimestamp ?? "—"}
                </p>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-300/60">
                  <Wifi className="h-3.5 w-3.5" strokeWidth={2} />
                  Online
                </span>
              </div>
            </div>
          )}

          {/* ── SENSOR CARDS GRID ── */}
          {currentDevice && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SENSOR_KEYS.map((key) => (
                <SensorCard key={key} sensorKey={key} value={currentDevice[key]} />
              ))}
            </div>
          )}

          {/* ── HISTORY CHART ── */}
          <SensorHistoryChart deviceId={selectedDeviceId} />
        </>
      )}
    </div>
  );
};

export default MonitoreoIoT;
