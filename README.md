# Smart Greenhouse — Frontend

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Lucide](https://img.shields.io/badge/Lucide_React-icons-000000?logo=lucide&logoColor=white)](https://lucide.dev/)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)

**Smart Greenhouse** es el panel web para operadores de invernaderos inteligentes: monitoreo, inventario, consumo de recursos, histórico de cultivos y reportes, con una interfaz clara y **mobile-first** para uso en campo.

La especificación funcional y los contratos de API viven en **`FRONTEND_MASTER_PLAN.md`**.

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

## Mapa de rutas (integración en `AppRouter`)

Todas las rutas privadas comparten **`DashboardLayout`** (sidebar responsive, navegación móvil). Las públicas son pantallas de autenticación sin layout.

### Rutas públicas (M01 — Autenticación)

| Ruta | Descripción |
| :--- | :--- |
| `/login` | Inicio de sesión (JWT). |
| `/register` | Registro de operador. |
| `/forgot-password` | Solicitud de recuperación de contraseña. |
| `/reset-password` | Restablecimiento de contraseña con token. |

### Área privada — Dashboard e inventario (M05 / cultivos)

| Ruta | Descripción |
| :--- | :--- |
| `/dashboard` | Home del panel: KPIs, resumen operativo y accesos rápidos al dominio del invernadero. |
| `/inventory` | Listado principal de inventario (insumos y existencias). |
| `/inventory/crops` | Gestión de cultivos: notas de operador, registro de cosecha y flujos asociados (RF-25 / RF-27). |
| `/inventory/harvest-estimation` | **Módulo de IA — Cosecha estimada (RF-26):** tabla de cultivos activos (demo o enlazada a datos), detalle por cultivo, madurez, fuente de estimación (`source`) y acción **Actualizar estimación**; contratos ampliados de IA en `FRONTEND_MASTER_PLAN.md` (secciones C y D). |
| `/inventory/consumption` | Consumo de recursos (agua, energía, insumos) por periodo o cultivo. |
| `/inventory/history` | Histórico de cultivos y ciclos anteriores. |
| `/inventory/reports` | Reportes exportables / vistas analíticas del inventario y producción. |

### Área privada — IoT (M02 / M03) y alertas

| Ruta | Descripción |
| :--- | :--- |
| `/monitoreo` | **M02 — Monitoreo IoT:** lecturas de sensores, tendencias y estado del invernadero (integración de UI; datos pueden provenir de mocks hasta conectar `GET /api/sensors/data` según plan). |
| `/control` | **M03 — Control IoT:** acciones sobre actuadores (riego, ventilación, etc.); UI integrada (envío real según `POST /api/actuators/control` en el plan). |
| `/alertas` | Alertas del sistema: listado filtrable, severidades y preferencias de notificación (RF-23 / RF-24, persistencia vía RF-34 en API). |

---

## Estructura del proyecto (`src/`)

El código está organizado por **módulos** bajo `src/modules/`, alineados con **MO1–MO8** del master plan.

| Ruta en disco | Contenido |
| :--- | :--- |
| **`src/modules/auth/`** | **M01:** login, registro, recuperación y restablecimiento de contraseña |
| **`src/modules/monitoreo/`** | **M02:** vista de monitoreo IoT |
| **`src/modules/control/`** | **M03:** panel de control de actuadores |
| **`src/modules/inventory/`** | **M05:** inventario, consumo, histórico, reportes, cultivos y cosecha estimada |
| **`src/modules/alertas/`** | Alertas y preferencias (RF-23 / RF-24) |
| **`src/modules/layout/`** | **M08:** `DashboardLayout`, `Sidebar`, `MobileNavbar` |
| **`src/routes/`** | `AppRouter.jsx`: rutas públicas y privadas |
| **`src/lib/`** | Clientes HTTP por dominio (`alertsApi`, `cropApi`, `harvestEstimationApi`) |
| **`src/components/ui/`** | Kit de UI atómico (siguiente sección) |

---

## Kit de componentes UI (`src/components/ui/`)

Piezas reutilizables para mantener consistencia visual y comportamiento en formularios y flujos modales.

| Componente | Descripción |
| :--- | :--- |
| **`Button.jsx`** | Botón accesible con estilo primario (`farm-green-dark`), hover y anillo de foco; acepta `className` para variantes secundarias o ancho auto sin perder tokens del tema. |
| **`Input.jsx`** | Campo de formulario con `label` opcional, soporte de `error` (borde y anillo rojo), estados de foco con anillo verde y tipografía legible en móvil. |
| **`Modal.jsx`** | Diálogo modal (`role="dialog"`, `aria-modal`), overlay semitransparente, cierre al pulsar fuera o con icono **X** (Lucide), contenedor `max-w-2xl` y márgenes laterales para pantallas pequeñas. |

---

## Estado del proyecto

| Módulo (plan) | Alcance en frontend | Estado |
| :--- | :--- | :--- |
| **M01 — Autenticación** | Login, Registro, Guards e Infraestructura JWT | 100% |
| **M02 — Monitoreo IoT** | Vista de sensores integrada | UI Lista / Datos Mock |
| **M03 — Control IoT** | Panel de actuadores integrado | UI Lista / Datos Mock |
| **M05 — Inventario** | Inventario, Consumo, Histórico y Cosecha Estimada | 100% |
| **M08 — Dashboard y UX** | Shell principal, Sidebar y Responsive | 100% |

- **Datos:** parte de las pantallas IoT y de demostración usan **mocks** locales; los endpoints reales deben respetar `FRONTEND_MASTER_PLAN.md`. La variable de entorno **`VITE_API_BASE_URL`** (sin barra final) es la base usada por `src/lib/*` para llamadas HTTP.

---

## API & Endpoints (IA)

Contratos del **módulo IA** en `FRONTEND_MASTER_PLAN.md` (secciones C y D), coincidentes con el desglose funcional del equipo. La ruta **`/inventory/harvest-estimation`** cubre RF-26 y es el punto de entrada en UI para estimación de cosecha; el cliente **`fetchHarvestEstimation`** en `src/lib/harvestEstimationApi.js` consume el endpoint REST de estimación por cultivo.

### Predicción ambiental y estado de planta

| Método | Endpoint | Propósito | Cuerpo / respuesta (resumen) |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/ia/predictions` | Predicciones ambientales y avisos textuales | JSON con `predicciones` (p. ej. temperatura, humedad relativa), `alerta`, `timestamp` (ver plan). |
| `GET` | `/api/ia/growth` | Estado de planta vía IA | JSON con `estado_planta` (p. ej. `saludable`, otros valores acordados con backend), `timestamp`. |

### Estimación de cosecha (RF-26, cliente en `src/lib`)

| Método | Endpoint | Cliente |
| :--- | :--- | :--- |
| `GET` | `/api/v1/crops/{crop_id}/harvest-estimation` | `fetchHarvestEstimation` en `harvestEstimationApi.js` |

**Nota:** Las rutas `/api/ia/predictions` y `/api/ia/growth` están **especificadas en el master plan** como contrato de capa IA; en esta revisión **no** hay módulos dedicados en `src/lib/` que las encapsulen (la pantalla de cosecha estimada se apoya en el GET de harvest-estimation y datos demo cuando no hay backend). Para alertas, notas, cosecha y preferencias, ver `alertsApi.js` y `cropApi.js`.

---


## 🚀 Desarrollo y Pruebas (Modo Mock)

Actualmente, el sistema de autenticación y peticiones se encuentra en **Modo Mock**. Esto permite al equipo de desarrollo trabajar en sus módulos sin dependencia directa del Backend.

### Credenciales de acceso de prueba:
| Usuario | Contraseña | Rol |
| :--- | :--- | :--- |
| `admin@admin.com` | `Admin123*` | Administrador (Mock) |

> **Nota:** Al ingresar estas credenciales, el sistema generará un token JWT simulado y permitirá el acceso a todas las rutas protegidas.## 🚀 Desarrollo y Pruebas (Modo Mock)

## 🛡️ Infraestructura y Seguridad

Se ha implementado una arquitectura de datos robusta para asegurar la integridad de la información y la sesión del usuario:

- **Cliente API (Axios):** Centralizado en `src/api/api.js`.
  - **Interceptor de Petición:** Inyecta automáticamente el Token JWT en los headers (`Authorization: Bearer <token>`).
  - **Interceptor de Respuesta:** Detecta errores `401 Unauthorized` para limpiar la sesión y redirigir al login automáticamente.
- **Route Guards:**
  - **`ProtectedRoute`:** Bloquea el acceso al Dashboard si no existe una sesión activa.
  - **`GuestRoute`:** Evita que usuarios ya logueados accedan a las páginas de Login o Registro.
- **Persistencia:** Gestión automática de `access_token` y `refresh_token` en el `localStorage`.




## Documentación adicional

- **`FRONTEND_MASTER_PLAN.md`**: requerimientos por RF, vistas, reglas y endpoints esperados.

---

<p align="center">
  <b>Smart Greenhouse — Frontend</b><br/>
  <sub>Panel operativo para invernaderos inteligentes</sub>
</p>

