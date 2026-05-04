import { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { getOperatorToken, postCropHarvest } from "../../../lib/cropApi";

/**
 * RF-27: cierre de ciclo con cosecha real.
 * POST /api/v1/crops/{crop_id}/harvest — cuerpo { harvest_date, harvest_quantity? }.
 *
 * @param {string} props.cropId
 * @param {string} props.cropName — nombre del cultivo (ej. Tomate Cherry)
 * @param {string} props.greenhouseName — nombre del invernadero
 * @param {() => string} [props.getAuthToken]
 * @param {() => void} [props.onSuccess] — tras respuesta 200 exitosa
 */
const HarvestRegistration = ({
  cropId,
  cropName,
  greenhouseName,
  getAuthToken = getOperatorToken,
  onSuccess,
}) => {
  const [harvestDate, setHarvestDate] = useState("");
  const [quantityRaw, setQuantityRaw] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const next = {};
    if (!harvestDate) next.harvestDate = "La fecha de cosecha es obligatoria.";
    const q = quantityRaw.trim();
    if (q !== "") {
      const n = parseFloat(q.replace(",", "."));
      if (Number.isNaN(n)) next.harvest_quantity = "Introduce una cantidad numérica o deja el campo vacío.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSuccessMessage("");
    if (!validate()) return;
    if (!cropId) {
      setSubmitError("Falta el identificador del cultivo.");
      return;
    }

    const token = getAuthToken();
    const body = { harvest_date: harvestDate };
    const q = quantityRaw.trim();
    if (q !== "") {
      body.harvest_quantity = parseFloat(q.replace(",", "."));
    }

    setLoading(true);
    try {
      const data = await postCropHarvest(cropId, body, token);
      setSuccessMessage(data?.message || "Cosecha registrada correctamente.");
      setDone(true);
      onSuccess?.(data);
    } catch (e) {
      const msg =
        e?.code === "CROP_ALREADY_HARVESTED"
          ? e.message || "Este cultivo ya fue marcado como cosechado."
          : e?.message || "No se pudo registrar la cosecha.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <h2 className="text-lg font-semibold text-farm-green-dark">
          🍅 {cropName} – {greenhouseName}
        </h2>
        <p className="mt-1 text-sm text-gray-600">Cierra el ciclo del cultivo con la fecha real de cosecha.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        noValidate
      >
        <Input
          id="harvest-date"
          name="harvestDate"
          label="Fecha de cosecha (obligatoria)"
          type="date"
          value={harvestDate}
          onChange={(e) => {
            setHarvestDate(e.target.value);
            setErrors((prev) => ({ ...prev, harvestDate: undefined }));
          }}
          disabled={done}
          error={errors.harvestDate}
        />

        <div>
          <label htmlFor="harvest-qty" className="mb-2 block text-sm font-medium text-gray-700">
            Cantidad cosechada (opcional)
          </label>
          <input
            id="harvest-qty"
            name="harvest_quantity"
            type="text"
            inputMode="decimal"
            value={quantityRaw}
            onChange={(e) => {
              setQuantityRaw(e.target.value);
              setErrors((prev) => ({ ...prev, harvest_quantity: undefined }));
            }}
            disabled={done}
            placeholder="Ej. 150 (kg, unidades o volumen según tu criterio)"
            className={[
              "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
              errors.harvest_quantity
                ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
            ].join(" ")}
          />
          {errors.harvest_quantity ? (
            <p className="mt-1 text-sm text-red-600">{errors.harvest_quantity}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">Puedes indicar unidades en el texto (ej. 150 kg); se envía el valor numérico.</p>
          )}
        </div>

        {submitError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {submitError}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" role="status">
            {successMessage}
          </p>
        ) : null}

        <Button type="submit" disabled={loading || done} className={loading || done ? "opacity-70" : ""}>
          {done ? "Ciclo cerrado" : loading ? "Registrando…" : "Registrar cosecha"}
        </Button>
      </form>
    </section>
  );
};

export default HarvestRegistration;
