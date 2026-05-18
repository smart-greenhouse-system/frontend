import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RefreshCcw, Settings2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { getUserAuthToken } from "../../../lib/alertsApi";
import { fetchGreenhouseConfig, patchGreenhouseConfig } from "../../../lib/greenhouseConfigApi";

const DEFAULT_FORM = {
  automatic_mode: false,
  inactivity_threshold_minutes: "10",
  manual_override_duration_minutes: "10",
  report_timezone: "UTC",
};

function normalizeConfig(raw) {
  return {
    automatic_mode: Boolean(raw?.automatic_mode),
    inactivity_threshold_minutes: String(raw?.inactivity_threshold_minutes ?? 10),
    manual_override_duration_minutes: String(raw?.manual_override_duration_minutes ?? 10),
    report_timezone: String(raw?.report_timezone ?? "UTC"),
    updated_at: raw?.updated_at ?? "",
  };
}

function formatDateTime(iso) {
  if (!iso) return "Sin sincronizar";

  try {
    return new Date(iso).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function isValidTimeZone(timezone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

const GreenhouseConfigPage = () => {
  const mountedRef = useRef(true);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [snapshot, setSnapshot] = useState(DEFAULT_FORM);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadConfig = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = getUserAuthToken();
      const data = await fetchGreenhouseConfig(token);

      if (!mountedRef.current) {
        return;
      }

      const normalized = normalizeConfig(data);
      setForm(normalized);
      setSnapshot(normalized);
      setUpdatedAt(normalized.updated_at);
      setFieldErrors({});
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(err instanceof Error ? err.message : "No se pudo cargar la configuración general.");
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
    void loadConfig();
  }, [loadConfig]);

  const hasChanges = useMemo(() => {
    return (
      form.automatic_mode !== snapshot.automatic_mode ||
      form.inactivity_threshold_minutes !== snapshot.inactivity_threshold_minutes ||
      form.manual_override_duration_minutes !== snapshot.manual_override_duration_minutes ||
      form.report_timezone !== snapshot.report_timezone
    );
  }, [form, snapshot]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Modo automático",
        value: form.automatic_mode ? "Activado" : "Desactivado",
        tone: form.automatic_mode ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950",
      },
      {
        label: "Inactividad",
        value: `${form.inactivity_threshold_minutes} min`,
        tone: "bg-white text-gray-900",
      },
      {
        label: "Override manual",
        value: `${form.manual_override_duration_minutes} min`,
        tone: "bg-white text-gray-900",
      },
      {
        label: "Zona horaria",
        value: form.report_timezone,
        tone: "bg-white text-gray-900",
      },
    ],
    [form]
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    setMessage("");
  };

  const validateForm = () => {
    const nextErrors = {};
    const inactivity = Number(form.inactivity_threshold_minutes);
    const override = Number(form.manual_override_duration_minutes);
    const timezone = form.report_timezone.trim();

    if (!Number.isInteger(inactivity) || inactivity < 1) {
      nextErrors.inactivity_threshold_minutes = "Debe ser un número entero mayor que cero.";
    }

    if (!Number.isInteger(override) || override < 1) {
      nextErrors.manual_override_duration_minutes = "Debe ser un número entero mayor que cero.";
    }

    if (!timezone) {
      nextErrors.report_timezone = "La zona horaria es obligatoria.";
    } else if (!isValidTimeZone(timezone)) {
      nextErrors.report_timezone = "La zona horaria no es válida.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = getUserAuthToken();
      const data = await patchGreenhouseConfig(
        {
          automatic_mode: form.automatic_mode,
          inactivity_threshold_minutes: Number(form.inactivity_threshold_minutes),
          manual_override_duration_minutes: Number(form.manual_override_duration_minutes),
          report_timezone: form.report_timezone.trim(),
        },
        token
      );

      if (!mountedRef.current) {
        return;
      }

      const normalized = normalizeConfig(data);
      setForm(normalized);
      setSnapshot(normalized);
      setUpdatedAt(normalized.updated_at);
      setMessage("Configuración general guardada correctamente.");
      setFieldErrors({});
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }

      setError(err instanceof Error ? err.message : "No se pudo guardar la configuración general.");
    } finally {
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-3xl border border-farm-green/10 bg-white shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-farm-green-dark" aria-hidden />
          <p className="mt-4 text-sm font-medium text-gray-600">Cargando configuración general…</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-farm-green-light/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-farm-green-dark">
            <Settings2 className="h-4 w-4" />
            Configuración general
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-farm-green-dark">Centro de control del invernadero</h1>
          <p className="mt-2 text-sm text-gray-600">
            Ajusta el modo automático, los umbrales globales de operación y la zona horaria usada en reportes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => void loadConfig(true)}
            disabled={refreshing || saving}
            className="flex w-auto items-center gap-2 rounded-xl px-5 py-2.5"
          >
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {refreshing ? "Recargando…" : "Recargar"}
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <p className="font-semibold">No se pudo cargar la configuración</p>
          <p className="mt-1 text-red-700">{error}</p>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className={["mt-3 rounded-xl px-4 py-3 text-lg font-semibold", card.tone].join(" ")}>
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-farm-green-dark">Editar parámetros globales</h2>
              <p className="mt-1 text-sm text-gray-600">
                Los cambios afectan a todo el invernadero y se guardan de forma inmediata.
              </p>
            </div>
            <span className="text-xs font-medium text-gray-500">
              {updatedAt ? `Actualizado ${formatDateTime(updatedAt)}` : "Sin sincronizar"}
            </span>
          </div>

          <div className="mt-6 space-y-5">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-farm-green-light/30 px-4 py-4 shadow-sm transition hover:border-farm-green/30">
              <input
                type="checkbox"
                checked={form.automatic_mode}
                onChange={(event) => handleChange("automatic_mode", event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-farm-green-dark focus:ring-farm-green"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">Modo automático</p>
                <p className="mt-1 text-sm text-gray-600">
                  Permite que el sistema opere con reglas y umbrales activos.
                </p>
              </div>
            </label>

            <Input
              id="inactivity_threshold_minutes"
              name="inactivity_threshold_minutes"
              label="Umbral de inactividad (minutos)"
              type="number"
              min="1"
              step="1"
              value={form.inactivity_threshold_minutes}
              onChange={(event) => handleChange("inactivity_threshold_minutes", event.target.value)}
              error={fieldErrors.inactivity_threshold_minutes}
            />

            <Input
              id="manual_override_duration_minutes"
              name="manual_override_duration_minutes"
              label="Duración del override manual (minutos)"
              type="number"
              min="1"
              step="1"
              value={form.manual_override_duration_minutes}
              onChange={(event) => handleChange("manual_override_duration_minutes", event.target.value)}
              error={fieldErrors.manual_override_duration_minutes}
            />

            <Input
              id="report_timezone"
              name="report_timezone"
              label="Zona horaria de reportes"
              value={form.report_timezone}
              onChange={(event) => handleChange("report_timezone", event.target.value)}
              placeholder="UTC o America/Bogota"
              error={fieldErrors.report_timezone}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || loading || !hasChanges}
                className="flex w-auto items-center gap-2 rounded-xl px-5 py-2.5"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Guardando…" : "Guardar cambios"}
              </Button>

              <button
                type="button"
                onClick={() => setForm(snapshot)}
                disabled={!hasChanges || saving}
                className="text-sm font-semibold text-farm-green-dark underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
              >
                Descartar cambios locales
              </button>
            </div>
          </div>
        </article>

        <aside className="rounded-2xl border border-farm-green/20 bg-farm-green-light/40 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-farm-green-dark">Resumen y guía rápida</h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modo automático</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {form.automatic_mode ? "Activado" : "Desactivado"}
              </dd>
            </div>

            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Inactividad</dt>
              <dd className="mt-1 font-medium text-gray-900">{form.inactivity_threshold_minutes} minutos</dd>
            </div>

            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Override manual</dt>
              <dd className="mt-1 font-medium text-gray-900">{form.manual_override_duration_minutes} minutos</dd>
            </div>

            <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Zona horaria</dt>
              <dd className="mt-1 font-medium text-gray-900">{form.report_timezone}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-2xl border border-dashed border-farm-green/30 bg-white/70 px-4 py-4 text-sm text-gray-700">
            El backend valida los números y la zona horaria antes de persistir la configuración. Usa un identificador IANA
            válido como <span className="font-semibold text-gray-900">UTC</span> o <span className="font-semibold text-gray-900">America/Bogota</span>.
          </div>
        </aside>
      </div>
    </section>
  );
};

export default GreenhouseConfigPage;