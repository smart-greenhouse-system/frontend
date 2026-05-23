import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GuestRoute from "../components/GuestRoute";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../modules/auth/pages/Login";
import Register from "../modules/auth/pages/Register";
import ForgotPassword from "../modules/auth/pages/ForgotPassword";
import ResetPassword from "../modules/auth/pages/ResetPassword";
import InventoryList from "../modules/inventory/pages/InventoryList";
import DashboardLayout from "../modules/layout/DashboardLayout";
import MonitoreoIoT from "../modules/monitoreo/MonitoreoIoT";
import Control from "../modules/control/Control";
import Config from "../modules/config/Config";
import Alertas from "../modules/alertas/Alertas";
import DeviceList from "../modules/devices/pages/DeviceList";
import PrediccionesIA from "../modules/predicciones/PrediccionesIA";
import NotFound from "../modules/error/NotFound";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login / Register: invitados; si ya hay sesión → /inventory */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas privadas: exigen token; luego layout del dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/inventory" replace />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/monitoreo" element={<MonitoreoIoT />} />
            <Route path="/dispositivos" element={<DeviceList />} />
            <Route path="/control" element={<Control />} />
            <Route path="/predicciones" element={<PrediccionesIA />} />
            <Route path="/config" element={<Config />} />
            <Route path="/alertas" element={<Alertas />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
