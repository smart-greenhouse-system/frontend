# SmartGreenHouse — Frontend

[![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Axios](https://img.shields.io/badge/Axios_1.16-5A29E4?logo=axios&logoColor=white)](https://axios-http.com/)
[![React Router](https://img.shields.io/badge/React_Router_7-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Recharts](https://img.shields.io/badge/Recharts_3.8-22B5BF?logo=recharts&logoColor=white)](https://recharts.org/)
[![Lucide](https://img.shields.io/badge/Lucide_1.14-F56565?logo=lucide&logoColor=white)](https://lucide.dev/)
[![License](https://img.shields.io/badge/License-MIT-3DA639)](#)

Panel web para operadores de invernaderos inteligentes. Consume **20+ endpoints REST** de un backend Java Spring Boot con arquitectura hexagonal. Incluye monitoreo IoT en tiempo real con polling automático, control de actuadores con feedback de ejecución, análisis predictivo con IA, alertas inteligentes con mapeo de severidad, inventario de insumos y configuración del invernadero — todo sincronizado con una API real sin datos mock.

---

## Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                          Frontend                                 │
│          React 19 · Vite 8 · Tailwind v4 · Recharts 3.8         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────────┐  │
│  │ Auth     │  │ lib/     │  │ Modules (9 dominios)         │  │
│  │ Guards   │  │ (8 APIs) │  │  dashboard  monitoreo   ia   │  │
│  └────┬─────┘  └────┬─────┘  │  dispositivos control    │  │
│       └─────────────┼────────│  predicciones  alertas    │  │
│                     │        │  inventory    config       │  │
│                     │        └──────────────────────────────┘  │
│                     │ Axios                                     │
│              ┌──────┴──────┐                                    │
│              │ Interceptor │                                    │
│              │ JWT Bearer  │                                    │
│              └──────┬──────┘                                    │
└─────────────────────┼────────────────────────────────────────────┘
                      │ HTTPS
             ┌────────┴────────────┐
             │  Backend (Render)   │
             │  Spring Boot 3 +    │
             │  JPA + MongoDB      │
             └─────────────────────┘
```

Cada módulo del frontend está **espejado 1:1** con un controlador Java del backend. Los DTOs JavaScript (`@typedef`) reflejan exactamente los campos de los `*Response.java`, garantizando que el contrato de datos sea idéntico en ambas capas.

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | 19.2.5 | UI declarativa con componentes funcionales y hooks |
| **Vite** | 8.0.10 | Dev server con HMR y build de producción optimizado |
| **Tailwind CSS** | 4.2.4 | Estilos utilitarios con tokens de color personalizados (tema farm) |
| **Axios** | 1.16.0 | Cliente HTTP con interceptores de petición/respuesta y JWT Bearer |
| **React Router** | 7.14.2 | Enrutamiento declarativo con layout anidado, guards y search params |
| **Recharts** | 3.8.1 | Gráficas de líneas con escalas independientes por variable |
| **Lucide React** | 1.14.0 | Iconografía consistente en sidebar, tarjetas y botones |

---

## Seguridad y Autenticación

El flujo de seguridad está centralizado en `src/api/api.js` y `src/api/authService.js`:

1. **Login**: `POST /auth/login` devuelve `{ accessToken, tokenType, expiresIn }`.
2. **Persistencia**: `persistAuthSession()` normaliza el campo `accessToken` a la clave `"token"` en `localStorage`.
3. **Interceptor de petición**: Cada request inyecta automáticamente `Authorization: Bearer <token>` vía Axios interceptor.
4. **Interceptor de respuesta**: Si el backend responde con `401`, se limpia la sesión y se redirige a `/login`.
5. **Route Guards**:
   - `ProtectedRoute`: bloquea el acceso si no hay token — redirige a `/login`.
   - `GuestRoute`: si el usuario ya tiene sesión activa, redirige a **`/monitoreo`** (no a `/inventory`).

---

## Arquitectura de Sensores (Map<String, Double>)

El backend almacena las lecturas de sensores en un `Map<String, Double>` dinámico — no hay campos fijos. El frontend normaliza estas keys mediante `KEY_ALIASES` en `src/lib/sensorApi.js`, que mapea múltiples nombres posibles a 4 variables canónicas:

| Variable | Unidad | Alias aceptados |
|---|---|---|
| `temperatura` | °C | temperatura, temperature, temp |
| `humedad_relativa` | % | humedad_relativa, humedad, humedad_aire, hr, humidity |
| `humedad_suelo` | % | humedad_suelo, soil_moisture, humidity_soil, hum_suelo, moisture |
| `iluminacion` | lux | iluminacion, luz, light, illuminance, lux |

**Arquitectura agnóstica de sensores**: El dashboard de Monitoreo IoT detecta **automáticamente cualquier llave nueva** del `Map<String, Double>` del backend que no tenga un alias conocido. Estas llaves desconocidas se renderizan como tarjetas adicionales y gráficas de historial dinámicas, sin requerir cambios en el código del frontend.

```
Backend Map<String, Double>          Frontend
┌─────────────────────┐             ┌─────────────────────┐
│ "temperature": 25.4 │  ──axios──▶ │ temperatura  → Card │
│ "humidity":   68.2  │  ──axios──▶ │ humedad_r.   → Card │
│ "soil_moist": 45.0 │  ──axios──▶ │ humedad_suelo→ Card │
│ "light":     1200   │  ──axios──▶ │ iluminacion  → Card │
│ "co2":        410   │  ──axios──▶ │ co2   → Card (auto) │ ← dinámico
│ "ph":          6.8  │  ──axios──▶ │ ph    → Card (auto) │ ← dinámico
└─────────────────────┘             └─────────────────────┘
```

**Polling**: El dashboard de Monitoreo IoT refresca lecturas cada **15 segundos** con un indicador visual sutil (punto pulsante + "Actualizando…"), sin recargar la interfaz completa.

---

## Sistema de Rutas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Navigate → /dashboard` | Redirección automática al dashboard general |
| `/dashboard` | `DashboardHome` | Vista consolidada con KPI cards, tendencia, últimas alertas y accesos directos |
| `/monitoreo` | `MonitoreoIoT` | Sensores en tiempo real con auto‑refresh, selector de dispositivo, 4+ gráficas de historial |
| `/ia` | `ResultadosIA` | Análisis de imagen IA, historial en tabla, formulario de ejecución de análisis |
| `/predicciones` | `PrediccionesIA` | Último análisis destacado + grid de historial + formulario de predicción con selección de actuador |
| `/dispositivos` | `DeviceList` | Catálogo de dispositivos con buscador y estado online/offline |
| `/control` | `Control` | CRUD de actuadores, selector por dispositivo, ejecución ON/OFF con feedback, historial de eventos |
| `/alertas` | `Alertas` | Historial de eventos con severidad mapeada, filtros, paginación 20‑en‑20 |
| `/inventory` | `InventoryList` | CRUD de insumos con buscador y umbral de stock bajo |
| `/config` | `Config` | Configuración del invernadero (nombre, modo automático, frecuencia IA) |

**Rutas públicas**: `/login`, `/register`. **Ruta catch-all**: `*` → página 404 personalizada.

> **Home oficial**: `/monitoreo` — es el primer enlace del sidebar y el destino de `GuestRoute` post‑login. Incluye auto‑selección del primer dispositivo disponible al cargar.

---

## Lógica de Alertas Inteligente

El módulo de Alertas (`src/modules/alertas/Alertas.jsx`) consume `GET /api/actuator-events` y aplica un **mapeo de severidad basado en el origen** del evento:

| Origen (`origin`) | Severidad asignada | Color UX |
|---|---|---|
| `IA` | `advertencia` | Ámbar |
| `IOT` | `info` | Azul |
| `CONFIRMATION` | `info` | Azul |
| `MANUAL` | `sistema` | Gris |
| *fallback* | `info` | Azul |

Además, cualquier evento con `status/event_type` conteniendo `fail`, `error` o `crit` se clasifica como **`peligro`** (rojo), independientemente del origen.

**Paginación**: La vista inicial carga **20 eventos**. Un botón "Ver más historial (N restantes)" permite expandir progresivamente. Los eventos leídos se persisten en `localStorage` mediante un `Set` de IDs (`alertas_leidas`), con opción "Marcar todas como leídas".

---

## Sincronización de IA

### Flujo de análisis de imagen

El sistema de IA expone dos endpoints consumidos por los módulos `ResultadosIA` (`/ia`) y `PrediccionesIA` (`/predicciones`):

```
GET /api/predictions/latest-image-analysis   → último análisis disponible
GET /api/predictions/image-analysis          → historial completo
POST /api/predictions                        → crear nueva predicción
```

**Fix de métricas de confianza**: El normalizador `normalizeImageAnalysis` en `src/lib/predictionApi.js` unifica el formato de confianza que puede llegar como decimal (0.85) o porcentaje (85). Si el valor es `≤ 1`, se multiplica por 100 automáticamente. El resultado siempre se muestra como porcentaje entero (`confianza: 85`).

### Diferencia entre `/ia` y `/predicciones`

- **`/ia`** → `ResultadosIA`: Panel con formulario para ejecutar análisis, `PredictionInsightsPanel` con la última predicción destacada, y tabla de historial completo (`created_at`, `cultivo`, `device_id`, `estado_planta`, `confianza`, `tiempo_cosecha_dias`, `success`).
- **`/predicciones`** → `PrediccionesIA`: Muestra el último análisis en `AnalysisCard` formato featured, grid de historial, y formulario de predicción que permite crear una nueva programación (dispositivo + actuador + tiempo OFF automático en segundos).

---

## Programación Defensiva

El sistema está diseñado para manejar datos inesperados y fallos del servidor sin romperse:

| Estrategia | Implementación |
|---|---|
| **Partial failure** | `DashboardHome` usa `Promise.allSettled()` — si un endpoint falla, el resto de la UI sigue funcionando |
| **Guard de ciclo de vida** | `mountedRef` pattern evita `setState` en componentes desmontados (cancelación de efectos) |
| **Normalización defensiva** | `normalizeSensorEntry()`, `normalizeImageAnalysis()`, `normalizeActuatorEvent()` retornan `null` ante datos inválidos, nunca lanzan excepción |
| **Fallback arrays** | Todo `fetch` castea `data` con `Array.isArray(data) ? data : []` para evitar `.map()` sobre `undefined` |
| **Try/catch universal** | Cada llamada API está envuelta en `try/catch` con mensaje de error informativo al usuario |
| **Empty states** | Cada módulo tiene estado vacío explícito ("Sin lecturas", "Sin historial", etc.) en lugar de pantallas en blanco |

---

## UX Industrial

| Característica | Detalle |
|---|---|
| **Gráficas independientes por escala** | Cada sensor (temperatura, humedad suelo, humedad relativa, iluminación) tiene su propio gráfico con eje Y con dominio calculado dinámicamente (`niceDomain`). Las variaciones en una escala no opacan movimientos en otra. |
| **Feedback real de actuadores** | El módulo `Control` muestra indicadores visuales de resultado tras ejecutar un comando ON/OFF: `CheckCircle2` (verde) para éxito, `XCircle` (rojo) para error, con mensaje del backend. |
| **Indicador online/offline** | Barra de info del dispositivo en Monitoreo IoT con `Wifi`/`WifiOff`, badge de color verde/rojo, y timestamp de última lectura. |
| **Refresh silencioso** | Polling a 15s con animación de ping pulsante + "Actualizando…" sin interrumpir la interacción del usuario. |
| **Sidebar colapsable** | Barra lateral con modo compacto (iconos solamente) para maximizar espacio en pantalla, con persistencia de estado. |
| **Modo automático con advertencia** | La página de Config muestra una advertencia visual explícita al activar el modo automático del invernadero. |

---

## Estructura del Proyecto (`src/`)

```
src/
├── api/                            # Cliente Axios con interceptores JWT
│   ├── api.js                      # Instancia axios, interceptores, normalizeError
│   └── authService.js              # login, register, logout, persistAuthSession
├── lib/                            # 8 módulos API (uno por dominio backend)
│   ├── sensorApi.js                # Lecturas de sensores + normalización KEY_ALIASES
│   ├── deviceApi.js                # Catálogo de dispositivos
│   ├── actuatorApi.js              # Actuadores CRUD + execute + events
│   ├── actuatorEventsApi.js        # Eventos de actuadores con normalización
│   ├── predictionApi.js            # Predicciones y análisis IA (imagen)
│   ├── inventoryApi.js             # Inventario de insumos
│   ├── configApi.js                # Configuración del invernadero
│   └── eventoApi.js                # Eventos (fuente de alertas)
├── modules/                        # Módulos funcionales del dashboard
│   ├── auth/pages/                 # Login, Register
│   ├── dashboard/                  # DashboardHome + TemperatureTrendChart
│   ├── monitoreo/                  # MonitoreoIoT + SensorCard + SensorHistoryChart
│   ├── ia/                         # ResultadosIA + PredictionInsightsPanel
│   ├── predicciones/               # PrediccionesIA + AnalysisCard
│   ├── devices/                    # DeviceList + DeviceCard
│   ├── control/                    # Control (CRUD + ejecución + historial)
│   ├── alertas/                    # Alertas (eventos con severidad mapeada)
│   ├── inventory/                  # InventoryList
│   ├── config/                     # Configuración del invernadero
│   ├── layout/                     # DashboardLayout + Sidebar + MobileNavbar
│   └── error/                      # NotFound (página 404)
├── components/                     # UI Kit atómico y guards
│   ├── ui/                         # Button, Input, Modal
│   ├── GuestRoute.jsx              # Redirige a /monitoreo si hay sesión activa
│   └── ProtectedRoute.jsx          # Redirige a /login si no hay token
├── routes/
│   └── AppRouter.jsx               # Definición de todas las rutas
├── App.jsx                         # Punto de entrada de la aplicación
└── main.jsx                        # Mount point de React
```

---

## Sincronización Backend-Frontend

Cada archivo en `src/lib/` se corresponde 1:1 con un controlador Java del backend:

| Archivo frontend | Controller Java | Endpoint base |
|---|---|---|
| `sensorApi.js` | `SensorController` | `/api/sensors` |
| `deviceApi.js` | `DeviceController` | `/api/devices` |
| `actuatorApi.js` | `ActuatorController` | `/api/actuators` |
| `actuatorEventsApi.js` | `ActuatorEventController` | `/api/actuator-events` |
| `predictionApi.js` | `PredictionController` | `/api/predictions` |
| `inventoryApi.js` | `InventoryController` | `/api/inventory` |
| `configApi.js` | `GreenhouseConfigController` | `/api/config` |
| `eventoApi.js` | `ActuatorEventController` | `/api/actuator-events` |
| `authService.js` | `AuthController` | `/auth` |

Los tipos JSDoc (`@typedef`) replican exactamente los campos de los DTOs Java (`@JsonProperty`), asegurando que cualquier cambio en el backend se refleje como error de tipo en el frontend durante el desarrollo.

---

## Instalación y Configuración

### Requisitos

- **Node.js** 20+ (LTS recomendado)
- **npm** (incluido con Node.js)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variable de entorno
echo "VITE_API_URL=https://smart-greenhouse-backend-ec00.onrender.com" > .env
```

> **⚠️ El backend está alojado en una instancia gratuita de Render.** En el primer request tras un período de inactividad, el servidor tarda aproximadamente **60 segundos en "despertar"**. Las peticiones posteriores responden en tiempo real.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR (http://localhost:5173) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualizar el build localmente |
| `npm run lint` | Ejecutar ESLint |

---

## Documentación Adicional

- **`FRONTEND_MASTER_PLAN.md`**: Contrato oficial de datos por módulo, especificación de endpoints, estructura de errores y estrategia de migración.

---

<p align="center">
  <b>SmartGreenHouse — Frontend</b><br/>
  <sub>Panel operativo para invernaderos inteligentes con React 19 y Java Spring Boot</sub>
</p>
