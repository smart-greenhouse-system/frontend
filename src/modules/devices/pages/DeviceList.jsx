import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Server, Clock, Search } from "lucide-react";
import { getDevices } from "../../../lib/deviceApi";
import DeviceCard from "../components/DeviceCard";

const DeviceList = () => {
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDevices();
      if (mountedRef.current) {
        setDevices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err?.response?.data?.message || err.message || "Error al cargar dispositivos");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const filtered = devices.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.device_id && d.device_id.toLowerCase().includes(q)) ||
      (d.nombre && d.nombre.toLowerCase().includes(q)) ||
      (d.tipo && d.tipo.toLowerCase().includes(q))
    );
  });

  const handleDeviceClick = (deviceId) => {
    navigate(`/monitoreo?deviceId=${encodeURIComponent(deviceId)}`);
  };

  const onlineCount = devices.filter((d) => {
    if (!d.last_seen) return false;
    return Date.now() - new Date(d.last_seen).getTime() < 5 * 60 * 1000;
  }).length;

  return (
    <div className="min-h-screen space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Dispositivos</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {devices.length} dispositivo{devices.length !== 1 ? "s" : ""} registrado{devices.length !== 1 ? "s" : ""}
            {onlineCount > 0 && (
              <span className="ml-1.5 text-green-600">
                &middot; {onlineCount} online
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar dispositivo…"
              className="w-48 rounded-xl border border-gray-200 bg-white/80 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 ring-1 ring-transparent transition focus:border-farm-green-dark focus:outline-none focus:ring-farm-green-dark/20"
            />
          </div>
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-farm-green-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-farm-green hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={2} />
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
          <p className="font-semibold">Error al obtener datos</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      )}

      {loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-farm-green-light border-t-farm-green-dark" />
          <p className="mt-4 text-sm font-medium text-gray-500">Cargando dispositivos…</p>
        </div>
      )}

      {!loading && !error && devices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Server className="mb-3 h-12 w-12 text-gray-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">No hay dispositivos registrados</p>
          <p className="text-xs text-gray-400 mt-1">Los dispositivos aparecen automáticamente cuando envían datos vía MQTT.</p>
        </div>
      )}

      {!loading && !error && devices.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-gray-500">Sin resultados para &quot;{search}&quot;</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((device) => (
            <DeviceCard
              key={device.device_id}
              device={device}
              onClick={() => handleDeviceClick(device.device_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceList;
