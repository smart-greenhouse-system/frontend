import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import {
  login as loginRequest,
  persistAuthSession,
} from "../../../api/authService.js";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const data = await loginRequest({
        email: formData.email.trim(),
        password: formData.password,
      });
      persistAuthSession(data);
      navigate("/inventory", { replace: true });
    } catch (err) {
      const message =
        err?.message ??
        (err.code === "ERR_NETWORK"
          ? "No se pudo conectar con el servidor. Verifica la URL del API."
          : "No se pudo iniciar sesión. Intenta de nuevo.");
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg">
        <div className="rounded-t-2xl bg-farm-green px-8 py-6 text-white">
          <div className="flex items-center gap-4">
            <img
              src="/assets/iconoGreenHouse.jpg"
              alt=""
              className="h-14 w-14 rounded-xl bg-transparent object-cover shadow-sm"
              width={56}
              height={56}
            />
            <div>
              <p className="text-sm font-medium text-farm-green-light/90">GreenHouse</p>
              <h1 className="text-3xl font-semibold">Iniciar sesión</h1>
              <p className="mt-1 text-sm text-farm-green-light/90">
                Accede a tu panel para gestionar tu invernadero inteligente.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 pt-8 pb-10">
          {submitError ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {submitError}
            </div>
          ) : null}
          <Input
            id="email"
            name="email"
            label="Correo"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            required
          />

          <Input
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="********"
            required
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              {isSubmitting ? (
                "Ingresando…"
              ) : (
                <>
                  <LogIn size={18} />
                  Ingresar
                </>
              )}
            </span>
          </Button>

          <div className="pt-2 text-center text-sm">
            <Link to="/register" className="font-medium text-farm-green hover:underline">
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
