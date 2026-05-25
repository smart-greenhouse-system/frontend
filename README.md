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
┌──────────────────────────────────────────────────────────────────────┐
│                          Frontend                                     │
│          React 19 · Vite 8 · Tailwind v4 · Recharts 3.8             │
│                                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │ Auth     │  │ services/    │  │ Modules (9 dominios)         │  │
│  │ Guards   │  │ (8 APIs)     │  │  dashboard  monitoreo   ia   │  │
│  └────┬─────┘  └──────┬───────┘  │  dispositivos control    │  │
│       └───────────────┼──────────│  predicciones  alertas    │  │
│                       │          │  inventory    config       │  │
│                       │          └──────────────────────────────┘  │
│                       │ Axios                                       │
│                ┌──────┴──────┐                                      │
│                │ Interceptor │                                      │
│                │ JWT Bearer  │                                      │
│                └──────┬──────┘                                      │
└───────────────────────┼──────────────────────────────────────────────┘
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
   - `GuestRoute`: si el usuario ya tiene sesión activa, redirige a **`/monitoreo`** (destino post‑login predeterminado).

---

## Navegación Centro de Comando

### Selector de Nodos Integrado

El módulo de Monitoreo IoT (`MonitoreoIoT.jsx`) incorpora un **Selector de Nodos** tipo pill/cápsula en la parte superior del dashboard. Cada nodo disponible se muestra como un botón con:

- **Indicador de conexión**: círculo verde (`bg-green-500`) si `estado === "ONLINE"`, rojo (`bg-red-400`) si está `OFFLINE`.
- **Estado activo**: el nodo seleccionado se resalta con `bg-farm-green-dark text-white`.
- **Scroll horizontal**: en móviles, los pills se deslizan horizontalmente sin romper el layout.

```
┌──────────────────────────────────────────────────────────┐
│  Nodos   [● Nodo 1]  [● Nodo 2]  [○ Nodo 3]             │
│           └─ activo ─┘                                   │
└──────────────────────────────────────────────────────────┘
```

**Instantaneidad**: al hacer clic en un pill, se actualiza el `searchParam` `deviceId` en la URL y el dashboard se reconstruye al instante con los sensores, gráficas y actuadores del nodo seleccionado — sin recarga de página.

### Flujo de Inicio Post‑Login

El primer enlace del sidebar es `/monitoreo`. Tras el login, `GuestRoute` redirige automáticamente a `/monitoreo`, donde el sistema:
1. Obtiene la lista de dispositivos via `GET /api/devices`.
2. Selecciona el **primer dispositivo disponible** como predeterminado.
3. Inicia el polling de lecturas cada 15 segundos.

```
Login ──▶ /monitoreo ──▶ GET /api/devices ──▶ auto‑select device_1
                        ──▶ GET /api/sensors/latest ──▶ render cards + charts
                        ──▶ setInterval(15s) ──▶ polling silencioso
```

---

## Arquitectura Hardware‑Driven

### Espejo del Hardware Físico

La interfaz de Monitoreo IoT es ahora un **espejo exacto del hardware físico**. El backend almacena las lecturas en un `Map<String, Double>` dinámico — sin esquema fijo. El frontend:

1. Lee las llaves reales del `sensores` del payload del nodo seleccionado.
2. Normaliza mediante `KEY_ALIASES` en `src/services/sensorApi.js`.
3. **Solo renderiza tarjetas y gráficas para las llaves presentes con valor numérico**.

```
Nodo 1 (hardware real)          Frontend renderizado
┌──────────────────────┐       ┌──────────────────┐
│ temperatura: 28.5    │──▶    │ Tarjeta Temp  °C │
│ humedad_suelo: 45   │──▶    │ Tarjeta Hum Suelo│
└──────────────────────┘       └──────────────────┘
                               (NO se renderiza
                                Humedad Relativa
                                ni Iluminación)

Nodo 2 (hardware real)          Frontend renderizado
┌──────────────────────┐       ┌──────────────────┐
│ luz: 1200            │──▶    │ Tarjeta Iluminac │
│ temperatura: 30.1    │──▶    │ Tarjeta Temp  °C │
└──────────────────────┘       └──────────────────┘
                               (NO se renderiza
                                Humedad Suelo
                                ni Humedad Relativa)
```

| Variable canónica | Unidad | Alias aceptados en backend |
|---|---|---|
| `temperatura` | °C | temperatura, temperature, temp |
| `humedad_relativa` | % | humedad_relativa, humedad, humedad_aire, hr, humidity |
| `humedad_suelo` | % | humedad_suelo, soil_moisture, humidity_soil, hum_suelo, moisture |
| `iluminacion` | lux | iluminacion, luz, light, illuminance, lux |

**Sensores desconocidos**: cualquier llave en el `Map<String, Double>` que no coincida con un alias conocido se renderiza automáticamente con el `FALLBACK_CONFIG` (ícono `Activity`, gradiente slate), logrando un sistema **agnóstico a nuevos tipos de sensores** sin modificar el código.

### Jerarquía Device → Sensors → Actuators

```
┌─────────────────────────────────────────────────────┐
│                     Monitoreo IoT                     │
│                                                       │
│  ┌── Selector de Nodos (pills) ──────────────────┐  │
│  │  [● Nodo 1]  [● Nodo 2]                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                       │
│  ┌── Info Bar ────────────────────────────────────┐  │
│  │  Nodo 1 · estado: ONLINE · sensores: 2         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                       │
│  ┌── Sensor Cards (grid dinámico) ───────────────┐  │
│  │  ┌──────────┐  ┌──────────┐                    │  │
│  │  │ Temp 28°C│  │ Hum 45%  │                    │  │
│  │  └──────────┘  └──────────┘                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                       │
│  ┌── History Charts (grid dinámico) ─────────────┐  │
│  │  ┌──────────┐  ┌──────────┐                    │  │
│  │  │  Temp    │  │  Hum     │                    │  │
│  │  │ gráfica  │  │ gráfica  │                    │  │
│  │  └──────────┘  └──────────┘                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                       │
│  ┌── Actuadores Asociados ───────────────────────┐  │
│  │  ┌──────────┐  ┌──────────┐                    │  │
│  │  │ Riego ON │  │ Ventil.  │                    │  │
│  │  └──────────┘  └──────────┘                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Polling en Tiempo Real

El dashboard refresca lecturas cada **15 segundos** con un indicador visual sutil (punto pulsante verde + "Actualizando…"), sin interrumpir la interacción del usuario. El botón "Actualizar" permite un refresh manual inmediato.

---

## Lógica de Gráficas Inteligentes

Cada sensor tiene su propio gráfico de historial con:

- **Escala independiente**: eje Y con dominio calculado mediante el algoritmo `niceDomain`, que redondea los límites al múltiplo del `step` más cercano, asegurando escalas limpias sin decimales innecesarios.

```
Ejemplo niceDomain:
  valores = [22.3, 25.7, 28.1, 24.9]
  step = 5
  → dominio [20, 30]  (en lugar de [22.3, 28.1])
```

- **Regla de visualización ≥2**: Solo se genera una gráfica si el sensor existe en el nodo actual **Y** tiene al menos **2 puntos de datos numéricos** en el historial. Esto elimina gráficas vacías o líneas de un solo punto sin valor informativo.

- **Sincronización con tarjetas**: Las gráficas se renderizan usando la misma `sensorKeys` que las tarjetas superiores, garantizando que sean un **espejo exacto** — ni una gráfica más, ni una menos.

- **Claves desconocidas**: Cualquier sensor nuevo (ej. `co2`, `ph`) detectado en el historial genera automáticamente una gráfica con color gris (`#9ca3af`) y etiqueta formateada.

---

## Módulo de IA y Alertas

### Análisis de Imagen IA

El sistema de IA expone dos endpoints consumidos por `ResultadosIA` (`/ia`) y `PrediccionesIA` (`/predicciones`):

```
GET /api/predictions/latest-image-analysis   → último análisis disponible
GET /api/predictions/image-analysis          → historial completo
POST /api/predictions                        → crear nueva predicción
```

**Fix de métricas de confianza**: El normalizador `normalizeImageAnalysis` en `src/services/predictionApi.js` unifica el formato de confianza que puede llegar como decimal (`0.85`) o porcentaje (`85`):

```
confianzaRaw ≤ 1  →  confianzaRaw * 100   (decimal a porcentaje)
confianzaRaw > 1  →  confianzaRaw         (ya está en porcentaje)
```

El resultado siempre se muestra como porcentaje entero (`confianza: 85`), independientemente del formato original del backend.

### Módulo de Alertas

El módulo de Alertas (`Alertas.jsx`) consume `GET /api/actuator-events` y aplica un **mapeo de severidad basado en el origen** del evento:

| Origen (`origin`) | Severidad | Color UX |
|---|---|---|
| `IA` | `advertencia` | Ámbar |
| `IOT` | `info` | Azul |
| `CONFIRMATION` | `info` | Azul |
| `MANUAL` | `sistema` | Gris |
| `fail` / `error` / `crit` | `peligro` | Rojo |

**Paginación inteligente 20‑en‑20**: La carga inicial muestra **20 eventos**. Un botón "Ver más historial (N restantes)" permite expandir progresivamente en bloques de 20. Los IDs de eventos leídos se persisten en `localStorage` mediante un `Set<string>` (`alertas_leidas`).

**Marcar todas como leídas**: Botón que agrega todos los IDs visibles (incluyendo los paginados pero no cargados) al set de leídas en una sola acción. Al recargar la página, los eventos previamente marcados aparecen con estilo atenuado (`opacity-60`).

---

## Sistema de Rutas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Navigate → /dashboard` | Redirección automática al dashboard general |
| `/dashboard` | `DashboardHome` | Vista consolidada con KPI cards, tendencia, últimas alertas y accesos directos |
| `/monitoreo` | `MonitoreoIoT` | Sensores en tiempo real con auto‑refresh, selector de nodos pill, gráficas de historial dinámicas |
| `/ia` | `ResultadosIA` | Análisis de imagen IA, historial en tabla, formulario de ejecución de análisis |
| `/predicciones` | `PrediccionesIA` | Último análisis destacado + grid de historial + formulario de predicción con selección de actuador |
| `/dispositivos` | `DeviceList` | Catálogo de dispositivos con buscador y estado online/offline |
| `/control` | `Control` | CRUD de actuadores, selector por dispositivo, ejecución ON/OFF con feedback, historial de eventos |
| `/alertas` | `Alertas` | Historial de eventos con severidad mapeada, filtros, paginación 20‑en‑20, "Marcar todas como leídas" |
| `/inventory` | `InventoryList` | CRUD de insumos con buscador y umbral de stock bajo |
| `/config` | `Config` | Configuración del invernadero (nombre, modo automático, frecuencia IA) |

**Rutas públicas**: `/login`, `/register`. **Ruta catch-all**: `*` → página 404 personalizada.

> **Home oficial**: `/monitoreo` — es el primer enlace del sidebar y el destino de `GuestRoute` post‑login. Incluye auto‑selección del primer dispositivo disponible.

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
| **Navegación Centro de Comando** | Selector de nodos tipo pill/cápsula con indicador Online/Offline, scroll horizontal en móviles, cambio instantáneo de contexto vía searchParams |
| **Arquitectura Hardware‑Driven** | Dashboard es espejo exacto del hardware: solo renderiza tarjetas y gráficas de los sensores que el nodo realmente posee |
| **Gráficas inteligentes** | `niceDomain` para ejes Y redondeados; regla ≥2 puntos de datos para evitar gráficas vacías; colores consistentes entre tarjetas y gráficas |
| **Feedback real de actuadores** | El módulo `Control` muestra indicadores visuales de resultado tras ejecutar un comando ON/OFF: `CheckCircle2` (verde) para éxito, `XCircle` (rojo) para error, con mensaje del backend |
| **Refresh silencioso** | Polling a 15s con animación de ping pulsante + "Actualizando…" sin interrumpir la interacción del usuario |
| **Sidebar colapsable** | Barra lateral con modo compacto (iconos solamente) para maximizar espacio en pantalla, con persistencia de estado |
| **Modo automático con advertencia** | La página de Config muestra una advertencia visual explícita al activar el modo automático del invernadero |
| **Paginación inteligente en alertas** | Carga 20 eventos; expande progresivamente con "Ver más"; "Marcar todas como leídas" persiste en localStorage |

---

## Estructura del Proyecto (`src/`)

```
src/
├── api/                            # Cliente Axios con interceptores JWT
│   ├── api.js                      # Instancia axios, interceptores, normalizeError
│   └── authService.js              # login, register, logout, persistAuthSession
├── services/                       # 8 módulos API (uno por dominio backend)
│   ├── sensorApi.js                # Lecturas de sensores + KEY_ALIASES + normalizeSensorEntry
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

## Sincronización Backend‑Frontend

Cada archivo en `src/services/` se corresponde 1:1 con un controlador Java del backend:

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

> **⚠️ El backend está alojado en una instancia gratuita de Render.** En el primer request tras un período de inactividad, el servidor tarda aproximadamente **60 segundos en "despertar"** (Cold Start). Las peticiones posteriores responden en tiempo real.

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
