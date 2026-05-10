import { Navigate, Outlet } from "react-router-dom";
import { getStoredAccessToken } from "../api/api.js";

/**
 * Exige sesión: si no hay access token (ni claves legacy compatibles), redirige a /login.
 */
const ProtectedRoute = () => {
  const token = getStoredAccessToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
