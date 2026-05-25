import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import {
  createInventoryItem,
  getInventory,
  updateInventoryItem,
} from "../../../lib/inventoryApi";

const EMPTY_FORM = {
  nombre: "",
  cantidad: "",
  unidad: "",
  threshold_minimo: "",
};

const UNIT_OPTIONS = ["kg", "L", "mL", "Unidades", "Sacos", "Cajas", "Paquetes"];

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [loadStatus, setLoadStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoadStatus("loading");
    try {
      const data = await getInventory();
      setInventory(data);
      setLoadStatus("success");
    } catch (err) {
      setLoadError(err.message ?? "Error al cargar el inventario");
      setLoadStatus("error");
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const isLowStock = useCallback(
    (item) => item.threshold_minimo != null && item.cantidad <= item.threshold_minimo,
    []
  );

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();
    const valid = inventory.filter((item) => item.nombre?.trim());
    if (!term) return valid;
    return valid.filter(
      (item) =>
        item.nombre.toLowerCase().includes(term) ||
        item.unidad.toLowerCase().includes(term)
    );
  }, [search, inventory]);

  const lowStockCount = useMemo(
    () => inventory.filter(isLowStock).length,
    [inventory, isLowStock]
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      nombre: item.nombre,
      cantidad: String(item.cantidad),
      unidad: item.unidad,
      threshold_minimo:
        item.threshold_minimo != null ? String(item.threshold_minimo) : "",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
    if (form.cantidad === "" || Number(form.cantidad) < 0)
      errors.cantidad = "Indica una cantidad válida (≥ 0).";
    if (!form.unidad) errors.unidad = "La unidad es obligatoria.";
    if (form.threshold_minimo !== "" && Number(form.threshold_minimo) < 0)
      errors.threshold_minimo = "El mínimo debe ser ≥ 0.";
    return errors;
  };

  const buildApiPayload = () => {
    const payload = {
      nombre: form.nombre.trim(),
      cantidad: Number(form.cantidad),
      unidad: form.unidad,
    };
    if (form.threshold_minimo !== "") {
      payload.threshold_minimo = Number(form.threshold_minimo);
    }
    return payload;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = buildApiPayload();
      if (editingId) {
        const updated = await updateInventoryItem(editingId, payload);
        setInventory((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, ...updated } : item
          )
        );
      } else {
        const created = await createInventoryItem(payload);
        setInventory((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      setFormErrors({
        _form: err.message ?? "No se pudo guardar el ítem.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Seguro que deseas quitar este ítem de la lista?"))
      return;
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-farm-green-dark">
            Inventario de Insumos
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona el stock actual. Los ítems en rojo están por debajo del
            mínimo configurado.
          </p>
          {lowStockCount > 0 ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 ring-1 ring-red-200">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              {lowStockCount} ítem
              {lowStockCount === 1 ? "" : "s"} con stock bajo
            </p>
          ) : null}
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
            onClick={openCreateModal}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agregar ítem</span>
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
        <div className="max-w-xl">
          <Input
            id="inventory-search"
            name="inventory-search"
            label="Buscar insumo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca por nombre o unidad..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loadStatus === "loading" ? (
          <div className="space-y-3 px-6 py-10">
            <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
          </div>
        ) : null}

        {loadStatus === "error" ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <Button
              type="button"
              className="mx-auto mt-4 w-auto px-4"
              onClick={loadInventory}
            >
              Reintentar
            </Button>
          </div>
        ) : null}

        {loadStatus === "success" && filteredInventory.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-600">
            {inventory.length === 0
              ? "No hay ítems registrados. Agrega el primero con el botón superior."
              : "No hay resultados para tu búsqueda."}
          </div>
        ) : null}

        {loadStatus === "success" && filteredInventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full md:divide-y md:divide-gray-200">
              <thead className="hidden bg-farm-green-light/50 md:table-header-group">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Unidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="block space-y-3 bg-white p-3 md:table-row-group md:space-y-0 md:p-0">
                {filteredInventory.map((item) => {
                  const low = isLowStock(item);
                  return (
                    <tr
                      key={item.id}
                      className={[
                        "block rounded-xl border p-3 shadow-sm md:table-row md:rounded-none md:border-0 md:p-0 md:shadow-none md:hover:bg-gray-50",
                        low ? "border-red-300 bg-red-50/50" : "border-gray-200",
                      ].join(" ")}
                    >
                      <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-6 md:py-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                          Nombre
                        </span>
                        <span className="text-right font-medium text-gray-800 md:text-left">
                          {item.nombre}
                            {low ? (
                            <span className="ml-2 inline-flex rounded-full bg-red-200 px-2 py-0.5 text-[10px] font-bold uppercase text-red-800">
                              Stock Bajo
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className={`grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-6 md:py-4 md:text-gray-700 ${low ? "bg-red-50" : ""}`}>
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                          Cantidad
                        </span>
                        <span
                          className={[
                            "text-right tabular-nums md:text-left",
                            low ? "font-bold text-red-600" : "",
                          ].join(" ")}
                        >
                          {item.cantidad}
                        </span>
                      </td>
                      <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-6 md:py-4 md:text-gray-700">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                          Unidad
                        </span>
                        <span className="text-right md:text-left">
                          {item.unidad}
                        </span>
                      </td>
                      <td className="pt-3 md:px-6 md:py-4">
                        <div className="flex gap-2 md:justify-end">
                          <button
                            type="button"
                            className="flex-1 rounded-lg border border-farm-green/30 px-3 py-2 text-farm-green-dark transition hover:bg-farm-green-light md:flex-none md:border-0 md:p-2"
                            title="Editar"
                            onClick={() => openEditModal(item)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Pencil className="h-4 w-4" />
                              <span className="text-sm md:hidden">Editar</span>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-red-600 transition hover:bg-red-50 md:flex-none md:border-0 md:p-2"
                            title="Eliminar"
                            onClick={() => handleDelete(item.id)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Trash2 className="h-4 w-4" />
                              <span className="text-sm md:hidden">
                                Eliminar
                              </span>
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar ítem" : "Agregar ítem al inventario"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formErrors._form ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {formErrors._form}
            </p>
          ) : null}

          <Input
            id="nombre"
            name="nombre"
            label="Nombre"
            value={form.nombre}
            onChange={handleFormChange}
            placeholder="Ej. Fertilizante NPK"
            error={formErrors.nombre}
          />

          <Input
            id="cantidad"
            name="cantidad"
            label="Cantidad"
            type="number"
            min="0"
            step="any"
            value={form.cantidad}
            onChange={handleFormChange}
            placeholder="Ej. 20"
            error={formErrors.cantidad}
          />

          <Input
            id="threshold_minimo"
            name="threshold_minimo"
            label="Umbral mínimo (opcional)"
            type="number"
            min="0"
            step="any"
            value={form.threshold_minimo}
            onChange={handleFormChange}
            placeholder="Alerta cuando la cantidad llegue aquí"
            error={formErrors.threshold_minimo}
          />

          <div>
            <label
              htmlFor="unidad"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Unidad
            </label>
            <select
              id="unidad"
              name="unidad"
              value={form.unidad}
              onChange={handleFormChange}
              className={[
                "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
                formErrors.unidad
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
              ].join(" ")}
            >
              <option value="">Selecciona una unidad</option>
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            {formErrors.unidad ? (
              <p className="mt-1 text-sm text-red-600">
                {formErrors.unidad}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              className="w-auto bg-gray-200 px-4 text-gray-800 hover:bg-gray-300"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto px-4" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default InventoryList;
