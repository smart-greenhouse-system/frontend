import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { register as registerRequest } from "../../../api/authService.js";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrors({
        confirmPassword: "Las contraseñas no coinciden.",
      });
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      await registerRequest({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      const message =
        err?.message ??
        (err.code === "ERR_NETWORK"
          ? "No se pudo conectar con el servidor."
          : "No se pudo registrar. Intenta de nuevo.");
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-lg">
        <div className="rounded-t-2xl bg-farm-green-dark px-8 py-6 text-white">
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
              <h1 className="text-3xl font-semibold">Crear cuenta</h1>
              <p className="mt-1 text-sm text-farm-green-light/90">
                Crea tu cuenta para empezar a gestionar tu invernadero inteligente.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 pt-8 pb-10">
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
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="********"
            required
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="********"
            error={errors.confirmPassword}
            required
          />

          {submitError ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {submitError}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              {isSubmitting ? (
                "Registrando…"
              ) : (
                <>
                  <UserPlus size={18} />
                  Registrarse
                </>
              )}
            </span>
          </Button>

          <p className="text-center text-sm text-gray-700">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-farm-green hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
