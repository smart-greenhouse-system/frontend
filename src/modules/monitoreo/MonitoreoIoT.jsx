import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Activity, Clock, Cpu, RefreshCw, Server, Wifi, WifiOff, Gauge,
} from "lucide-react";
import { getLatestReadings, getSensorHistory, KEY_ALIASES } from "../../lib/sensorApi";
import { getDevices } from "../../lib/deviceApi";
import { getActuators } from "../../lib/actuatorApi";
import SensorCard from "./components/SensorCard";
import SensorHistoryChart from "./components/SensorHistoryChart";

const AUTO_REFRESH_MS = 15_000;

/**
 * MonitoreoIoT — Persona B / Módulo 08 Sensores (FRONTEND_MASTER_PLAN.md)
 *
 * Flujo de datos (sin fetch directo):
 * 1. getLatestReadings() → objeto plano por dispositivo: { device_id, temperatura,
 *    humedad_relativa, humedad_suelo, iluminacion, timestamp }
 * 2. SensorHistoryChart usa getSensorHistory(deviceId) con el mismo formato por fila.
 */

const MonitoreoIoT = () => {
  const mountedRef = useRef(true);

  // --- URL ---
  const [searchParams, setSearchParams] = useSearchParams();
  const urlDeviceId = searchParams.get("deviceId") || null;

  // --- sensor readings ---
  const [readings, setReadings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // --- device catalog & actuators ---
  const [devices, setDevices] = useState([]);
  const [actuators, setActuators] = useState([]);

  // --- history data per device ---
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- selected device ---
  const [selectedDeviceId, setSelectedDeviceId] = useState(urlDeviceId);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── fetch auxiliary data (devices + actuators) once ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [devData, actData] = await Promise.all([getDevices(), getActuators()]);
        if (!cancelled && mountedRef.current) {
          setDevices(Array.isArray(devData) ? devData : []);
          setActuators(Array.isArray(actData) ? actData : []);
          console.log("🔍 [AUDIT] /api/devices raw:", devData);
          if (!urlDeviceId && Array.isArray(devData) && devData.length > 0) {
            const firstId = devData[0]?.device_id;
            if (firstId) {
              setSelectedDeviceId(firstId);
              setSearchParams({ deviceId: firstId }, { replace: true });
            }
          }
        }
      } catch { /* non-critical */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── fetch sensor readings ──
  const fetchLatest = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const normalized = await getLatestReadings();
      console.log("🔍 [AUDIT] /api/sensors/latest raw:", normalized);
      if (!mountedRef.current) return;

      setReadings(normalized);
      setLastUpdated(new Date());
      setError(null);

      if (!selectedDeviceId && normalized.length > 0) {
        const firstId = normalized[0].device_id;
        setSelectedDeviceId(firstId);
        setSearchParams({ deviceId: firstId }, { replace: true });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err?.message || "Error al cargar lecturas";
      if (!silent) {
        setError(msg);
        setReadings(null);
      }
    } finally {
      if (!mountedRef.current) return;
      silent ? setRefreshing(false) : setLoading(false);
    }
  }, [selectedDeviceId, setSearchParams]);

  // ── auto-refresh ──
  useEffect(() => {
    fetchLatest({ silent: false });
    const id = setInterval(() => fetchLatest({ silent: true }), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchLatest]);

  // ── fetch history when selected device changes ──
  useEffect(() => {
    if (!selectedDeviceId) return;
    let cancelled = false;
    setHistoryLoading(true);
    (async () => {
      try {
        const rows = await getSensorHistory(selectedDeviceId);
        console.log("🔍 [AUDIT] /api/sensors/history/", selectedDeviceId, "→", rows);
        if (!cancelled) {
          setHistoryData(rows ?? []);
          setHistoryLoading(false);
        }
      } catch (e) {
        console.warn("⚠️ [AUDIT] Error en history para", selectedDeviceId, e);
        if (!cancelled) {
          setHistoryData([]);
          setHistoryLoading(false);
        }
      }
    })();
    return () => { cancelled = true; setHistoryData([]); };
  }, [selectedDeviceId]);

  // ── derived ──
  const selectedDevice = useMemo(
    () => devices.find((d) => d.device_id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId]
  );

  const currentReading = useMemo(
    () => readings?.find((r) => r.device_id === selectedDeviceId) ?? null,
    [readings, selectedDeviceId]
  );

  const deviceActuators = useMemo(
    () => actuators.filter((a) => a.device_id === selectedDeviceId),
    [actuators, selectedDeviceId]
  );

  const online = selectedDevice?.estado === "ONLINE";

  const formattedTimestamp = currentReading?.timestamp
    ? new Date(currentReading.timestamp).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium" })
    : null;

  const formattedLastUpdated = lastUpdated
    ? lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  // ── dynamic sensor keys — desde currentReading o último historial ──
  const sensorKeys = useMemo(() => {
    const source = currentReading ?? (historyData.length > 0 ? historyData[historyData.length - 1] : null);
    const sensores = source?.sensores;
    if (!sensores || Object.keys(sensores).length === 0) return [];
    const reverseAlias = {};
    Object.entries(KEY_ALIASES).forEach(([norm, aliases]) => {
      aliases.forEach((a) => { reverseAlias[a] = norm; });
    });
    const keys = new Set();
    Object.entries(sensores).forEach(([rawKey, value]) => {
      if (typeof value !== "number" || Number.isNaN(value)) return;
      keys.add(reverseAlias[rawKey] || rawKey);
    });
    return Array.from(keys);
  }, [currentReading, historyData]);

  // ── valor a mostrar — currentReading, o último del historial ──
  const displayReading = useMemo(() => {
    if (currentReading) return currentReading;
    if (historyData.length > 0) return historyData[historyData.length - 1];
    return null;
  }, [currentReading, historyData]);

  // ── historial fusionado: historyData + currentReading si no está duplicado ──
  const mergedHistory = useMemo(() => {
    if (!currentReading) return historyData;
    const duplicate = historyData.some(
      (h) => h.id && currentReading.id && h.id === currentReading.id
    );
    if (duplicate) return historyData;
    return [...historyData, currentReading];
  }, [historyData, currentReading]);

  // ── handle device switch ──
  const handleDeviceSelect = (id) => {
    setSelectedDeviceId(id);
    setSearchParams({ deviceId: id }, { replace: true });
  };

  // ── render ──

  return (
    <div className="min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Monitoreo IoT</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Dashboard de sensores en tiempo real &middot; auto-refresh cada {AUTO_REFRESH_MS / 1000}s
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* NODE SELECTOR — pills with connection indicator */}
      {devices.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 min-w-max sm:flex-wrap">
            <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider text-gray-400 mr-1">
              Nodos
            </span>
            {devices.map((dev) => {
              const isActive = dev.device_id === selectedDeviceId;
              const isOnline = dev.estado === "ONLINE";
              return (
                <button
                  key={dev.device_id}
                  onClick={() => handleDeviceSelect(dev.device_id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-farm-green-dark text-white shadow-sm ring-1 ring-farm-green-dark/30"
                      : "bg-white/80 text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 hover:shadow-sm"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOnline ? "bg-green-500" : "bg-red-400"
                    } ${isActive ? "ring-1 ring-white/40" : ""}`}
                  />
                  {dev.nombre || dev.device_id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
          <p className="font-semibold">Error al obtener datos</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}

      {/* LOADING */}
      {readings === null && loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-farm-green-light border-t-farm-green-dark" />
          <p className="mt-4 text-sm font-medium text-gray-500">Cargando lecturas del sensor…</p>
        </div>
      )}

      {/* NO READINGS — empty state */}
      {readings !== null && readings.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <Server className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">No hay lecturas de sensores disponibles</p>
          <p className="text-xs text-gray-400 mt-1">Los datos aparecen automáticamente cuando los dispositivos envían información vía MQTT.</p>
        </div>
      )}

      {/* DATA */}
      {readings && readings.length > 0 && (
        <>
          {/* NODE INFO BAR — real data from /api/devices */}
          {selectedDevice && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-farm-green/15 bg-white/60 px-4 py-3 backdrop-blur-sm sm:px-6">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-farm-green-dark/10 text-farm-green-dark">
                <Cpu className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-800">
                  {selectedDevice.nombre || selectedDevice.device_id}
                  <span className="ml-2 font-mono text-[11px] font-normal text-gray-400">{selectedDevice.device_id}</span>
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                  {selectedDevice.tipo && <span>{selectedDevice.tipo}</span>}
                  {selectedDevice.estado && <span>estado: {selectedDevice.estado}</span>}
                  {displayReading && (
                    <span>sensores: {Object.keys(displayReading.sensores ?? {}).length}</span>
                  )}
                  <span>actuadores: {deviceActuators.length}</span>
                  {formattedTimestamp && <span>última lectura: {formattedTimestamp}</span>}
                </div>
              </div>
              <div className="shrink-0">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  online
                    ? "bg-green-100 text-green-800 ring-green-300/60"
                    : "bg-red-100 text-red-800 ring-red-300/60"
                }`}>
                  {online ? <Wifi className="h-3.5 w-3.5" strokeWidth={2} /> : <WifiOff className="h-3.5 w-3.5" strokeWidth={2} />}
                  {online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          )}

          {/* NO DEVICE SELECTED YET */}
          {!selectedDeviceId && readings.length > 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <Cpu className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-500">Selecciona un dispositivo para ver sus sensores</p>
            </div>
          )}

          {/* SENSOR CARDS */}
          {selectedDeviceId && displayReading && sensorKeys.length > 0 && (
            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2${
              sensorKeys.length <= 2 ? "" : sensorKeys.length === 3 ? " lg:grid-cols-3" : " lg:grid-cols-4"
            }`}>
              {sensorKeys.map((key) => (
                <SensorCard
                  key={key}
                  sensorKey={key}
                  value={displayReading[key] ?? displayReading.sensores?.[key]}
                />
              ))}
            </div>
          )}

          {/* NO READINGS FOR THIS DEVICE */}
          {selectedDeviceId && !displayReading && readings.length > 0 && !historyLoading && historyData.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <Activity className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-500">
                {selectedDevice?.nombre || selectedDeviceId} no tiene lecturas de sensores todavía
              </p>
              <p className="text-xs text-gray-400 mt-1">Esperando datos del dispositivo vía MQTT.</p>
            </div>
          )}

          {/* CROSS-REFERENCED ACTUATORS */}
          {selectedDeviceId && deviceActuators.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="h-4 w-4 text-farm-green-dark" strokeWidth={2} />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Actuadores asociados ({deviceActuators.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {deviceActuators.map((act) => {
                  const on = act.estado === "ON" || act.estado === "on" || act.estado === "1";
                  const enabled = act.enabled === true || act.enabled === "true";
                  return (
                    <div
                      key={act.actuator_id}
                      className={`flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm ${
                        enabled ? "border-gray-200" : "border-gray-200/50 opacity-60"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-farm-green-dark/10 text-farm-green-dark">
                        <Gauge className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate">{act.nombre || act.actuador}</p>
                        <p className="text-[11px] text-gray-400 font-mono truncate">{act.actuador} &middot; {act.actuator_id}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        on ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-green-500" : "bg-gray-400"}`} />
                        {on ? "ON" : "OFF"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* HISTORY CHART */}
          {selectedDeviceId && sensorKeys.length > 0 && (
            <SensorHistoryChart deviceId={selectedDeviceId} sensorKeys={sensorKeys} historyData={mergedHistory} />
          )}
        </>
      )}
    </div>
  );
};

export default MonitoreoIoT;
