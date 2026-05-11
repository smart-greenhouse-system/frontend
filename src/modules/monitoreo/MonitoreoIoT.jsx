import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Clock,
  Cpu,
  Droplets,
  History,
  Server,
  Sun,
  Thermometer,
  Wifi,
  WifiOff,
  Wind,
} from "lucide-react";
import Button from "../../components/ui/Button";

/* ───────────────────────────────────────────
   Mock — alineado con API Contract §4.A
   GET /api/sensors/data
   ─────────────────────────────────────────── */

const NODE_INFO = {
  name: "Nodo Invernadero A",
  device_id: "esp32_1",
  online: true,
};

const MOCK_BASE = {
  device_id: "esp32_1",
  temperatura: 25.5,
  humedad_suelo: 60,
  humedad_relativa: 40,
  luz: 8200,
};

function buildMockPayload() {
  const jitter = (base, spread) =>
    Math.max(0, Math.round(base + (Math.random() * 2 - 1) * spread));

  return {
    device_id: MOCK_BASE.device_id,
    timestamp: new Date().toISOString(),
    temperatura: Number(
      (MOCK_BASE.temperatura + (Math.random() * 0.8 - 0.4)).toFixed(1)
    ),
    humedad_suelo: jitter(MOCK_BASE.humedad_suelo, 4),
    humedad_relativa: jitter(MOCK_BASE.humedad_relativa, 5),
    luz: jitter(MOCK_BASE.luz, 400),
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sustituir por fetch real a GET /api/sensors/data cuando el backend esté listo.
 */
async function fetchSensorReadingsMock() {
  await delay(650);
  return buildMockPayload();
}

function clampPercent(n) {
  return Math.min(100, Math.max(0, n));
}

/** Nivel visual 0–100 % según la métrica (temperatura y lux se escalan a rango operativo). */
function levelPercentForMetric(key, raw) {
  if (typeof raw !== "number" || Number.isNaN(raw)) {
    return 0;
  }
  switch (key) {
    case "temperatura":
      return clampPercent(((raw - 5) / 40) * 100);
    case "humedad_suelo":
    case "humedad_relativa":
      return clampPercent(raw);
    case "luz":
      return clampPercent((raw / 12000) * 100);
    default:
      return 0;
  }
}

const METRIC_CARDS = [
  {
    key: "temperatura",
    label: "Temperatura",
    unit: "°C",
    Icon: Thermometer,
    format: (v) => (typeof v === "number" ? v.toFixed(1) : "—"),
  },
  {
    key: "humedad_suelo",
    label: "Humedad del suelo",
    unit: "%",
    Icon: Droplets,
    format: (v) => (typeof v === "number" ? String(v) : "—"),
  },
  {
    key: "humedad_relativa",
    label: "Humedad relativa",
    unit: "%",
    Icon: Wind,
    format: (v) => (typeof v === "number" ? String(v) : "—"),
  },
  {
    key: "luz",
    label: "Luz",
    unit: "lux",
    Icon: Sun,
    format: (v) => (typeof v === "number" ? String(v) : "—"),
  },
];

/* ───────────────────────────────────────────
   Mock — 10 lecturas históricas
   ─────────────────────────────────────────── */

function generateMockHistory() {
  const now = Date.now();
  const rows = [];

  // Variaciones realistas centradas alrededor de los valores base
  const seeds = [
    { temp: 25.3, hs: 62, hr: 41, luz: 8350 },
    { temp: 25.8, hs: 59, hr: 39, luz: 7980 },
    { temp: 26.1, hs: 57, hr: 38, luz: 8510 },
    { temp: 25.6, hs: 61, hr: 42, luz: 8120 },
    { temp: 24.9, hs: 63, hr: 44, luz: 7650 },
    { temp: 25.2, hs: 60, hr: 40, luz: 8280 },
    { temp: 25.7, hs: 58, hr: 37, luz: 8740 },
    { temp: 26.0, hs: 56, hr: 36, luz: 8900 },
    { temp: 25.4, hs: 64, hr: 43, luz: 7800 },
    { temp: 25.0, hs: 61, hr: 41, luz: 8050 },
  ];

  for (let i = 0; i < 10; i++) {
    const ts = new Date(now - (i + 1) * 8 * 60 * 1000); // cada 8 min hacia atrás
    rows.push({
      id: i,
      timestamp: ts,
      temperatura: seeds[i].temp,
      humedad_suelo: seeds[i].hs,
      humedad_relativa: seeds[i].hr,
      luz: seeds[i].luz,
    });
  }

  return rows;
}

const MOCK_HISTORY = generateMockHistory();

/* ───────────────────────────────────────────
   Componente principal
   ─────────────────────────────────────────── */

const MonitoreoIoT = () => {
  const mountedRef = useRef(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshWarning, setRefreshWarning] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const payload = await fetchSensorReadingsMock();
      if (!mountedRef.current) {
        return;
      }
      setData(payload);
      setError(null);
      setRefreshWarning(null);
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar las lecturas.";
      if (silent) {
        setRefreshWarning(
          "No se pudieron actualizar las lecturas. Se muestran los últimos valores conocidos."
        );
      } else {
        setError(message);
        setData(null);
      }
    } finally {
      if (!mountedRef.current) {
        return;
      }
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load({ silent: false });
    const intervalId = setInterval(() => {
      load({ silent: true });
    }, 8000);
    return () => clearInterval(intervalId);
  }, [load]);

  const formattedTimestamp = data?.timestamp
    ? new Date(data.timestamp).toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "medium",
      })
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-3 py-6 sm:px-4 sm:py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="rounded-t-2xl bg-farm-green-dark px-4 py-5 text-white sm:px-8 sm:py-6">
          <h1 className="text-2xl font-semibold sm:text-3xl">Monitoreo IoT</h1>
          <p className="mt-1 text-xs text-farm-green-light/90 sm:text-sm">
            Lecturas ambientales según el contrato de sensores del plan maestro.
          </p>
        </div>

        <div className="space-y-6 px-4 py-8 sm:space-y-8 sm:px-10 sm:py-10">
          {error && (
            <div
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <p className="font-medium">Error al obtener datos</p>
              <p className="mt-1 text-red-700">{error}</p>
              <div className="mt-4 max-w-xs">
                <Button type="button" onClick={() => load({ silent: false })}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {refreshWarning && !error && (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="status"
            >
              {refreshWarning}
            </div>
          )}

          {data === null && loading && !error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
              <div
                className="h-10 w-10 animate-spin rounded-full border-2 border-farm-green-light border-t-farm-green-dark"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-gray-600">
                Cargando lecturas del sensor…
              </p>
            </div>
          ) : data ? (
            <>
              {refreshing ? (
                <div
                  className="flex items-center justify-end gap-2 text-xs text-gray-500"
                  role="status"
                  aria-live="polite"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-farm-green opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-farm-green-dark" />
                  </span>
                  <span className="font-medium text-gray-600">Actualizando…</span>
                </div>
              ) : null}

              {/* ── NODO HEADER ── */}
              <div className="rounded-xl border border-farm-green/20 bg-farm-green-light/50 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-farm-green-dark/10 text-farm-green-dark">
                    <Server className="h-5 w-5" strokeWidth={1.75} />
                  </div>

                  <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-farm-green-dark sm:text-xl">
                      {NODE_INFO.name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Cpu className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span className="font-mono">{NODE_INFO.device_id}</span>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {/* Badge Online / Offline */}
                    {NODE_INFO.online ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 ring-1 ring-green-300/60">
                        <Wifi className="h-3.5 w-3.5" strokeWidth={2} />
                        Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-300/60">
                        <WifiOff className="h-3.5 w-3.5" strokeWidth={2} />
                        Offline
                      </span>
                    )}

                    {/* Indicador de última lectura */}
                    {formattedTimestamp && (
                      <span className="hidden items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-farm-green/10 sm:inline-flex">
                        <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {formattedTimestamp}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timestamp mobile */}
                {formattedTimestamp && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 sm:hidden">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {formattedTimestamp}
                  </div>
                )}
              </div>

              {/* ── TARJETAS DE MÉTRICAS ── */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
                {METRIC_CARDS.map(({ key, label, unit, format, Icon }) => {
                  const raw = data[key];
                  const display = format(raw);
                  const levelPct = levelPercentForMetric(key, raw);
                  const hasNumeric = typeof raw === "number" && !Number.isNaN(raw);

                  return (
                    <div
                      key={key}
                      className="flex min-h-[180px] flex-col rounded-2xl border border-farm-green/15 bg-farm-green-light/80 p-5 shadow-sm transition-shadow hover:shadow-md sm:min-h-[200px] sm:p-8"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-farm-green-dark/75">
                            {label}
                          </p>
                          <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-farm-green-dark sm:text-4xl sm:tracking-tight lg:text-[2.5rem]">
                            {display}
                            <span className="ml-1.5 text-lg font-semibold text-farm-green-dark/80 sm:text-xl sm:text-2xl">
                              {unit}
                            </span>
                          </p>
                        </div>
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-farm-green-dark shadow-sm ring-1 ring-farm-green/10"
                          aria-hidden
                        >
                          <Icon className="h-7 w-7" strokeWidth={1.75} />
                        </div>
                      </div>

                      <div className="mt-auto pt-8">
                        <div className="mb-2 flex items-center justify-between gap-2 text-xs text-gray-600">
                          <span>Nivel</span>
                          <span className="font-semibold tabular-nums text-farm-green-dark">
                            {hasNumeric ? `${Math.round(levelPct)}%` : "—"}
                          </span>
                        </div>
                        <div
                          className="h-3 w-full overflow-hidden rounded-full bg-white/60 ring-1 ring-farm-green/10"
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={hasNumeric ? Math.round(levelPct) : 0}
                          aria-label={`Nivel de ${label}`}
                        >
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-farm-green to-farm-green-dark transition-[width] duration-500 ease-out"
                            style={{ width: hasNumeric ? `${levelPct}%` : "0%" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── TABLA DE HISTÓRICOS ── */}
              <div className="rounded-xl border border-farm-green/15 bg-farm-green-light/40">
                <div className="flex items-center gap-2.5 border-b border-farm-green/10 px-4 py-4 sm:px-6">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-farm-green-dark/10 text-farm-green-dark">
                    <History className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-bold text-farm-green-dark sm:text-lg">
                    Últimas 10 lecturas
                  </h3>
                  <span className="ml-auto hidden items-center gap-1 text-xs text-gray-500 sm:inline-flex">
                    <Activity className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Intervalo ~8 min
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-sm">
                    <thead>
                      <tr className="border-b border-farm-green/10 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark/70">
                        <th className="px-4 py-3 sm:px-6">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Fecha / hora
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right sm:px-6">
                          <span className="inline-flex items-center gap-1.5">
                            <Thermometer className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Temp (°C)
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right sm:px-6">
                          <span className="inline-flex items-center gap-1.5">
                            <Droplets className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Hum. Suelo (%)
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right sm:px-6">
                          <span className="inline-flex items-center gap-1.5">
                            <Wind className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Hum. Relativa (%)
                          </span>
                        </th>
                        <th className="px-4 py-3 text-right sm:px-6">
                          <span className="inline-flex items-center gap-1.5">
                            <Sun className="h-3.5 w-3.5" strokeWidth={1.75} />
                            Luz (lux)
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-farm-green/5">
                      {MOCK_HISTORY.map((row) => (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-farm-green-light/60"
                        >
                          <td className="whitespace-nowrap px-4 py-2.5 font-medium text-gray-700 sm:px-6">
                            {row.timestamp.toLocaleString("es-ES", {
                              dateStyle: "short",
                              timeStyle: "medium",
                            })}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-gray-700 sm:px-6">
                            {row.temperatura.toFixed(1)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-gray-700 sm:px-6">
                            {row.humedad_suelo}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-gray-700 sm:px-6">
                            {row.humedad_relativa}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-gray-700 sm:px-6">
                            {row.luz.toLocaleString("es-ES")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── FOOTER DE DISPOSITIVO ── */}
              <div className="border-t border-gray-100 pt-4 text-xs text-gray-500">
                <p>
                  <span className="font-medium text-farm-green-dark">
                    Dispositivo:
                  </span>{" "}
                  {data.device_id}
                </p>
                {formattedTimestamp && (
                  <p className="mt-1">
                    <span className="font-medium text-farm-green-dark">
                      Última lectura:
                    </span>{" "}
                    {formattedTimestamp}
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MonitoreoIoT;
