import { Link } from "react-router-dom";
import { Sprout, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-farm-green-light/40 to-white px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-farm-green-dark/10 text-farm-green-dark">
          <Sprout className="h-10 w-10" strokeWidth={1.5} />
        </div>

        <h1 className="mt-8 text-7xl font-extrabold text-farm-green-dark tracking-tight">404</h1>
        <p className="mt-3 text-lg font-medium text-gray-700">Página no encontrada</p>
        <p className="mt-2 text-sm text-gray-500">
          La ruta a la que intentas acceder no existe o ha sido movida.
        </p>

        <Link
          to="/monitoreo"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-farm-green-dark px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-farm-green"
        >
          <Home className="h-4 w-4" strokeWidth={2} />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
