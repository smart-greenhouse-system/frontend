# SmartGreenHouse — Frontend

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Axios](https://img.shields.io/badge/Axios-1.16-5A29E4?logo=axios&logoColor=white)](https://axios-http.com/)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Recharts](https://img.shields.io/badge/Recharts-3.8-22B5BF?logo=recharts&logoColor=white)](https://recharts.org/)

Panel web para operadores de invernaderos inteligentes. Consume 20 endpoints REST de un backend Java Spring Boot con arquitectura hexagonal. Incluye monitoreo IoT en tiempo real, control de actuadores, análisis predictivo con IA, inventario de insumos y configuración del invernadero — todo sincronizado con una API real sin datos mock.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                             │
│  React 19 · Vite 8 · Tailwind v4 · Recharts 3.8        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐ │
│  │ Auth     │  │ Lib/     │  │ UI Kit │  │ Modules/ │ │
│  │ Guards   │  │ (7 APIs) │  │ Atoms  │  │  7 mod.  │ │
│  └────┬─────┘  └────┬─────┘  └────────┘  └────┬─────┘ │
│       └─────────────┼─────────────────────────┘       │
│                     │ Axios                            │
│              ┌──────┴──────┐                           │
│              │ Interceptor │                           │
│              │ JWT Bearer  │                           │
│              └──────┬──────┘                           │
└─────────────────────┼───────────────────────────────────┘
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
| **React** | 19 | UI declarativa y componentes reutilizables |
| **Vite** | 8 | Dev server con HMR y build de producción |
| **Tailwind CSS** | 4 | Estilos utilitarios con tokens de color personalizados |
| **Axios** | 1.16 | Cliente HTTP con interceptores de petición/respuesta |
| **React Router** | 7 | Enrutamiento declarativo con layout anidado y guards |
| **Recharts** | 3.8 | Gráficas de líneas para historial de sensores (4 independientes) |
| **Lucide React** | 1.14 | Iconografía consistente en sidebar, tarjetas y acciones |

---

## Seguridad y Autenticación

El flujo de seguridad está centralizado en `src/api/api.js` y `src/api/authService.js`:

1. **Login**: `POST /auth/login` devuelve `{ accessToken, tokenType, expiresIn }`.
2. **Persistencia**: `persistAuthSession()` normaliza el campo `accessToken` a la clave `"token"` en `localStorage`.
3. **Interceptor de petición**: Cada request inyecta automáticamente `Authorization: Bearer <token>` vía Axios interceptor.
4. **Interceptor de respuesta**: Si el backend responde con `401`, se limpia la sesión y se redirige a `/login`.
5. **Route Guards**:
   - `ProtectedRoute`: bloquea el acceso al dashboard si no hay token.
   - `GuestRoute`: redirige a `/inventory` si el usuario ya tiene sesión activa.

---

## Arquitectura de Sensores (Map<String, Double>)

El backend almacena las lecturas de sensores en un `Map<String, Double>` dinámico — no hay campos fijos. El frontend normaliza estas keys mediante `KEY_ALIASES` en `src/lib/sensorApi.js`, que mapea múltiples nombres posibles (ej. `"temperature"`, `"temp"`) a 4 variables canónicas:

| Variable | Unidad | Alias aceptados |
|---|---|---|
| `temperatura` | °C | temperatura, temperature, temp |
| `humedad_relativa` | % | humedad_relativa, humedad, humedad_aire, hr, humidity |
| `humedad_suelo` | % | humedad_suelo, soil_moisture, humidity_soil, hum_suelo, moisture |
| `iluminacion` | lux | iluminacion, luz, light, illuminance, lux |

**Polling**: El dashboard de Monitoreo IoT refresca lecturas cada 15 segundos con un indicador visual sutil (punto pulsante + "Actualizando…"), sin recargar la interfaz completa. Cada variable tiene su propia gráfica de historial en un grid 2×2 con eje Y independiente (0–50 °C, 0–100 %, 0–100 %, auto), permitiendo ver tendencias sin que las diferentes escalas opaque los movimientos.

Si un dispositivo MQTT envía una variable no contemplada, el backend la almacena y el frontend la ignora hasta que se agregue su alias a `KEY_ALIASES`. El sistema es **agnóstico al nombre de la variable**.

---

## Módulos Funcionales

| Módulo | Ruta | Descripción | Endpoints principales |
|---|---|---|---|
| Monitoreo IoT | `/monitoreo` | Sensores en tiempo real con polling 15s, selector de dispositivo, barra de info con estado online/offline, actuadores asociados, 4 gráficas de historial independientes | `GET /api/sensors/latest`, `GET /api/sensors/history/{id}`, `GET /api/devices`, `GET /api/actuators` |
| Dispositivos | `/dispositivos` | Catálogo de dispositivos con buscador, indicador online (< 5 min), conteo de sensores/actuadores asociados | `GET /api/devices` |
| Control | `/control` | CRUD completo de actuadores, selector de dispositivo, ejecución ON/OFF con indicador de resultado, pestaña de historial de eventos por dispositivo | `GET /api/actuators`, `POST /api/actuators`, `PATCH /api/actuators/{id}`, `DELETE /api/actuators/{id}`, `POST /api/actuators/execute`, `GET /api/actuator-events/{deviceId}` |
| Predicciones IA | `/predicciones` | Último análisis destacado, historial en grid, formulario de predicción con selección de dispositivo y actuador | `GET /api/predictions/latest-image-analysis`, `GET /api/predictions/image-analysis`, `POST /api/predictions` |
| Alertas | `/alertas` | Historial de eventos de actuadores con filtros por severidad y origen, persistencia de leídas en localStorage | `GET /api/actuator-events` |
| Inventario | `/inventory` | CRUD de insumos con buscador, indicador de stock bajo, umbral mínimo configurable | `GET /api/inventory`, `POST /api/inventory`, `PATCH /api/inventory/{id}` |
| Configuración | `/config` | Nombre del invernadero, modo automático (con advertencia visual), frecuencia de análisis IA | `GET /api/config`, `PATCH /api/config` |

**Rutas públicas**: `/login`, `/register`, `/forgot-password`, `/reset-password`.  
**Ruta catch-all**: `*` → página 404 personalizada con enlace de retorno al dashboard.

---

## Estructura del Proyecto (`src/`)

```
src/
├── api/                        # Cliente Axios con interceptores JWT
│   ├── api.js                  # Instancia axios, interceptores, normalizeError
│   └── authService.js          # login, register, logout, persistAuthSession
├── lib/                        # 7 módulos API (uno por dominio backend)
│   ├── actuatorApi.js          # Actuators CRUD + execute + events
│   ├── configApi.js            # Configuración del invernadero
│   ├── deviceApi.js            # Catálogo de dispositivos
│   ├── eventoApi.js            # Eventos de actuadores (fuente de alertas)
│   ├── inventoryApi.js         # Inventario de insumos
│   ├── predictionApi.js        # Predicciones y análisis IA
│   └── sensorApi.js            # Lecturas de sensores + normalización
├── modules/                    # Módulos funcionales
│   ├── auth/pages/             # Login, Register, ForgotPassword, ResetPassword
│   ├── monitoreo/              # MonitoreoIoT, SensorCard, SensorHistoryChart
│   ├── devices/pages/          # DeviceList
│   ├── devices/components/     # DeviceCard
│   ├── control/                # Control (CRUD + ejecución + historial)
│   ├── predicciones/           # PrediccionesIA, AnalysisCard
│   ├── alertas/                # Alertas (eventos de actuadores)
│   ├── inventory/pages/        # InventoryList
│   ├── config/                 # Configuración del invernadero
│   ├── layout/components/      # Sidebar, DashboardLayout, MobileNavbar
│   └── error/                  # NotFound (página 404)
├── components/                 # UI Kit atómico
│   └── ui/                     # Button, Input, Modal
├── routes/
│   └── AppRouter.jsx           # Definición de todas las rutas
├── App.jsx                     # Punto de entrada de la aplicación
└── main.jsx                    # Mount point de React
```

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

## Sincronización Backend-Frontend

Cada archivo en `src/lib/` se corresponde 1:1 con un controlador Java del backend:

| Archivo frontend | Controller Java | Endpoint base |
|---|---|---|
| `sensorApi.js` | `SensorController.java` | `/api/sensors` |
| `deviceApi.js` | `DeviceController.java` | `/api/devices` |
| `actuatorApi.js` | `ActuatorController.java` + `ActuatorEventController.java` | `/api/actuators` |
| `predictionApi.js` | `PredictionController.java` | `/api/predictions` |
| `inventoryApi.js` | `InventoryController.java` | `/api/inventory` |
| `configApi.js` | `GreenhouseConfigController.java` | `/api/config` |
| `eventoApi.js` | `ActuatorEventController.java` | `/api/actuator-events` |
| `authService.js` | `AuthController.java` | `/auth` |

Los tipos JSDoc (`@typedef`) replican exactamente los campos de los DTOs Java (`@JsonProperty`), asegurando que cualquier cambio en el backend se refleje como error de tipo en el frontend durante el desarrollo.

---

## Documentación Adicional

- **`FRONTEND_MASTER_PLAN.md`**: Contrato oficial de datos por módulo, especificación de endpoints, estructura de errores y estrategia de migración.

---

<p align="center">
  <b>SmartGreenHouse — Frontend</b><br/>
  <sub>Panel operativo para invernaderos inteligentes con React y Java Spring Boot</sub>
</p>
