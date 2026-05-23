import { Navigate, Outlet } from "react-router-dom";
import { getStoredAccessToken } from "../api/api.js";

/**
 * Solo para login/register: si ya hay token, no mostrar la pantalla de auth.
 */
const GuestRoute = () => {
  const token = getStoredAccessToken();
  if (token) {
    return <Navigate to="/inventory" replace />;
  }
  return <Outlet />;
};

export default GuestRoute;
