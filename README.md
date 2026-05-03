# Smart Greenhouse — Frontend

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Lucide](https://img.shields.io/badge/Lucide_React-icons-000000?logo=lucide&logoColor=white)](https://lucide.dev/)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)

**Smart Greenhouse** es el panel web para operadores de invernaderos inteligentes: monitoreo, inventario, consumo de recursos, histórico de cultivos y reportes, con una interfaz clara y **mobile-first** para uso en campo.

La especificación funcional y los contratos de API viven en **`FRONTEND_MASTER_PLAN.md`** (fuente de verdad del proyecto).

---

## Stack tecnológico

| Tecnología | Rol en el proyecto |
| :--- | :--- |
| **React 19** | UI declarativa y componentes reutilizables |
| **Vite** | Dev server rápido, HMR y build de producción |
| **Tailwind CSS v4** | Estilos con `@theme` y tokens de color (`farm-green`, etc.) |
| **Lucide React** | Iconografía consistente (sidebar, KPIs, acciones) |
| **React Router** | Rutas públicas (auth) y área privada con layout |

---

## Requisitos previos

- **Node.js** LTS (recomendado 20+)
- **npm** (incluido con Node)

---

## Instalación y ejecución

```bash
# 1. Clonar el repositorio (ajusta la URL a tu remoto)
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO/frontend

# 2. Instalar dependencias
npm install

# 3. Levantar entorno de desarrollo
npm run dev
```

Abre la URL que muestre la terminal (por defecto suele ser `http://localhost:5173`).

**Scripts útiles**

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualizar el build localmente |
| `npm run lint` | Ejecutar ESLint |

---

## Estructura del proyecto (`src/`)

El código de negocio está organizado por **módulos** bajo `src/modules/`, separando autenticación, layout del dashboard y dominio de inventario/reportes.

| Ruta | Contenido |
| :--- | :--- |
| **`src/modules/auth/`** | Páginas de **M01**: login, registro, recuperación y restablecimiento de contraseña |
| **`src/modules/layout/`** | **M08**: `DashboardLayout`, `Sidebar`, `MobileNavbar` (responsive) |
| **`src/modules/inventory/`** | **M05** y vistas relacionadas: inventario, consumo, histórico de cultivos, dashboard KPI, reportes |
| **`src/routes/`** | `AppRouter.jsx`: definición de rutas públicas y privadas |
| **`src/components/ui/`** | Kit de UI atómico (ver siguiente sección) |

---

## Kit de componentes UI

En **`src/components/ui/`** encontrarás piezas reutilizables para mantener consistencia visual:

| Componente | Uso típico |
| :--- | :--- |
| **`Button.jsx`** | Botones primarios (verde `farm-green`) y variantes vía `className` |
| **`Input.jsx`** | Campos con etiqueta, estados de error y focus accesible |
| **`Modal.jsx`** | Diálogos (overlay, cierre por fuera o con **X**), ancho cómodo en móvil |

---

## Responsabilidades — Santiago

| Módulo | Alcance implementado |
| :--- | :--- |
| **M01 — Autenticación** | Flujos de login, registro y recuperación de contraseña (UI alineada al plan; integración API pendiente según roadmap) |
| **M05 — Inventario** | Lista de insumos, modal de alta, consumo de recursos, histórico de cultivos, reportes; tablas con **card-stacking** en móvil |
| **M08 — Layout** | Shell del dashboard: sidebar colapsable en escritorio, menú hamburguesa + overlay en móvil |

---

## Estado del proyecto

- **Diseño 100% responsive (mobile-first):** navegación táctil, tablas adaptadas a tarjetas en pantallas pequeñas y modales usables en celular.
- **Datos:** varias pantallas usan mocks locales para demostración; la conexión a la API real debe seguir el contrato en `FRONTEND_MASTER_PLAN.md`.

---

## Documentación adicional

- **`FRONTEND_MASTER_PLAN.md`**: requerimientos por RF, vistas, reglas y endpoints esperados.

---

<p align="center">
  <b>Smart Greenhouse — Frontend</b><br/>
  <sub>Panel operativo para invernaderos inteligentes</sub>
</p>
