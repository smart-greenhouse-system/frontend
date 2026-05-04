import CropNotes from "../components/CropNotes";
import HarvestRegistration from "../components/HarvestRegistration";

/** Datos de ejemplo hasta existir listado API de cultivos activos */
const DEMO_CROPS = [
  { crop_id: "crop-demo-1", label: "Tomate Cherry – Invernadero Norte" },
  { crop_id: "crop-demo-2", label: "Lechuga Romana – Invernadero Sur" },
];

const CropManagement = () => {
  const primary = DEMO_CROPS[0];

  return (
    <section className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold text-farm-green-dark">Gestión de cultivos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Observaciones (RF-25) y registro de cosecha (RF-27). Configura la URL base del API con{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">VITE_API_BASE_URL</code> y el token del operador en{" "}
          <code className="rounded bg-gray-100 px-1 text-xs">localStorage.operator_token</code>.
        </p>
      </header>

      <CropNotes crops={DEMO_CROPS} operatorLabel="Operador actual" />

      <HarvestRegistration
        cropId={primary.crop_id}
        cropName="Tomate Cherry"
        greenhouseName="Invernadero Norte"
      />
    </section>
  );
};

export default CropManagement;
