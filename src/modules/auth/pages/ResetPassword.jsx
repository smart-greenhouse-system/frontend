import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      console.log("Reset password: contraseñas no coinciden");
      return;
    }

    console.log("Reset password:", formData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg">
        <div className="rounded-t-2xl bg-farm-green-dark px-8 py-6 text-white">
          <h1 className="text-3xl font-semibold">Restablecer contraseña</h1>
          <p className="mt-1 text-sm text-farm-green-light/90">
            Define una nueva contraseña para tu cuenta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
          <Input
            id="newPassword"
            name="newPassword"
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="********"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            placeholder="********"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={error}
            required
          />

          <Button type="submit">Cambiar contraseña</Button>

          <p className="text-center text-sm text-gray-700">
            Volver a{" "}
            <Link to="/login" className="font-medium text-farm-green hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
