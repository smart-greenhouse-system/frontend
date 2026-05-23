import { NavLink } from "react-router-dom";
// 1. IMPORTAMOS LA FUNCIÓN DE LOGOUT (Verifica que la ruta sea correcta según tu carpeta)
import { logout } from "../../../api/authService"; 
import {
  Boxes,
  UsersRound,
  LogOut,
  Sprout,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  SlidersHorizontal,
  Bell,
  Settings,
  Radio,
} from "lucide-react";

const mainLinks = [
  { to: "/monitoreo", label: "Monitoreo IoT", icon: Activity },
  { to: "/dispositivos", label: "Dispositivos", icon: Radio },
  { to: "/control", label: "Control", icon: SlidersHorizontal },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/inventory", label: "Inventario", icon: Boxes },
];

const secondaryLinks = [
  { to: "/config", label: "Configuración", icon: Settings },
  { to: "/users", label: "Usuarios", icon: UsersRound },
];

const SidebarLink = ({ to, label, Icon, collapsed = false, onNavigate }) => (
  <NavLink
    to={to}
    end={to === "/inventory"}
    onClick={onNavigate}
    className={({ isActive }) =>
      [
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-farm-green-light/80",
        isActive
          ? "bg-farm-green text-white shadow-sm"
          : "text-farm-green-light/90 hover:bg-farm-green hover:text-white",
      ].join(" ")
    }
  >
    <Icon className="h-4 w-4 shrink-0" />
    {!collapsed && <span>{label}</span>}
  </NavLink>
);

const SidebarContent = ({ collapsed = false, onNavigate, onToggleCollapse, isMobile = false }) => {
  
  // 2. CREAMOS LA FUNCIÓN QUE MANEJA EL CLICK
  const handleLogoutClick = () => {
    if (window.confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      logout();
    }
  };

  return (
    <>
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-farm-green/40 px-3 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-farm-green text-white">
          <Sprout className="h-5 w-5" />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">SmartGreenHouse</p>
            <p className="truncate text-xs text-farm-green-light/80">M08 Layout</p>
          </div>
        )}

        {!isMobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg p-2 text-farm-green-light/90 transition hover:bg-farm-green hover:text-white"
            aria-label={collapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-2">
        {mainLinks.map(({ to, label, icon }) => (
          <SidebarLink
            key={to}
            to={to}
            label={label}
            Icon={icon}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}

        {!collapsed && (
          <p className="px-2 pt-4 text-xs uppercase tracking-wide text-farm-green-light/60">
            Gestión
          </p>
        )}
        {secondaryLinks.map(({ to, label, icon }) => (
          <SidebarLink
            key={to}
            to={to}
            label={label}
            Icon={icon}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* 3. AÑADIMOS EL onClick AL BOTÓN DE CERRAR SESIÓN */}
      <button
        type="button"
        onClick={handleLogoutClick}
        className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-farm-green-light/90 transition-colors hover:bg-red-600 hover:text-white"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Cerrar Sesión</span>}
      </button>
    </>
  );
};

const Sidebar = ({ isCollapsed, isMobileOpen, onCloseMobile, onToggleCollapse }) => {
  return (
    <>
      {isMobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      ) : null}

      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-farm-green-dark/40 bg-farm-green-dark px-3 py-4 transition-transform duration-200 lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-farm-green-light/90 transition hover:bg-farm-green hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent onNavigate={onCloseMobile} isMobile />
      </aside>

      <aside
        className={[
          "fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-farm-green-dark/40 bg-farm-green-dark px-3 py-4 lg:flex",
          isCollapsed ? "w-24" : "w-72",
        ].join(" ")}
      >
        <SidebarContent collapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
      </aside>
    </>
  );
};

export default Sidebar;

