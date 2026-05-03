import { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const initialHistory = [
  {
    id: 1,
    date: "2026-05-03 08:20",
    resource: "Agua de riego",
    quantity: "18 L",
    crop: "Tomate Cherry",
    origin: "Automático",
  },
  {
    id: 2,
    date: "2026-05-03 09:45",
    resource: "Fertilizante NPK",
    quantity: "2 kg",
    crop: "Lechuga",
    origin: "Manual",
  },
  {
    id: 3,
    date: "2026-05-03 11:10",
    resource: "Agua de riego",
    quantity: "12 L",
    crop: "Tomate Cherry",
    origin: "Automático",
  },
];

const ResourceConsumption = () => {
  const [formData, setFormData] = useState({
    resource: "",
    crop: "",
    quantity: "",
    unit: "",
  });
  const [history, setHistory] = useState(initialHistory);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!formData.resource) nextErrors.resource = "Selecciona un insumo.";
    if (!formData.crop) nextErrors.crop = "Selecciona un cultivo.";
    if (!formData.quantity) nextErrors.quantity = "Ingresa una cantidad.";
    if (!formData.unit) nextErrors.unit = "Selecciona una unidad.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const newMovement = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      resource: formData.resource,
      quantity: `${formData.quantity} ${formData.unit}`,
      crop: formData.crop,
      origin: "Manual",
    };

    setHistory((prev) => [newMovement, ...prev]);
    console.log("Consumo registrado:", newMovement);
    setFormData({ resource: "", crop: "", quantity: "", unit: "" });
    setErrors({});
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-farm-green-dark">
          Registro de Consumo de Recursos
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Registra consumos manuales y revisa el historial de movimientos.
        </p>
      </header>

      <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
          <div>
            <label htmlFor="resource" className="mb-2 block text-sm font-medium text-gray-700">
              Insumo
            </label>
            <select
              id="resource"
              name="resource"
              value={formData.resource}
              onChange={handleChange}
              className={[
                "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
                errors.resource
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
              ].join(" ")}
            >
              <option value="">Selecciona insumo</option>
              <option value="Fertilizante NPK">Fertilizante NPK</option>
              <option value="Sustrato Orgánico">Sustrato Orgánico</option>
              <option value="Agua de riego">Agua de riego</option>
              <option value="Semillas de Tomate">Semillas de Tomate</option>
            </select>
            {errors.resource ? <p className="mt-1 text-sm text-red-600">{errors.resource}</p> : null}
          </div>

          <div>
            <label htmlFor="crop" className="mb-2 block text-sm font-medium text-gray-700">
              Cultivo
            </label>
            <select
              id="crop"
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className={[
                "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
                errors.crop
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
              ].join(" ")}
            >
              <option value="">Selecciona cultivo</option>
              <option value="Tomate Cherry">Tomate Cherry</option>
              <option value="Lechuga">Lechuga</option>
            </select>
            {errors.crop ? <p className="mt-1 text-sm text-red-600">{errors.crop}</p> : null}
          </div>

          <Input
            id="quantity"
            name="quantity"
            label="Cantidad"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Ej. 5"
            error={errors.quantity}
          />

          <div>
            <label htmlFor="unit" className="mb-2 block text-sm font-medium text-gray-700">
              Unidad
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className={[
                "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
                errors.unit
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
              ].join(" ")}
            >
              <option value="">Selecciona unidad</option>
              <option value="L">L</option>
              <option value="kg">kg</option>
              <option value="mL">mL</option>
              <option value="Unidades">Unidades</option>
            </select>
            {errors.unit ? <p className="mt-1 text-sm text-red-600">{errors.unit}</p> : null}
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Registrar Consumo
            </Button>
          </div>
        </form>
      </article>

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-farm-green-dark">Historial de consumo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full md:divide-y md:divide-gray-200">
            <thead className="hidden bg-farm-green-light/50 md:table-header-group">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Fecha
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Recurso/Insumo
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Cantidad
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Cultivo
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                  Origen
                </th>
              </tr>
            </thead>
            <tbody className="block space-y-3 bg-white p-3 md:table-row-group md:space-y-0 md:p-0">
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="block rounded-xl border border-gray-200 p-3 shadow-sm md:table-row md:rounded-none md:border-0 md:p-0 md:shadow-none md:hover:bg-gray-50"
                >
                  <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                      Fecha
                    </span>
                    <span className="text-right text-gray-700 md:text-left">{entry.date}</span>
                  </td>
                  <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:font-medium md:text-gray-800">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                      Insumo
                    </span>
                    <span className="text-right font-medium text-gray-800 md:text-left">
                      {entry.resource}
                    </span>
                  </td>
                  <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                      Cantidad
                    </span>
                    <span className="text-right text-gray-700 md:text-left">{entry.quantity}</span>
                  </td>
                  <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3 md:text-gray-700">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                      Cultivo
                    </span>
                    <span className="text-right text-gray-700 md:text-left">{entry.crop}</span>
                  </td>
                  <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-5 md:py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                      Origen
                    </span>
                    <span className="flex justify-end md:justify-start">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        entry.origin === "Automático"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-amber-100 text-amber-700",
                      ].join(" ")}
                    >
                      {entry.origin}
                    </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
};

export default ResourceConsumption;
