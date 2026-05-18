import { useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { getOperatorToken, postCropNote } from "../../../lib/cropApi";

function noteTitleFromText(text) {
  const line = text.split(/\r?\n/)[0]?.trim() || "";
  if (line.length <= 56) return line || "Observación";
  return `${line.slice(0, 53)}…`;
}

function formatDisplayDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * RF-25: formulario de observaciones + tabla de historial (notas confirmadas en esta sesión).
 * POST /api/v1/crops/{crop_id}/notes — cuerpo { note, date } (YYYY-MM-DD).
 *
 * @param {{ crop_id: string, label: string }[]} props.crops — opciones del selector de cultivo
 * @param {string} [props.operatorLabel] — texto columna Operador (el backend asocia el ID del token)
 * @param {() => string} [props.getAuthToken] — por defecto lee token de localStorage
 */
const CropNotes = ({
  crops = [],
  operatorLabel = "Operador",
  getAuthToken = getOperatorToken,
}) => {
  const [cropId, setCropId] = useState(crops[0]?.crop_id ?? "");
  const [observationDate, setObservationDate] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1)),
    [rows],
  );

  const validate = () => {
    const next = {};
    if (!cropId) next.cropId = "Selecciona un cultivo.";
    if (!observationDate) next.observationDate = "Indica la fecha de la observación.";
    if (!note.trim()) next.note = "El texto de la observación no puede estar vacío.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    const payload = {
      note: note.trim(),
      date: observationDate,
    };

    setLoading(true);
    try {
      const data = await postCropNote(cropId, payload);
      const title = noteTitleFromText(payload.note);
      setRows((prev) => [
        {
          id: data?.note_id ?? `local-${Date.now()}`,
          title,
          description: payload.note,
          dateIso: payload.date,
          operator: operatorLabel,
          sortKey: `${payload.date}T${Date.now()}`,
        },
        ...prev,
      ]);
      setNote("");
    } catch (e) {
      const msg =
        e?.code === "EMPTY_NOTE"
          ? e.message || "El texto de la observación no puede estar vacío."
          : e?.message || "No se pudo guardar la observación.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-farm-green-dark">Observaciones del cultivo</h2>
        <p className="mt-1 text-sm text-gray-600">
          Registra notas de campo; las guardadas en esta sesión aparecen en la tabla inferior.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        noValidate
      >
        <div>
          <label htmlFor="crop-notes-crop" className="mb-2 block text-sm font-medium text-gray-700">
            Cultivo
          </label>
          <select
            id="crop-notes-crop"
            value={cropId}
            onChange={(e) => {
              setCropId(e.target.value);
              setErrors((prev) => ({ ...prev, cropId: undefined }));
            }}
            className={[
              "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
              errors.cropId
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
            ].join(" ")}
          >
            <option value="">— Seleccionar —</option>
            {crops.map((c) => (
              <option key={c.crop_id} value={c.crop_id}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.cropId ? <p className="mt-1 text-sm text-red-600">{errors.cropId}</p> : null}
        </div>

        <div>
          <Input
            id="crop-notes-date"
            name="observationDate"
            label="Fecha de la observación (dd/mm/aaaa)"
            type="date"
            value={observationDate}
            onChange={(e) => {
              setObservationDate(e.target.value);
              setErrors((prev) => ({ ...prev, observationDate: undefined }));
            }}
            error={errors.observationDate}
          />
        </div>

        <div>
          <label htmlFor="crop-notes-text" className="mb-2 block text-sm font-medium text-gray-700">
            Observación
          </label>
          <textarea
            id="crop-notes-text"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setErrors((prev) => ({ ...prev, note: undefined }));
            }}
            placeholder="Escribe una observación del cultivo..."
            rows={4}
            className={[
              "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
              errors.note
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
            ].join(" ")}
            aria-invalid={Boolean(errors.note)}
          />
          {errors.note ? <p className="mt-1 text-sm text-red-600">{errors.note}</p> : null}
        </div>

        {submitError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" disabled={loading} className={loading ? "opacity-70" : ""}>
          {loading ? "Guardando…" : "Guardar observación"}
        </Button>
      </form>

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-farm-green-dark">Observaciones recientes</h3>
          <p className="mt-1 text-xs text-gray-500">Incluye las observaciones guardadas correctamente en esta sesión.</p>
        </div>
        <div className="overflow-x-auto">
          {sortedRows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              Aún no hay observaciones guardadas en esta sesión.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-farm-green-light/50">
                <tr>
                  {["Título", "Descripción", "Fecha", "Operador"].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sortedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-5 py-3 text-sm font-medium text-gray-900">
                      {row.title}
                    </td>
                    <td className="max-w-md px-5 py-3 text-sm text-gray-700">
                      <span className="line-clamp-3">{row.description}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-700">
                      {formatDisplayDate(row.dateIso)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-700">{row.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </article>
    </section>
  );
};

export default CropNotes;
