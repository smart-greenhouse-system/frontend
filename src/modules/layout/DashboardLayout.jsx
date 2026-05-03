import { useState } from "react";
import { Outlet } from "react-router-dom";
import MobileNavbar from "./components/MobileNavbar";
import Sidebar from "./components/Sidebar";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-farm-green-light/40">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={[
          "min-h-screen transition-all lg:duration-200",
          isSidebarCollapsed ? "lg:ml-24" : "lg:ml-72",
        ].join(" ")}
      >
        <MobileNavbar onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="overflow-auto p-4 sm:p-6">
        <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
