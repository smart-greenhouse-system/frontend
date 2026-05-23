# FRONTEND MASTER PLAN — Contrato Oficial Backend → Frontend

## 1. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 |
| Build | Vite 8 |
| Lenguaje | JavaScript (JSX) |
| Routing | react-router-dom v7 |
| HTTP | Axios 1.x |
| Estilos | Tailwind CSS v4 |
| Charts | Recharts |
| Iconos | Lucide React |

## 2. Configuración Global del Cliente HTTP

### `src/api/api.js`

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",  // ej: "http://localhost:8080"
  headers: { "Content-Type": "application/json" },
});

// Adjuntar JWT automáticamente a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirigir al login si el backend responde 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      localStorage.removeItem("token");
      localStorage.removeItem("type");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Almacenamiento de Sesión

| Key localStorage | Origen | Propósito |
|----------------|--------|-----------|
| `token` | `AuthResponse.accessToken` | JWT Bearer token |
| `type` | `AuthResponse.tokenType` | Tipo de token ("Bearer") |

---

## 3. División del Trabajo

### Persona A — Lógica y Admin
**Archivos a cargo:**
- `src/api/api.js` (config global)
- `src/api/authService.js` + `src/components/ProtectedRoute.jsx` + `src/components/GuestRoute.jsx`
- `src/lib/actuatorApi.js` + `src/modules/control/Control.jsx`
- `src/lib/inventoryApi.js` + `src/modules/inventory/` (todas las páginas)
- `src/lib/actuatorEventsApi.js` (nuevo)
- `src/lib/deviceApi.js` + `src/modules/iot/` (nuevo)
- `src/lib/greenhouseConfigApi.js` (nuevo)

### Persona B — UI y Visualización
**Archivos a cargo:**
- `src/lib/sensorApi.js` + `src/modules/monitoreo/` (SensorCard, SensorHistoryChart)
- `src/lib/predictionApi.js` (reemplaza `iaApi.js`)
- `src/modules/layout/` (Sidebar, MobileNavbar, DashboardLayout)
- `src/routes/AppRouter.jsx`
- `src/modules/auth/pages/` (Login, Register)
- Dashboard principal (composición multi-módulo)
- `src/modules/alertas/` (basado en actuator-events)

---

## 4. Contrato de Datos por Módulo

---

### Módulo 01 — Auth

> **Referencia Java:** `invernadero/AuthController.java`, `invernadero/request/LoginRequest.java`, `invernadero/request/RegisterRequest.java`, `invernadero/response/AuthResponse.java`
>
> **[ASIGNADO A: PERSONA A]**

#### `POST /auth/register`

Registra un nuevo usuario.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200 (texto plano):**
```
"Usuario registrado con exito"
```

| Código | Descripción |
|--------|-------------|
| 200 | Usuario registrado exitosamente |

---

#### `POST /auth/login`

Inicia sesión y devuelve un JWT.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "accessToken": "string",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

**Response 401 / 403:**
```json
{
  "timestamp": "string",
  "status": 401,
  "error": "Unauthorized",
  "message": "string",
  "path": "/auth/login"
}
```

| Campo Response | Tipo | Descripción |
|----------------|------|-------------|
| `accessToken` | string | JWT token |
| `tokenType` | string | Tipo ("Bearer") |
| `expiresIn` | long | Segundos hasta expiración |

> **Nota de migración:** `persistAuthSession()` debe mapear `{ accessToken → token, tokenType → type }` al guardar en localStorage.

---

### Módulo 02 — Actuadores (CRUD + Ejecución)

> **Referencia Java:** `actuador/ActuatorController.java`, `actuador/dto/request/CreateActuatorRequest.java`, `actuador/dto/request/UpdateActuatorRequest.java`, `actuador/dto/request/ExecuteActuatorRequest.java`, `actuador/dto/response/ActuatorResponse.java`, `actuador/dto/response/ExecuteActuatorResponse.java`
>
> **[ASIGNADO A: PERSONA A]**

#### `GET /api/actuators`

Lista todos los actuadores.

**Response 200:**
```json
[
  {
    "actuator_id": "string",
    "device_id": "string",
    "actuador": "string",
    "nombre": "string",
    "estado": "string",
    "enabled": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `actuator_id` | string | ID único del actuador |
| `device_id` | string | ID del dispositivo asociado |
| `actuador` | string | Tipo de actuador (ej. "riego", "ventilacion", "iluminacion") |
| `nombre` | string | Nombre descriptivo |
| `estado` | string | Estado actual |
| `enabled` | boolean | Si está habilitado |
| `created_at` | string (ISO 8601) | Fecha de creación |
| `updated_at` | string (ISO 8601) | Fecha de última actualización |

---

#### `POST /api/actuators`

Crea un nuevo actuador.

**Request Body:**
```json
{
  "actuator_id": "string",
  "device_id": "string",
  "actuador": "string",
  "nombre": "string",
  "estado": "string",
  "enabled": true
}
```

**Response 201:** Mismo schema que `ActuatorResponse` (incluye `created_at`, `updated_at`).

---

#### `PATCH /api/actuators/{id}`

Actualiza parcialmente un actuador.

**Request Body:** (todos los campos opcionales)
```json
{
  "device_id": "string",
  "actuador": "string",
  "nombre": "string",
  "estado": "string",
  "enabled": true
}
```

**Response 200:** `ActuatorResponse`

---

#### `DELETE /api/actuators/{id}`

Elimina un actuador.

**Response 204:** Sin contenido.

---

#### `POST /api/actuators/execute`

Ejecuta una acción sobre un actuador (ON / OFF).

**Request Body:**
```json
{
  "device_id": "string",
  "actuador": "string",
  "accion": "ON"
}
```

| Campo Request | Tipo | Valores |
|---------------|------|---------|
| `device_id` | string | ID del dispositivo |
| `actuador` | string | "riego", "ventilacion", "iluminacion" |
| `accion` | string | "ON" o "OFF" |

**Response 200:**
```json
{
  "message": "string",
  "deviceId": "string",
  "actuator": "string",
  "action": "string",
  "executed": true
}
```

| Campo Response | Tipo | Descripción |
|----------------|------|-------------|
| `message` | string | Mensaje de resultado |
| `deviceId` | string | ID del dispositivo |
| `actuator` | string | Nombre del actuador |
| `action` | string | Acción ejecutada ("ON"/"OFF") |
| `executed` | boolean | Si se ejecutó correctamente |

---

### Módulo 03 — Eventos de Actuadores

> **Referencia Java:** `actuador/ActuatorEventController.java`, `actuador/dto/response/ActuatorEventResponse.java`
>
> **[ASIGNADO A: PERSONA A]**

#### `GET /api/actuator-events`

Lista todos los eventos de actuadores.

**Response 200:**
```json
[
  {
    "id": "string",
    "device_id": "string",
    "actuator": "string",
    "action": "string",
    "executed": true,
    "origin": "string",
    "event_type": "string",
    "status": "string",
    "topic": "string",
    "time_action": 30,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del evento |
| `device_id` | string | ID del dispositivo |
| `actuator` | string | Nombre del actuador |
| `action` | string | Acción ejecutada |
| `executed` | boolean | Si se ejecutó |
| `origin` | string | Origen del comando |
| `event_type` | string | Tipo de evento |
| `status` | string | Estado del evento |
| `topic` | string | Topic MQTT |
| `time_action` | integer | Duración en segundos |
| `created_at` | string (ISO 8601) | Fecha del evento |

#### `GET /api/actuator-events/{deviceId}`

Lista eventos filtrados por device ID (path variable).

**Response 200:** Mismo schema que `GET /api/actuator-events`, filtrado por dispositivo.

---

### Módulo 04 — Devices

> **Referencia Java:** `device/DeviceController.java`, `device/dto/response/DeviceResponse.java`
>
> **[ASIGNADO A: PERSONA A]**

#### `GET /api/devices`

Lista todos los dispositivos registrados.

**Response 200:**
```json
[
  {
    "device_id": "string",
    "nombre": "string",
    "tipo": "string",
    "estado": "string",
    "sensores": ["sensor_001", "sensor_002"],
    "actuadores": ["actuator_001"],
    "last_seen": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `device_id` | string | ID único del dispositivo |
| `nombre` | string | Nombre del dispositivo |
| `tipo` | string | Tipo de dispositivo |
| `estado` | string | Estado ("online", "offline") |
| `sensores` | string[] | Lista de IDs de sensores asociados |
| `actuadores` | string[] | Lista de IDs de actuadores asociados |
| `last_seen` | string (ISO 8601) | Última vez visto |
| `created_at` | string (ISO 8601) | Fecha de creación |

---

### Módulo 05 — Configuración del Invernadero

> **Referencia Java:** `greenhouse/GreenhouseConfigController.java`, `greenhouse/dto/request/UpdateGreenhouseConfigRequest.java`, `greenhouse/dto/response/GreenhouseConfigResponse.java`
>
> **[ASIGNADO A: PERSONA A]**

#### `GET /api/config`

Obtiene la configuración actual del invernadero.

**Response 200:**
```json
{
  "nombre_invernadero": "Invernadero Norte",
  "modo_automatico": true,
  "frecuencia_analisis_ia_min": 30
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre_invernadero` | string | Nombre del invernadero |
| `modo_automatico` | boolean | Modo automático activado |
| `frecuencia_analisis_ia_min` | integer | Frecuencia de análisis IA en minutos |

#### `PATCH /api/config`

Actualiza parcialmente la configuración.

**Request Body:** (todos los campos opcionales)
```json
{
  "nombre_invernadero": "Invernadero Norte",
  "modo_automatico": true,
  "frecuencia_analisis_ia_min": 30
}
```

**Response 200:** `GreenhouseConfigResponse`

---

### Módulo 06 — Inventario

> **Referencia Java:** `inventory/InventoryController.java`, `inventory/dto/request/CreateInventoryItemRequest.java`, `inventory/dto/request/UpdateInventoryItemRequest.java`, `inventory/dto/response/InventoryItemResponse.java`
>
> **[ASIGNADO A: PERSONA A]**

#### `GET /api/inventory`

Lista todos los items del inventario.

**Response 200:**
```json
[
  {
    "id": "string",
    "nombre": "string",
    "cantidad": 10,
    "unidad": "kg",
    "threshold_minimo": 2,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del item |
| `nombre` | string | Nombre del insumo |
| `cantidad` | integer | Cantidad disponible |
| `unidad` | string | Unidad de medida |
| `threshold_minimo` | integer | Umbral mínimo para alertas |
| `created_at` | string (ISO 8601) | Fecha de creación |

#### `POST /api/inventory`

Crea un nuevo item en el inventario.

**Request Body:**
```json
{
  "nombre": "string",
  "cantidad": 10,
  "unidad": "kg",
  "threshold_minimo": 2
}
```

**Response 201:** `InventoryItemResponse`

#### `PATCH /api/inventory/{id}`

Actualiza parcialmente un item del inventario.

**Request Body:** (todos los campos opcionales)
```json
{
  "cantidad": 15,
  "threshold_minimo": 3
}
```

**Response 200:** `InventoryItemResponse`

---

### Módulo 07 — Predicciones / IA

> **Referencia Java:** `prediction/PredictionController.java`, `prediction/dto/request/CreatePredictionRequest.java`, `prediction/dto/response/CreatePredictionResponse.java`, `prediction/dto/response/ImageAnalysisPredictionResponse.java`, `prediction/dto/response/PredictionResponse.java`
>
> **[ASIGNADO A: PERSONA B]**

#### `GET /api/predictions/latest-image-analysis`

Obtiene el análisis de imagen más reciente (IA).

**Response 200:**
```json
{
  "id": "string",
  "tipo": "string",
  "device_id": "string",
  "cultivo": "string",
  "success": true,
  "estado_planta": "string",
  "confianza": 0.95,
  "tiempo_cosecha_dias": 35,
  "created_at": "2024-01-01T00:00:00Z"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único de la predicción |
| `tipo` | string | Tipo de análisis |
| `device_id` | string | ID del dispositivo |
| `cultivo` | string | Nombre del cultivo analizado |
| `success` | boolean | Si el análisis fue exitoso |
| `estado_planta` | string | Estado detectado de la planta |
| `confianza` | double | Nivel de confianza del modelo (0-1) |
| `tiempo_cosecha_dias` | integer | Días estimados para cosecha |
| `created_at` | string (ISO 8601) | Fecha del análisis |

#### `GET /api/predictions/image-analysis`

Obtiene el historial completo de análisis de imágenes.

**Response 200:**
```json
[
  {
    "id": "string",
    "tipo": "string",
    "device_id": "string",
    "cultivo": "string",
    "success": true,
    "estado_planta": "string",
    "confianza": 0.95,
    "tiempo_cosecha_dias": 35,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### `POST /api/predictions`

Crea una nueva predicción (procesa análisis IA).

**Request Body:**
```json
{
  "device_id": "string",
  "procesado": true,
  "actuador_id": "string",
  "timeAction": "string"
}
```

| Campo Request | Tipo | Descripción |
|---------------|------|-------------|
| `device_id` | string | ID del dispositivo |
| `procesado` | boolean | Si ya fue procesado |
| `actuador_id` | string | ID del actuador relacionado |
| `timeAction` | string | Acción temporal |

**Response 201:**
```json
{
  "message": "string",
  "processed": true,
  "automatic_mode": true,
  "actuator_executed": true,
  "timeAction": 30
}
```

| Campo Response | Tipo | Descripción |
|----------------|------|-------------|
| `message` | string | Mensaje de resultado |
| `processed` | boolean | Si se procesó la predicción |
| `automatic_mode` | boolean | Si el modo automático estaba activo |
| `actuator_executed` | boolean | Si se ejecutó un actuador |
| `timeAction` | integer | Duración de la acción |

---

### Módulo 08 — Sensores

> **Referencia Java:** `sensor/SensorController.java`, `sensor/dto/response/SensorDataResponse.java`
>
> **[ASIGNADO A: PERSONA B]**

#### `GET /api/sensors/latest`

Obtiene la lectura más reciente de los sensores.

**Response 200:**
```json
{
  "id": "string",
  "device_id": "string",
  "sensores": {
    "temperatura": 24.5,
    "humedad": 65.0,
    "luz": 800.0
  },
  "created_at": "2024-01-01T00:00:00Z"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del registro |
| `device_id` | string | ID del dispositivo sensor |
| `sensores` | Map<string, double> | Mapa dinámico de variable → valor |
| `created_at` | string (ISO 8601) | Timestamp de la lectura |

> **Importante:** `sensores` es un `Map<String, Double>`. Las keys del mapa son dinámicas (ej. `"temperatura"`, `"humedad"`, `"luz"`, `"co2"`). No se debe hardcodear una estructura fija; la UI debe iterar sobre las keys del mapa.

#### `GET /api/sensors/history/{device_id}`

Obtiene el historial de lecturas para un dispositivo específico.

**Path Variable:** `device_id` — ID del dispositivo.

**Response 200:**
```json
[
  {
    "id": "string",
    "device_id": "string",
    "sensores": {
      "temperatura": 24.5,
      "humedad": 65.0
    },
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

## 5. Estructura de Error Global

> **Referencia Java:** `errores/ApiErrorResponse.java`

Todos los errores del backend siguen este formato:

```json
{
  "timestamp": "2024-01-01T00:00:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Descripción del error",
  "path": "/api/actuators"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `timestamp` | string | Fecha/hora del error (ISO 8601) |
| `status` | int | Código HTTP |
| `error` | string | Tipo de error |
| `message` | string | Mensaje descriptivo |
| `path` | string | Ruta que generó el error |

---

## 6. Estrategia de Migración (Archivos a Eliminar / Refactorizar)

### 6.1 Archivos a ELIMINAR (endpoints inexistentes en backend real)

| Archivo | Razón |
|---------|-------|
| `src/lib/cropApi.js` | Endpoints `/api/crops/*` no existen |
| `src/lib/alertsApi.js` | Endpoints `/api/alerts`, `/api/users/*/notification-preferences` no existen |
| `src/lib/harvestEstimationApi.js` | Endpoint `/api/crops/*/harvest-estimation` no existe |
| `src/lib/dashboardApi.js` | Endpoint `/api/dashboard` no existe |
| `src/lib/iaApi.js` | Reemplazar completamente por `predictionApi.js` con endpoints reales |

### 6.2 Archivos a REFACTORIZAR

| Archivo | Cambio |
|---------|--------|
| `src/api/authService.js` | Eliminar mock en `login()` y `register()`. Paths: `/api/auth/login` → `/auth/login`, `/api/auth/register` → `/auth/register`. Mapeo: `{ accessToken → token, tokenType → type }` |
| `src/lib/actuatorApi.js` | Cambiar `POST /api/actuadores` → `POST /api/actuators/execute`. Agregar funciones: `getActuators()`, `createActuator()`, `updateActuator()`, `deleteActuator()` |
| `src/lib/sensorApi.js` | Corregir mapeo de response. El backend devuelve `{ id, device_id, sensores: Map, created_at }`, no `{ temperatura, humedad_relativa, ... }` |
| `src/lib/inventoryApi.js` | Corregir `normalizeInventoryItem()`: backend usa `{ id, nombre, cantidad, unidad, threshold_minimo }`. Eliminar `deactivateInventoryItem()` (no existe en backend). |
| `src/modules/control/Control.jsx` | Conectar con `POST /api/actuators/execute` |

### 6.3 Archivos NUEVOS a crear

| Archivo | Propósito |
|---------|-----------|
| `src/lib/actuatorEventsApi.js` | Endpoints de `GET /api/actuator-events` y `GET /api/actuator-events/{deviceId}` |
| `src/lib/deviceApi.js` | Endpoint `GET /api/devices` |
| `src/lib/greenhouseConfigApi.js` | Endpoints `GET /api/config` y `PATCH /api/config` |
| `src/lib/predictionApi.js` | Endpoints `GET /api/predictions/latest-image-analysis`, `GET /api/predictions/image-analysis`, `POST /api/predictions` |

### 6.4 Orden de Ejecución

```
Semana 1 — Fundamentos:
  [A] api.js (verificar/ajustar) + authService.js (eliminar mock, paths reales)
  [B] sensorApi.js (corregir normalización) + predictionApi.js (nuevo)

Semana 2 — Módulos principales:
  [A] actuatorApi.js (CRUD + execute + events) + Control.jsx
  [B] MonitoreoIoT + SensorCard + SensorHistoryChart con API real

Semana 3 — Módulos administrativos:
  [A] inventoryApi.js (corregido) + Inventory pages
  [A] deviceApi.js (nuevo) + greenhouseConfigApi.js (nuevo)
  [B] Dashboard (composición multi-API) + Layout + Routing

Semana 4 — Limpieza e integración:
  [A+B] Eliminar archivos obsoletos (cropApi, alertsApi, etc.)
  [A+B] Pruebas de integración extremo a extremo
```

---

## 7. Resumen de Endpoints (Tabla Maestra)

| # | Método | URL | Módulo | Persona |
|---|--------|-----|--------|---------|
| 1 | POST | `/auth/register` | Auth | A |
| 2 | POST | `/auth/login` | Auth | A |
| 3 | GET | `/api/actuators` | Actuadores | A |
| 4 | POST | `/api/actuators` | Actuadores | A |
| 5 | PATCH | `/api/actuators/{id}` | Actuadores | A |
| 6 | DELETE | `/api/actuators/{id}` | Actuadores | A |
| 7 | POST | `/api/actuators/execute` | Actuadores | A |
| 8 | GET | `/api/actuator-events` | Eventos | A |
| 9 | GET | `/api/actuator-events/{deviceId}` | Eventos | A |
| 10 | GET | `/api/devices` | Devices | A |
| 11 | GET | `/api/config` | Config | A |
| 12 | PATCH | `/api/config` | Config | A |
| 13 | GET | `/api/inventory` | Inventario | A |
| 14 | POST | `/api/inventory` | Inventario | A |
| 15 | PATCH | `/api/inventory/{id}` | Inventario | A |
| 16 | GET | `/api/predictions/latest-image-analysis` | IA | B |
| 17 | GET | `/api/predictions/image-analysis` | IA | B |
| 18 | POST | `/api/predictions` | IA | B |
| 19 | GET | `/api/sensors/latest` | Sensores | B |
| 20 | GET | `/api/sensors/history/{device_id}` | Sensores | B |

---

*Documento generado a partir del análisis directo de los archivos Java en `backend_reference/`. Los nombres de campos JSON reflejan exactamente los valores `@JsonProperty` (snake_case) o, en su ausencia, los nombres de variables Java (camelCase).*
