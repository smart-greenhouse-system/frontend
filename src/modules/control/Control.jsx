import { useCallback, useEffect, useRef, useState } from "react";
import {
  Droplets,
  Fan,
  Lightbulb,
  Loader2,
  Power,
  PowerOff,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  History,
  ListTodo,
} from "lucide-react";
import { getActuators, createActuator, updateActuator, deleteActuator, sendCommand, getActuatorEvents, getActuatorEventsByDevice } from "../../lib/actuatorApi";
import { getDevices } from "../../lib/deviceApi";
import Modal from "../../components/ui/Modal";

/* ─────────────── helpers ─────────────── */

const ACTUATOR_ICONS = {
  riego: Droplets,
  ventilacion: Fan,
  iluminacion: Lightbulb,
};
const DEFAULT_ICON = Lightbulb;
const ESTADOS = ["ON", "OFF"];
const TIPOS_ACTUADOR = ["riego", "ventilacion", "iluminacion"];

function isOn(actuator) {
  return actuator.estado === "ON" || actuator.estado === "on" || actuator.estado === "1";
}

function isEnabled(actuator) {
  return actuator.enabled === true || actuator.enabled === "true";
}

/* ─────────────── form inicial ─────────────── */

const EMPTY_FORM = { actuator_id: "", device_id: "", actuador: "riego", nombre: "", estado: "OFF", enabled: true };

/* ─────────────── Componente principal ─────────────── */

const Control = () => {
  const mountedRef = useRef(true);

  // --- datos ---
  const [actuators, setActuators] = useState([]);
  const [devices, setDevices] = useState([]);
  const [events, setEvents] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // --- ui ---
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [activeTab, setActiveTab] = useState("actuadores");
  const [loadingCmd, setLoadingCmd] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [executionResults, setExecutionResults] = useState({});

  // --- modales ---
  const [modal, setModal] = useState({ kind: null, actuator: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const openModal = (kind, actuator = null) => {
    setFormError("");
    if (kind === "create") {
      setForm(EMPTY_FORM);
    } else if (kind === "edit" && actuator) {
      setForm({
        device_id: actuator.device_id || "",
        actuador: actuator.actuador || "riego",
        nombre: actuator.nombre || "",
        estado: isOn(actuator) ? "ON" : "OFF",
        enabled: isEnabled(actuator),
      });
    }
    setModal({ kind, actuator });
  };
  const closeModal = () => setModal({ kind: null, actuator: null });

  // --- cleanup ---
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // --- fetch inicial ---
  const fetchAll = useCallback(async () => {
    try {
      const [actData, devData] = await Promise.all([getActuators(), getDevices()]);
      if (mountedRef.current) {
        setActuators(Array.isArray(actData) ? actData : []);
        setDevices(Array.isArray(devData) ? devData : []);
      }
    } catch {
      // silencioso
    } finally {
      if (mountedRef.current) setInitialized(true);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- fetch events cuando cambia el device ---
  useEffect(() => {
    if (!selectedDeviceId) { setEvents([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const data = await getActuatorEventsByDevice(selectedDeviceId);
        if (!cancelled && mountedRef.current) setEvents(Array.isArray(data) ? data : []);
      } catch { if (!cancelled && mountedRef.current) setEvents([]); }
    })();
    return () => { cancelled = true; };
  }, [selectedDeviceId]);

  // --- auto-dismiss feedback ---
  useEffect(() => {
    const ids = Object.keys(feedback);
    if (ids.length === 0) return;
    const timer = setTimeout(() => setFeedback({}), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // ── CRUD ──

  const handleCreate = useCallback(async () => {
    setSaving(true);
    setFormError("");
    try {
      const created = await createActuator(form);
      if (mountedRef.current) {
        setActuators((prev) => [...prev, created]);
        closeModal();
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Error al crear actuador");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [form]);

  const handleEdit = useCallback(async () => {
    if (!modal.actuator) return;
    setSaving(true);
    setFormError("");
    try {
      const updated = await updateActuator(modal.actuator.actuator_id, form);
      if (mountedRef.current) {
        setActuators((prev) => prev.map((a) => a.actuator_id === modal.actuator.actuator_id ? updated : a));
        closeModal();
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Error al actualizar actuador");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [modal.actuator, form]);

  const handleDelete = useCallback(async () => {
    if (!modal.actuator) return;
    setSaving(true);
    setFormError("");
    try {
      await deleteActuator(modal.actuator.actuator_id);
      if (mountedRef.current) {
        setActuators((prev) => prev.filter((a) => a.actuator_id !== modal.actuator.actuator_id));
        closeModal();
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Error al eliminar actuador");
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [modal.actuator]);

  // ── comando ON/OFF ──

  const handleCommand = useCallback(async (actuator, turnOn) => {
    const loadKey = `${actuator.actuator_id}:${turnOn ? "on" : "off"}`;
    setLoadingCmd(loadKey);
    try {
      const result = await sendCommand({
        device_id: actuator.device_id,
        actuador: actuator.actuador,
        accion: turnOn ? "ON" : "OFF",
      });
      if (!mountedRef.current) return;

      const executed = result.executed === true;
      if (executed) {
        setActuators((prev) =>
          prev.map((a) =>
            a.actuator_id === actuator.actuator_id
              ? { ...a, estado: turnOn ? "ON" : "OFF" }
              : a
          )
        );
      }

      setExecutionResults((prev) => ({
        ...prev,
        [actuator.actuator_id]: { executed, action: turnOn ? "ON" : "OFF", timestamp: Date.now() },
      }));

      setFeedback({
        [actuator.actuator_id]: {
          type: executed ? "success" : "error",
          message: result.message ?? (executed
            ? `Actuador ${turnOn ? "encendido" : "apagado"} correctamente`
            : "El comando no pudo ejecutarse"),
        },
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setFeedback({
        [actuator.actuator_id]: {
          type: "error",
          message: err.message ?? "Error de conexión con el servidor",
        },
      });
    } finally {
      if (mountedRef.current) setLoadingCmd(null);
    }
  }, []);

  // ── filtro ──

  const filtered = selectedDeviceId
    ? actuators.filter((a) => a.device_id === selectedDeviceId)
    : actuators;

  const deviceOptions = devices.filter((d) => d.actuadores?.length > 0 || !selectedDeviceId);

  // ── render ──

  return (
    <div className="min-h-screen space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Control de actuadores</h1>
          <p className="mt-0.5 text-sm text-gray-500">Controla manualmente los actuadores del invernadero.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-farm-green-dark/10 px-3 py-1.5 font-mono text-xs font-semibold text-farm-green-dark">
            {actuators.length} actuador{actuators.length !== 1 ? "es" : ""}
          </span>
          <button
            type="button"
            onClick={() => openModal("create")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-farm-green-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-farm-green hover:shadow-md"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Nuevo actuador
          </button>
        </div>
      </div>

      {/* ── Device selector + tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Dispositivo:</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
          >
            <option value="">Todos los dispositivos</option>
            {devices.map((d) => (
              <option key={d.device_id} value={d.device_id}>
                {d.nombre || d.device_id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("actuadores")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "actuadores" ? "bg-white text-farm-green-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ListTodo className="h-3.5 w-3.5" strokeWidth={2} />
            Actuadores
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("historial")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "historial" ? "bg-white text-farm-green-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <History className="h-3.5 w-3.5" strokeWidth={2} />
            Historial
          </button>
        </div>
      </div>

      {/* ── TAB: ACTUADORES ── */}
      {activeTab === "actuadores" && (
        <>
          {!initialized ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-farm-green-light border-t-farm-green-dark" />
              <p className="mt-4 text-sm font-medium text-gray-500">Cargando actuadores…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-500">
                {selectedDeviceId ? "Este dispositivo no tiene actuadores" : "No hay actuadores registrados"}
              </p>
              {!selectedDeviceId && (
                <button
                  type="button"
                  onClick={() => openModal("create")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-farm-green-dark hover:text-farm-green"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                  Crear el primer actuador
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((actuator) => {
                const Icon = ACTUATOR_ICONS[actuator.actuador] ?? DEFAULT_ICON;
                const on = isOn(actuator);
                const enabled = isEnabled(actuator);
                const loadKey = `${actuator.actuator_id}:`;
                const loadingOn = loadingCmd === `${loadKey}on`;
                const loadingOff = loadingCmd === `${loadKey}off`;
                const fb = feedback[actuator.actuator_id];
                const exec = executionResults[actuator.actuator_id];

                return (
                  <div
                    key={actuator.actuator_id}
                    className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                      enabled ? "border-gray-200/90" : "border-gray-200/50 opacity-60"
                    }`}
                  >
                    {/* header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-farm-green-dark/10 text-farm-green-dark">
                          <Icon className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{actuator.nombre || actuator.actuador}</p>
                          <p className="text-xs text-gray-500 font-mono truncate">
                            {actuator.actuador}
                            {actuator.device_id ? ` · ${actuator.device_id}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* execution indicator */}
                        {exec && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              exec.executed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                            title={`Último comando: ${exec.action} · ${exec.executed ? "Ejecutado" : "Fallido"}`}
                          >
                            {exec.executed ? <CheckCircle2 className="h-3 w-3" strokeWidth={2} /> : <XCircle className="h-3 w-3" strokeWidth={2} />}
                            {exec.executed ? "OK" : "FAIL"}
                          </span>
                        )}
                        {/* estado badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            on ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-green-500" : "bg-red-500"}`} />
                          {on ? "ON" : "OFF"}
                        </span>
                      </div>
                    </div>

                    {/* enabled indicator */}
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      {!enabled && (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 font-semibold text-yellow-800">Deshabilitado</span>
                      )}
                      <span className="text-gray-400">{actuator.actuator_id}</span>
                    </div>

                    {/* feedback */}
                    {fb && (
                      <p
                        className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                          fb.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
                        }`}
                        role="alert"
                      >
                        {fb.message}
                      </p>
                    )}

                    {/* actions */}
                    <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={loadingCmd !== null || on || !enabled}
                        onClick={() => handleCommand(actuator, true)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-farm-green-dark px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-farm-green disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingOn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" strokeWidth={2} />}
                        Encender
                      </button>
                      <button
                        type="button"
                        disabled={loadingCmd !== null || !on || !enabled}
                        onClick={() => handleCommand(actuator, false)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingOff ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PowerOff className="h-3.5 w-3.5" strokeWidth={2} />}
                        Apagar
                      </button>
                      <div className="ml-auto flex gap-1">
                        <button
                          type="button"
                          onClick={() => openModal("edit", actuator)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                          title="Editar actuador"
                        >
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal("delete", actuator)}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Eliminar actuador"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {activeTab === "historial" && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-sm font-semibold text-gray-700">
              {selectedDeviceId ? `Eventos · ${selectedDeviceId}` : "Selecciona un dispositivo para ver su historial"}
            </p>
          </div>
          {!selectedDeviceId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">Usa el filtro de dispositivo para ver los eventos.</p>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-gray-500">No hay eventos para este dispositivo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Actuador</th>
                    <th className="px-5 py-3 font-semibold">Acción</th>
                    <th className="px-5 py-3 font-semibold">Ejecutado</th>
                    <th className="px-5 py-3 font-semibold">Origen</th>
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 font-semibold">Time Action</th>
                    <th className="px-5 py-3 font-semibold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-mono text-gray-800">{ev.actuator}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${
                          ev.action === "ON" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>{ev.action}</span>
                      </td>
                      <td className="px-5 py-3">
                        {ev.executed
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" strokeWidth={2} />
                          : <XCircle className="h-4 w-4 text-red-600" strokeWidth={2} />
                        }
                      </td>
                      <td className="px-5 py-3 text-gray-600">{ev.origin || "—"}</td>
                      <td className="px-5 py-3 text-gray-600">{ev.event_type || "—"}</td>
                      <td className="px-5 py-3 font-mono text-gray-600">{ev.time_action != null ? `${ev.time_action}s` : "—"}</td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {ev.created_at ? new Date(ev.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "medium" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT ── */}
      <Modal
        isOpen={modal.kind === "create" || modal.kind === "edit"}
        onClose={closeModal}
        title={modal.kind === "create" ? "Crear actuador" : "Editar actuador"}
      >
        <div className="space-y-4">
          {modal.kind === "create" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">actuator_id</label>
              <input
                value={form.actuator_id}
                onChange={(e) => setForm((f) => ({ ...f, actuator_id: e.target.value }))}
                placeholder="Ej: VEN3468"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">device_id</label>
            <select
              value={form.device_id}
              onChange={(e) => setForm((f) => ({ ...f, device_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
            >
              <option value="">Seleccionar dispositivo…</option>
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>{d.nombre || d.device_id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Actuador (hardware ID)</label>
            <select
              value={form.actuador}
              onChange={(e) => setForm((f) => ({ ...f, actuador: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
            >
              {TIPOS_ACTUADOR.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Válvula de riego norte"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Estado inicial</label>
            <select
              value={form.estado}
              onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-farm-green-dark focus:outline-none focus:ring-2 focus:ring-farm-green-dark/20"
            >
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              className="rounded border-gray-300 text-farm-green-dark focus:ring-farm-green-dark/20"
            />
            <span className="text-xs font-medium text-gray-600">Habilitado</span>
          </label>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
            >Cancelar</button>
            <button
              type="button"
              disabled={saving}
              onClick={modal.kind === "create" ? handleCreate : handleEdit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-farm-green-dark px-4 py-2 text-xs font-semibold text-white transition hover:bg-farm-green disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {modal.kind === "create" ? "Crear" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: DELETE CONFIRM ── */}
      <Modal
        isOpen={modal.kind === "delete"}
        onClose={closeModal}
        title="Eliminar actuador"
      >
        <p className="text-sm text-gray-600">
          ¿Estás seguro de eliminar <strong>{modal.actuator?.nombre || modal.actuator?.actuator_id}</strong>?
          Esta acción no se puede deshacer.
        </p>
        {formError && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
          >Cancelar</button>
          <button
            type="button"
            disabled={saving}
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Control;
