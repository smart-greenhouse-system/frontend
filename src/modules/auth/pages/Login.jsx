import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.message ||
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
          <h1 className="text-3xl font-semibold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-farm-green-light/90">
            Accede a tu panel para gestionar tu invernadero inteligente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
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

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando…" : "Ingresar"}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link to="/forgot-password" className="text-farm-green hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
            <Link to="/register" className="text-farm-green hover:underline">
              Regístrate
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
