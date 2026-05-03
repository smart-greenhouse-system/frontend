import { useCallback, useEffect, useRef, useState } from "react";
import {
  Droplets,
  Fan,
  Lightbulb,
  Loader2,
  Power,
  PowerOff,
} from "lucide-react";

/**
 * Mock alineado con el API Contract (FRONTEND_MASTER_PLAN.md §4.B):
 * POST /api/actuators/control
 *
 * Body: { device_id, action, value }
 */
const DEVICE_ID = "esp32_1";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sustituir por fetch real a POST /api/actuators/control cuando el backend esté listo.
 */
async function postActuatorControlMock({ device_id, action, value }) {
  await delay(550 + Math.random() * 350);
  return {
    device_id,
    action,
    value,
    timestamp: new Date().toISOString(),
  };
}

const ACTUATORS = [
  {
    id: "riego",
    label: "Bomba de riego",
    subtitle: "Riego manual por duración",
    Icon: Droplets,
    actionOn: "activar_riego",
    actionOff: "desactivar_riego",
    needsDuration: true,
  },
  {
    id: "ventilador",
    label: "Ventilador",
    subtitle: "Circulación de aire",
    Icon: Fan,
    actionOn: "activar_ventilador",
    actionOff: "desactivar_ventilador",
    needsDuration: false,
  },
  {
    id: "iluminacion",
    label: "Iluminación",
    subtitle: "Luz complementaria",
    Icon: Lightbulb,
    actionOn: "activar_iluminacion",
    actionOff: "desactivar_iluminacion",
    needsDuration: false,
  },
];

const RIEGO_MIN_SEC = 5;
const RIEGO_MAX_SEC = 120;

function parseDurationSeconds(raw) {
  const n = Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(n) || n < RIEGO_MIN_SEC || n > RIEGO_MAX_SEC) {
    return null;
  }
  return n;
}

function formatLastCommandAgo(sentAtMs, nowMs) {
  const diffSec = Math.floor((nowMs - sentAtMs) / 1000);
  if (diffSec < 1) {
    return "hace unos instantes";
  }
  if (diffSec === 1) {
    return "hace 1 segundo";
  }
  if (diffSec < 60) {
    return `hace ${diffSec} segundos`;
  }
  const m = Math.floor(diffSec / 60);
  if (m === 1) {
    return "hace 1 minuto";
  }
  return `hace ${m} minutos`;
}

const Control = () => {
  const mountedRef = useRef(true);
  const [initialized, setInitialized] = useState(false);
  const [actuatorOn, setActuatorOn] = useState(() =>
    Object.fromEntries(ACTUATORS.map((a) => [a.id, false]))
  );
  const [riegoDurationSec, setRiegoDurationSec] = useState("30");
  const [loading, setLoading] = useState(null);
  const [errors, setErrors] = useState(() =>
    Object.fromEntries(ACTUATORS.map((a) => [a.id, null]))
  );
  const [lastCommandAt, setLastCommandAt] = useState(() =>
    Object.fromEntries(ACTUATORS.map((a) => [a.id, null]))
  );
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await delay(280);
      if (!cancelled && mountedRef.current) {
        setInitialized(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const sendControl = useCallback(
    async (actuatorId, turnOn) => {
      const def = ACTUATORS.find((a) => a.id === actuatorId);
      if (!def) {
        return;
      }

      if (def.needsDuration && turnOn) {
        const sec = parseDurationSeconds(riegoDurationSec);
        if (sec === null) {
          setErrors((e) => ({
            ...e,
            [actuatorId]: `Indica una duración entre ${RIEGO_MIN_SEC} y ${RIEGO_MAX_SEC} s.`,
          }));
          return;
        }
      }

      const action = turnOn ? def.actionOn : def.actionOff;
      let value = 0;
      if (turnOn) {
        if (def.needsDuration) {
          value = parseDurationSeconds(riegoDurationSec) ?? 0;
        } else {
          value = 1;
        }
      }

      const loadKey = `${actuatorId}:${turnOn ? "on" : "off"}`;
      setLoading(loadKey);
      setErrors((e) => ({ ...e, [actuatorId]: null }));

      try {
        await postActuatorControlMock({
          device_id: DEVICE_ID,
          action,
          value,
        });
        if (!mountedRef.current) {
          return;
        }
        setActuatorOn((prev) => ({ ...prev, [actuatorId]: turnOn }));
        setLastCommandAt((prev) => ({
          ...prev,
          [actuatorId]: Date.now(),
        }));
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo enviar el comando al actuador.";
        setErrors((e) => ({ ...e, [actuatorId]: message }));
      } finally {
        if (mountedRef.current) {
          setLoading(null);
        }
      }
    },
    [riegoDurationSec]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-gray-900/10 ring-1 ring-black/5">
        <div className="rounded-t-2xl bg-farm-green-dark px-8 py-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-semibold">Control de actuadores</h1>
              <p className="mt-1 text-sm text-farm-green-light/90">
                Controla manualmente los actuadores del invernadero.
              </p>
            </div>
            <span
              className="inline-flex shrink-0 items-center rounded-full bg-white/15 px-3 py-1.5 font-mono text-xs font-semibold tracking-wide text-farm-green-light ring-1 ring-white/25 backdrop-blur-sm"
              title="Dispositivo activo"
            >
              {DEVICE_ID}
            </span>
          </div>
        </div>

        <div className="space-y-8 px-8 py-10 sm:px-10">
          {!initialized ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="h-10 w-10 animate-spin rounded-full border-2 border-farm-green-light border-t-farm-green-dark"
                aria-hidden
              />
              <p className="mt-4 text-sm font-medium text-gray-600">
                Preparando panel de control…
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                {ACTUATORS.map(
                  (
                    {
                      id,
                      label,
                      subtitle,
                      Icon,
                      needsDuration,
                    },
                    index
                  ) => {
                    const isOn = actuatorOn[id];
                    const err = errors[id];
                    const loadingOn = loading === `${id}:on`;
                    const loadingOff = loading === `${id}:off`;

                    return (
                      <div key={id}>
                        {index > 0 ? (
                          <div
                            className="my-8 h-px w-full bg-gradient-to-r from-transparent via-farm-green/25 to-transparent"
                            role="separator"
                          />
                        ) : null}
                        <div
                          className="flex min-h-[240px] flex-col rounded-2xl border border-gray-200/90 bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_12px_32px_-10px_rgba(0,0,0,0.12)] transition-[box-shadow] duration-300 hover:shadow-[0_8px_12px_-2px_rgba(0,0,0,0.08),0_16px_40px_-12px_rgba(27,67,27,0.15)]"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold uppercase tracking-wide text-farm-green-dark/75">
                                {label}
                              </p>
                              <p className="mt-1 text-sm text-gray-600">
                                {subtitle}
                              </p>
                              <div
                                className={[
                                  "mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md",
                                  isOn
                                    ? "bg-farm-green shadow-farm-green-dark/30 ring-2 ring-white/40"
                                    : "bg-red-600 shadow-red-900/35 ring-2 ring-white/30",
                                ].join(" ")}
                                role="status"
                              >
                                <span
                                  className={[
                                    "h-2 w-2 shrink-0 rounded-full",
                                    isOn ? "bg-farm-green-light" : "bg-red-200",
                                  ].join(" ")}
                                  aria-hidden
                                />
                                {isOn ? "Encendido" : "Apagado"}
                              </div>
                            </div>
                            <div
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-farm-green-light/60 text-farm-green-dark shadow-sm ring-1 ring-farm-green/15"
                              aria-hidden
                            >
                              <Icon className="h-7 w-7" strokeWidth={1.75} />
                            </div>
                          </div>

                          {needsDuration ? (
                            <div className="mt-6 flex flex-wrap items-center gap-2">
                              <label
                                htmlFor={`riego-duration-${id}`}
                                className="shrink-0 text-xs font-medium text-gray-600"
                              >
                                Duración de riego (s)
                              </label>
                              <input
                                id={`riego-duration-${id}`}
                                type="number"
                                min={RIEGO_MIN_SEC}
                                max={RIEGO_MAX_SEC}
                                step={1}
                                inputMode="numeric"
                                value={riegoDurationSec}
                                onChange={(e) =>
                                  setRiegoDurationSec(e.target.value)
                                }
                                disabled={loading !== null}
                                className="w-[4.5rem] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-farm-green-dark outline-none transition [appearance:auto] focus:border-farm-green focus:ring-2 focus:ring-farm-green/20 disabled:opacity-60"
                              />
                            </div>
                          ) : null}

                          {err ? (
                            <p
                              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                              role="alert"
                            >
                              {err}
                            </p>
                          ) : (
                            <div className="mt-4 min-h-[2.5rem]" aria-hidden />
                          )}

                          <div className="mt-auto pt-6">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={loading !== null || isOn}
                                onClick={() => sendControl(id, true)}
                                aria-pressed={isOn}
                                className={[
                                  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition",
                                  "bg-farm-green-dark hover:bg-farm-green disabled:cursor-not-allowed disabled:opacity-50",
                                  isOn ? "ring-2 ring-farm-green ring-offset-2 ring-offset-white" : "",
                                ].join(" ")}
                              >
                                {loadingOn ? (
                                  <Loader2
                                    className="h-4 w-4 shrink-0 animate-spin"
                                    aria-hidden
                                  />
                                ) : (
                                  <Power
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={2}
                                    aria-hidden
                                  />
                                )}
                                Encender
                              </button>
                              <button
                                type="button"
                                disabled={loading !== null || !isOn}
                                onClick={() => sendControl(id, false)}
                                aria-pressed={!isOn}
                                className={[
                                  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition",
                                  "bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50",
                                  !isOn
                                    ? "ring-2 ring-gray-300 ring-offset-2 ring-offset-white"
                                    : "",
                                ].join(" ")}
                              >
                                {loadingOff ? (
                                  <Loader2
                                    className="h-4 w-4 shrink-0 animate-spin"
                                    aria-hidden
                                  />
                                ) : (
                                  <PowerOff
                                    className="h-4 w-4 shrink-0"
                                    strokeWidth={2}
                                    aria-hidden
                                  />
                                )}
                                Apagar
                              </button>
                            </div>
                            <p className="mt-3 text-xs text-gray-500">
                              {lastCommandAt[id] != null ? (
                                <>
                                  <span className="font-medium text-gray-600">
                                    Último comando enviado:
                                  </span>{" "}
                                  {formatLastCommandAgo(
                                    lastCommandAt[id],
                                    nowTick
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">
                                  Aún no se ha enviado un comando desde este
                                  panel.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 text-xs text-gray-500">
                <p>
                  <span className="font-medium text-farm-green-dark">
                    Dispositivo:
                  </span>{" "}
                  {DEVICE_ID}
                </p>
                <p className="mt-1 text-gray-500">
                  Los estados se actualizan tras confirmar el envío (mock). Sustituir
                  por respuesta real del backend cuando esté disponible.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Control;
