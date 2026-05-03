import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../modules/auth/pages/Login";
import Register from "../modules/auth/pages/Register";
import ForgotPassword from "../modules/auth/pages/ForgotPassword";
import ResetPassword from "../modules/auth/pages/ResetPassword";
import DashboardHome from "../modules/inventory/pages/DashboardHome";
import InventoryList from "../modules/inventory/pages/InventoryList";
import CropHistory from "../modules/inventory/pages/CropHistory";
import ResourceConsumption from "../modules/inventory/pages/ResourceConsumption";
import Reports from "../modules/inventory/pages/Reports";
import DashboardLayout from "../modules/layout/DashboardLayout";
import MonitoreoIoT from "../modules/monitoreo/MonitoreoIoT";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas Privadas con Layout (M08) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/inventory/history" element={<CropHistory />} />
          <Route path="/inventory/consumption" element={<ResourceConsumption />} />
          <Route path="/inventory/reports" element={<Reports />} />
          <Route path="/monitoreo" element={<MonitoreoIoT />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;