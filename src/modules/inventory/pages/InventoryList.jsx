import { useMemo, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";

const initialInventory = [
  { id: 1, name: "Fertilizante NPK", category: "Insumo", stock: 32, unit: "kg" },
  { id: 2, name: "Pala", category: "Herramienta", stock: 8, unit: "unidad" },
  { id: 3, name: "Semillas de Tomate", category: "Insumo", stock: 120, unit: "paquetes" },
  { id: 4, name: "Manguera de Riego", category: "Herramienta", stock: 5, unit: "unidad" },
  { id: 5, name: "Sustrato Orgánico", category: "Insumo", stock: 18, unit: "sacos" },
];

const InventoryList = () => {
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState(initialInventory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    initialStock: "",
    unit: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const handleItemChange = (event) => {
    const { name, value } = event.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSaveItem = (event) => {
    event.preventDefault();

    const errors = {};
    if (!newItem.name.trim()) errors.name = "El nombre es obligatorio.";
    if (!newItem.category) errors.category = "La categoría es obligatoria.";
    if (!newItem.initialStock) errors.initialStock = "El stock inicial es obligatorio.";
    if (!newItem.unit) errors.unit = "La unidad es obligatoria.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      id: Math.floor(Date.now() + Math.random() * 1000),
      name: newItem.name.trim(),
      category: newItem.category,
      stock: Number(newItem.initialStock),
      unit: newItem.unit,
    };

    setInventory((prev) => [...prev, payload]);
    console.log("Nuevo insumo agregado:", payload);
    setIsModalOpen(false);
    setNewItem({ name: "", category: "", initialStock: "", unit: "" });
    setFormErrors({});
  };

  const handleDelete = (id) => {
    const shouldDelete = window.confirm("¿Seguro que deseas eliminar este insumo?");
    if (!shouldDelete) return;

    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredInventory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;

    return inventory.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.unit.toLowerCase().includes(term)
      );
    });
  }, [search, inventory]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-farm-green-dark">
            Inventario de Insumos y Herramientas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona el stock actual de herramientas e insumos del invernadero.
          </p>
        </div>

        <Button
          type="button"
          className="flex w-auto items-center gap-2 rounded-xl px-5 py-2.5"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>+ Agregar Insumo</span>
        </Button>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="max-w-xl">
          <Input
            id="inventory-search"
            name="inventory-search"
            label="Buscar insumo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busca por nombre, categoría o unidad..."
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {filteredInventory.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-600">
            No hay insumos registrados. Haz clic en el botón superior para agregar uno.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full md:divide-y md:divide-gray-200">
              <thead className="hidden bg-farm-green-light/50 md:table-header-group">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-farm-green-dark">
                    Stock Actual
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
                {filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className="block rounded-xl border border-gray-200 p-3 shadow-sm md:table-row md:rounded-none md:border-0 md:p-0 md:shadow-none md:hover:bg-gray-50"
                  >
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-6 md:py-4 md:font-medium md:text-gray-800">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Nombre
                      </span>
                      <span className="text-right font-medium text-gray-800 md:text-left md:font-medium">
                        {item.name}
                      </span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-6 md:py-4 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Categoría
                      </span>
                      <span className="text-right text-gray-700 md:text-left">{item.category}</span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-6 md:py-4 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Stock
                      </span>
                      <span className="text-right text-gray-700 md:text-left">{item.stock}</span>
                    </td>
                    <td className="grid grid-cols-2 items-center gap-2 py-2 text-sm md:table-cell md:px-6 md:py-4 md:text-gray-700">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:hidden">
                        Unidad
                      </span>
                      <span className="text-right text-gray-700 md:text-left">{item.unit}</span>
                    </td>
                    <td className="pt-3 md:px-6 md:py-4">
                      <div className="flex gap-2 md:justify-end">
                        <button
                          type="button"
                          className="flex-1 rounded-lg border border-farm-green/30 px-3 py-2 text-farm-green-dark transition hover:bg-farm-green-light md:flex-none md:border-0 md:p-2"
                          title="Editar"
                          onClick={() => console.log("Editar", item.id)}
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
                            <span className="text-sm md:hidden">Eliminar</span>
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Agregar nuevo insumo"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <Input
            id="name"
            name="name"
            label="Nombre"
            value={newItem.name}
            onChange={handleItemChange}
            placeholder="Ej. Fertilizante NPK"
            error={formErrors.name}
          />

          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
              Categoría
            </label>
            <select
              id="category"
              name="category"
              value={newItem.category}
              onChange={handleItemChange}
              className={[
                "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
                formErrors.category
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
              ].join(" ")}
            >
              <option value="">Selecciona una categoría</option>
              <option value="Fertilizante">Fertilizante</option>
              <option value="Herramienta">Herramienta</option>
              <option value="Semilla">Semilla</option>
              <option value="Otro">Otro</option>
            </select>
            {formErrors.category ? (
              <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
            ) : null}
          </div>

          <Input
            id="initialStock"
            name="initialStock"
            label="Stock Inicial"
            type="number"
            min="0"
            value={newItem.initialStock}
            onChange={handleItemChange}
            placeholder="Ej. 20"
            error={formErrors.initialStock}
          />

          <div>
            <label htmlFor="unit" className="mb-2 block text-sm font-medium text-gray-700">
              Unidad
            </label>
            <select
              id="unit"
              name="unit"
              value={newItem.unit}
              onChange={handleItemChange}
              className={[
                "w-full rounded-lg border px-4 py-2.5 text-gray-800 outline-none transition",
                formErrors.unit
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-gray-300 focus:border-farm-green focus:ring-2 focus:ring-farm-green/20",
              ].join(" ")}
            >
              <option value="">Selecciona una unidad</option>
              <option value="Kg">Kg</option>
              <option value="L">L</option>
              <option value="Unidades">Unidades</option>
            </select>
            {formErrors.unit ? (
              <p className="mt-1 text-sm text-red-600">{formErrors.unit}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              className="w-auto bg-gray-200 px-4 text-gray-800 hover:bg-gray-300"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-auto px-4">
              Guardar
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};

export default InventoryList;
