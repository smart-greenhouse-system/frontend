import { useCallback, useEffect, useRef, useState } from "react";
import {
  Droplets,
  Fan,
  Lightbulb,
  Loader2,
  Power,
  PowerOff,
  AlertCircle,
} from "lucide-react";
import { getActuators, sendCommand } from "../../lib/actuatorApi";

const ACTUATOR_ICONS = {
  riego: Droplets,
  ventilacion: Fan,
  iluminacion: Lightbulb,
};

const DEFAULT_ICON = Lightbulb;

const Control = () => {
  const mountedRef = useRef(true);
  const [actuators, setActuators] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(null);
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getActuators();
        if (!cancelled && mountedRef.current) {
          setActuators(Array.isArray(data) ? data : []);
        }
      } catch {
        // Error silencioso en carga inicial
      } finally {
        if (!cancelled && mountedRef.current) {
          setInitialized(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ids = Object.keys(feedback);
    if (ids.length === 0) return;
    const timer = setTimeout(() => setFeedback({}), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleCommand = useCallback(async (actuator, turnOn) => {
    const loadKey = `${actuator.actuator_id}:${turnOn ? "on" : "off"}`;
    setLoading(loadKey);

    try {
      const result = await sendCommand({
        device_id: actuator.device_id,
        actuador: actuator.actuador,
        accion: turnOn ? "ON" : "OFF",
      });

      if (!mountedRef.current) return;

      if (result.executed) {
        setActuators((prev) =>
          prev.map((a) =>
            a.actuator_id === actuator.actuator_id
              ? { ...a, estado: turnOn ? "ON" : "OFF" }
              : a
          )
        );
        setFeedback({
          [actuator.actuator_id]: {
            type: "success",
            message:
              result.message ??
              `Actuador ${turnOn ? "encendido" : "apagado"} correctamente`,
          },
        });
      } else {
        setFeedback({
          [actuator.actuator_id]: {
            type: "error",
            message: result.message ?? "El comando no pudo ejecutarse",
          },
        });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setFeedback({
        [actuator.actuator_id]: {
          type: "error",
          message: err.message ?? "Error de conexión con el servidor",
        },
      });
    } finally {
      if (mountedRef.current) setLoading(null);
    }
  }, []);

  const isOn = (actuator) =>
    actuator.estado === "ON" || actuator.estado === "on" || actuator.estado === "1";

  const isEnabled = (actuator) =>
    actuator.enabled === true || actuator.enabled === "true";

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
            <span className="inline-flex shrink-0 items-center rounded-full bg-white/15 px-3 py-1.5 font-mono text-xs font-semibold tracking-wide text-farm-green-light ring-1 ring-white/25 backdrop-blur-sm">
              {actuators.length} actuador{actuators.length !== 1 ? "es" : ""}
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
                Cargando actuadores…
              </p>
            </div>
          ) : actuators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-10 w-10 text-gray-400" aria-hidden />
              <p className="mt-4 text-sm font-medium text-gray-600">
                No hay actuadores registrados en el sistema.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {actuators.map((actuator, index) => {
                const Icon = ACTUATOR_ICONS[actuator.actuador] ?? DEFAULT_ICON;
                const on = isOn(actuator);
                const enabled = isEnabled(actuator);
                const loadKey = `${actuator.actuator_id}:`;
                const loadingOn = loading === `${loadKey}on`;
                const loadingOff = loading === `${loadKey}off`;
                const fb = feedback[actuator.actuator_id];

                return (
                  <div key={actuator.actuator_id}>
                    {index > 0 ? (
                      <div
                        className="my-8 h-px w-full bg-gradient-to-r from-transparent via-farm-green/25 to-transparent"
                        role="separator"
                      />
                    ) : null}
                    <div
                      className={[
                        "flex min-h-[220px] flex-col rounded-2xl border bg-white p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_12px_32px_-10px_rgba(0,0,0,0.12)] transition-[box-shadow] duration-300 hover:shadow-[0_8px_12px_-2px_rgba(0,0,0,0.08),0_16px_40px_-12px_rgba(27,67,27,0.15)]",
                        enabled
                          ? "border-gray-200/90"
                          : "border-gray-200/50 opacity-60",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold uppercase tracking-wide text-farm-green-dark/75">
                            {actuator.nombre}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {actuator.actuador}
                            {actuator.device_id
                              ? ` · ${actuator.device_id}`
                              : ""}
                          </p>
                          <div
                            className={[
                              "mt-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md",
                              on
                                ? "bg-farm-green shadow-farm-green-dark/30 ring-2 ring-white/40"
                                : "bg-red-600 shadow-red-900/35 ring-2 ring-white/30",
                            ].join(" ")}
                            role="status"
                          >
                            <span
                              className={[
                                "h-2 w-2 shrink-0 rounded-full",
                                on ? "bg-farm-green-light" : "bg-red-200",
                              ].join(" ")}
                              aria-hidden
                            />
                            {on ? "Encendido" : "Apagado"}
                          </div>
                        </div>
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-farm-green-light/60 text-farm-green-dark shadow-sm ring-1 ring-farm-green/15"
                          aria-hidden
                        >
                          <Icon className="h-7 w-7" strokeWidth={1.75} />
                        </div>
                      </div>

                      {fb ? (
                        <p
                          className={[
                            "mt-4 rounded-lg border px-3 py-2 text-xs",
                            fb.type === "success"
                              ? "border-green-200 bg-green-50 text-green-800"
                              : "border-red-200 bg-red-50 text-red-800",
                          ].join(" ")}
                          role="alert"
                        >
                          {fb.message}
                        </p>
                      ) : (
                        <div className="mt-4 min-h-[2.5rem]" aria-hidden />
                      )}

                      <div className="mt-auto pt-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={loading !== null || on || !enabled}
                            onClick={() => handleCommand(actuator, true)}
                            aria-pressed={on}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-farm-green-dark px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-farm-green disabled:cursor-not-allowed disabled:opacity-50"
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
                            disabled={loading !== null || !on || !enabled}
                            onClick={() => handleCommand(actuator, false)}
                            aria-pressed={!on}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Control;
