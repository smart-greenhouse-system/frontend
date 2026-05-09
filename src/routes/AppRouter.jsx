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
import CropManagement from "../modules/inventory/pages/CropManagement";
import HarvestEstimation from "../modules/inventory/pages/HarvestEstimation";
import DashboardLayout from "../modules/layout/DashboardLayout";
import MonitoreoIoT from "../modules/monitoreo/MonitoreoIoT";
import Control from "../modules/control/Control";
import Alertas from "../modules/alertas/Alertas";

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
          <Route path="/inventory/crops" element={<CropManagement />} />
          <Route path="/inventory/harvest-estimation" element={<HarvestEstimation />} />
          <Route path="/inventory/history" element={<CropHistory />} />
          <Route path="/inventory/consumption" element={<ResourceConsumption />} />
          <Route path="/inventory/reports" element={<Reports />} />
          <Route path="/monitoreo" element={<MonitoreoIoT />} />
          <Route path="/control" element={<Control />} />
          <Route path="/alertas" element={<Alertas />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;