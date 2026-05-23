import { Cpu, Wifi, WifiOff, ListChecks, Gauge } from "lucide-react";

const FIVE_MIN_MS = 5 * 60 * 1000;

function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const elapsed = Date.now() - new Date(lastSeen).getTime();
  return elapsed < FIVE_MIN_MS;
}

const tipoStyling = {
  Nodo: { border: "border-cyan-400", badge: "bg-cyan-100 text-cyan-800 ring-cyan-300" },
  Gateway: { border: "border-violet-400", badge: "bg-violet-100 text-violet-800 ring-violet-300" },
};

export default function DeviceCard({ device, onClick }) {
  if (!device) return null;
  const { device_id, nombre, tipo, estado, sensores, actuadores, last_seen } = device;
  const online = isOnline(last_seen);
  const style = tipoStyling[tipo] ?? { border: "border-gray-300", badge: "bg-gray-100 text-gray-700 ring-gray-300" };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col rounded-2xl border-2 border-white/60 bg-white/80 p-5 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-farm-green-dark/10 text-farm-green-dark">
            <Cpu className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{nombre || device_id}</p>
            <p className="text-xs font-mono text-gray-400 truncate">{device_id}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
            online
              ? "bg-green-100 text-green-800 ring-green-300/60"
              : "bg-red-100 text-red-800 ring-red-300/60"
          }`}
        >
          {online ? <Wifi className="h-3 w-3" strokeWidth={2} /> : <WifiOff className="h-3 w-3" strokeWidth={2} />}
          {online ? "Online" : "Offline"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {tipo && <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${style.badge}`}>{tipo}</span>}
        {estado && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-300">
            <Gauge className="h-3 w-3" strokeWidth={2} />
            {estado}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {sensores?.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-3 w-3" strokeWidth={2} />
            {sensores.length} sensor{sensores.length !== 1 ? "es" : ""}
          </span>
        )}
        {actuadores?.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Gauge className="h-3 w-3" strokeWidth={2} />
            {actuadores.length} actuador{actuadores.length !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {last_seen && (
        <p className="mt-2 text-[10px] text-gray-400">
          Última vez: {new Date(last_seen).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
        </p>
      )}
    </button>
  );
}
