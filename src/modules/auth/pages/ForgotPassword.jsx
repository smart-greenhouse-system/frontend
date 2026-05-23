import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg">
        <div className="rounded-t-2xl bg-farm-green-dark px-8 py-6 text-white">
          <h1 className="text-3xl font-semibold">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-farm-green-light/90">
            Ingresa tu correo para enviarte un enlace de recuperación.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
          <Input
            id="email"
            name="email"
            label="Correo"
            type="email"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Button type="submit">Enviar enlace</Button>

          <p className="text-center text-sm text-gray-700">
            ¿Recordaste tu contraseña?{" "}
            <Link to="/login" className="font-medium text-farm-green hover:underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
