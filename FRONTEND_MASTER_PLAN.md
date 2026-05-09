# 📘 FRONTEND MASTER PLAN - Única Fuente de Verdad

Este documento es la referencia central para el desarrollo. Contiene la división de tareas, el flujo de trabajo y el contrato de datos (API) para que la IA genere código preciso.

## REQUERIMIENTOS

## MO1- AUTENTICACIÓN (Santiago)

# RF-01 - Registro de Usuario con Verificación por Correo Electrónico

- **Vista:** Tarjeta centrada sobre fondo gris claro con bordes redondeados y sombra ligera. Encabezado en verde oscuro (`Crear cuenta`), cuatro campos apilados (Nombre, Correo, Contraseña, Confirmar contraseña) de ancho completo, botón `Registrarse` en verde oscuro con texto blanco, y enlace `Inicia sesión` al pie en verde.

- **Acciones:**
  - Completar los cuatro campos del formulario y presionar `Registrarse`
  - Hacer clic en el enlace de verificación recibido por correo para activar la cuenta
  - Hacer clic en `Inicia sesión` para navegar a la pantalla de autenticación

- **API:**
  - `POST /api/v1/auth/register`
    - **Envío:** `{ "name": string, "email": string, "password": string }`
    - **201:** `{ "message": "Verification email sent successfully" }`
    - **400:** `{ "code": "EMAIL_ALREADY_EXISTS", "message": string }`
    - **500:** `{ "code": "EMAIL_SERVICE_ERROR", "message": string }`

- **Reglas:**
  - El correo electrónico debe ser único; si ya existe, mostrar error en línea bajo el campo de correo
  - Las contraseñas deben coincidir; si no, mostrar error bajo el campo `Confirmar contraseña`
  - La contraseña debe tener mínimo 8 caracteres
  - La cuenta se crea en estado **pendiente** hasta que el usuario verifique el correo
  - Si el token de verificación expira, el sistema debe solicitar un nuevo enlace
  - El servicio de correo debe estar operativo; si falla, retornar `EMAIL_SERVICE_ERROR`

  # RF-02 - Authentication with JWT and Refresh Tokens

- **Vista:** Tarjeta blanca centrada (~60% del viewport) sobre fondo gris claro, sin navbar ni sidebar. Encabezado en verde oscuro (`#2d6a2d`) con título `Iniciar sesión` y subtítulo en gris. Dos campos apilados (Correo, Contraseña) de ancho completo con bordes redondeados. Botón primario `Ingresar` en verde oscuro, enlaces `¿Olvidaste tu contraseña?` y `Regístrate` en verde al pie.

- **Acciones:**
  - Completar campos de correo y contraseña y presionar `Ingresar`
  - Hacer clic en `¿Olvidaste tu contraseña?` → navegar al flujo de recuperación (RF-04)
  - Hacer clic en `Regístrate` → navegar a la pantalla de registro (RF-01)

- **API:**
  - `POST /api/v1/auth/login`
    - **Envío:** `{ "email": string, "password": string }`
    - **200:** `{ "access_token": string, "refresh_token": string, "expires_in": integer }`
    - **401:** `{ "code": "INVALID_CREDENTIALS", "message": string }`
    - **403:** `{ "code": "ACCOUNT_NOT_VERIFIED", "message": string }`
    - **500:** `{ "code": "AUTH_SERVICE_ERROR", "message": string }`

- **Reglas:**
  - El usuario debe estar registrado y con cuenta activa/verificada para poder iniciar sesión
  - Credenciales incorrectas → mostrar error en línea (`INVALID_CREDENTIALS`), no especificar cuál campo falló
  - Cuenta no verificada → bloquear login y mostrar mensaje para verificar correo (`ACCOUNT_NOT_VERIFIED`)
  - El `access_token` tiene vida corta (ej: 15 min / 900 s); el `refresh_token` es de larga duración y revocable
  - Si el refresh token está expirado o revocado, forzar nuevo login completo


# RF-03 - Role-Based Access Control (RBAC)

- **Vista:** Panel de administración de página completa sobre fondo blanco. Encabezado con título `Gestión de roles y permisos` en verde oscuro y subtítulo en gris. Dos secciones: (1) lista de tarjetas de usuario con nombre en negrita, email en gris, dropdown de rol y botón `Guardar` en verde oscuro; (2) tabla de matriz de permisos con cabecera en verde claro/oscuro y valores `Sí` en verde / `No` en rojo.

- **Acciones:**
  - Seleccionar un rol desde el dropdown de cada tarjeta de usuario
  - Presionar `Guardar` → envía el nuevo rol asignado al usuario
  - Consultar la matriz de permisos como referencia visual (solo lectura)

- **API:**
  - `PATCH /api/v1/users/{user_id}/role`
    - **Headers:** `Authorization: Bearer <token>`
    - **Envío:** `{ "role": "operator" }` — valores permitidos: `superadmin`, `admin`, `operator`, `viewer`
    - **200:** `{ "message": "User role updated successfully" }`
    - **403:** `{ "code": "INSUFFICIENT_PERMISSIONS", "message": string }`
    - **404:** `{ "code": "USER_NOT_FOUND", "message": string }`
    - **500:** `{ "code": "ROLE_UPDATE_ERROR", "message": string }`

- **Reglas:**
  - Solo usuarios autenticados con permisos suficientes (admin / superadmin) pueden modificar roles
  - Los roles válidos son exactamente cuatro: `superadmin`, `admin`, `operator`, `viewer`; cualquier otro valor debe rechazarse
  - Matriz de permisos por rol:
    - `superadmin` → Lectura ✅ Escritura ✅ Ejecutar comandos ✅ Administrar usuarios ✅
    - `admin` → Lectura ✅ Escritura ✅ Ejecutar comandos ✅ Administrar usuarios ✅
    - `operator` → Lectura ✅ Escritura ✅ Ejecutar comandos ✅ Administrar usuarios ❌
    - `viewer` → Lectura ✅ Escritura ❌ Ejecutar comandos ❌ Administrar usuarios ❌
  - Intentos de acceso no autorizados deben ser bloqueados (HTTP 403) y registrados en el sistema de auditoría


# RF-04 - Password Recovery and Change

- **Vista:** Tarjeta blanca centrada sobre fondo gris claro, sin navbar ni sidebar. Dividida en dos secciones por un separador horizontal: (1) `Recuperar contraseña` — un campo de correo y botón `Enviar enlace` en verde oscuro; (2) `Restablecer contraseña` — dos campos de contraseña con placeholder en naranja (`Nueva contraseña`, `Confirmar contraseña`) y botón `Cambiar contraseña` en verde oscuro. Tipografía de títulos en verde oscuro.

- **Acciones:**
  - Ingresar correo y presionar `Enviar enlace` → solicitar email de recuperación
  - Abrir enlace del correo → cargar formulario de restablecimiento con token pre-validado en URL
  - Ingresar y confirmar nueva contraseña, presionar `Cambiar contraseña` → actualizar y redirigir al login
  - (Desde perfil autenticado) Ingresar contraseña actual + nueva contraseña → cambio directo

- **API:**
  - `POST /api/v1/auth/password-recovery`
    - **Envío:** `{ "email": string }`
    - **200:** `{ "message": "Password recovery email sent successfully" }`
    - **404:** `{ "code": "USER_NOT_FOUND", "message": string }`

  - `POST /api/v1/auth/password-reset`
    - **Envío:** `{ "token": string, "new_password": string }`
    - **200:** `{ "message": string }` *(confirmación de restablecimiento)*
    - **400/401:** `{ "code": "INVALID_OR_EXPIRED_TOKEN", "message": string }` *(implícito por requerimiento)*

  - `PATCH /api/v1/auth/password-change`
    - **Headers:** `Authorization: Bearer <token>`
    - **Envío:** `{ "current_password": string, "new_password": string }`
    - **200:** `{ "message": string }` *(confirmación de cambio)*
    - **401:** `{ "code": "INVALID_CREDENTIALS", "message": string }` *(contraseña actual incorrecta)*

- **Reglas:**
  - El token de recuperación es de un solo uso y tiene expiración; si expira, solicitar nuevo enlace
  - Si el correo no está registrado, mostrar error `USER_NOT_FOUND`
  - La nueva contraseña y la confirmación deben coincidir; si no, mostrar error de validación bajo el campo `Confirmar contraseña`
  - Para el cambio desde perfil, validar la contraseña actual antes de aplicar el cambio
  - El flujo de recuperación y el de cambio autenticado son independientes; el reset por token no requiere sesión activa


# RF-05 - Active Session Management

- **Vista:** Panel de seguridad de página completa sobre fondo blanco. Encabezado con título `Sesiones activas` en verde oscuro y subtítulo en gris. Lista de tarjetas de sesión con bordes redondeados, cada una mostrando: nombre del dispositivo en negrita, IP en verde oscuro, fecha de inicio y botón rojo `Cerrar` alineado a la derecha. La sesión actual muestra etiqueta `Sesión actual` y botón deshabilitado `No disponible`. Botón global `Cerrar todas las demás sesiones` en verde oscuro al pie de la lista.

- **Acciones:**
  - Cargar la vista → llamar `GET /api/v1/auth/sessions` y renderizar tarjetas
  - Presionar `Cerrar` en una sesión específica → revocar esa sesión y eliminar su tarjeta de la lista
  - Presionar `Cerrar todas las demás sesiones` → revocar todas excepto la actual

- **API:**
  - `GET /api/v1/auth/sessions`
    - **Headers:** `Authorization: Bearer <token>`
    - **200:** `{ "sessions": [ { "session_id": string, "device": string, "ip_address": string, "user_agent": string, "created_at": string (ISO 8601), "current": boolean } ] }`

  - `DELETE /api/v1/auth/sessions/{session_id}`
    - **Headers:** `Authorization: Bearer <token>`
    - **200:** `{ "message": "Session closed successfully" }`
    - **403/404:** *(implícito)* sesión inexistente, expirada o de otro usuario → rechazar acción

  - `DELETE /api/v1/auth/sessions`
    - **Headers:** `Authorization: Bearer <token>`
    - **200:** `{ "message": "All other sessions have been closed" }`

- **Reglas:**
  - El campo `current: true` identifica la sesión activa del request; su botón debe renderizarse deshabilitado (`No disponible`)
  - No se puede cerrar la sesión propia desde este panel
  - Si no hay otras sesiones activas, mostrar mensaje informativo (sin tarjetas)
  - Sesiones ya expiradas deben omitirse o eliminarse de la lista automáticamente
  - Acciones de cierre solo aplican a sesiones del usuario autenticado; intentar cerrar sesiones ajenas debe ser rechazado


# RF-06 - User Administration by Admin

- **Vista:** Panel de administración de página completa sobre fondo blanco. Encabezado con título `Administración de usuarios` en verde oscuro y subtítulo en gris. Dos secciones: (1) Formulario horizontal de dos filas para crear usuario — fila 1: inputs `Nombre completo` y `Correo electrónico`; fila 2: dropdowns `Seleccionar rol` y `Asignar invernadero`; botón `Crear usuario` en verde oscuro. (2) Tabla de usuarios con cabecera en verde claro/oscuro y columnas: Usuario, Email (en verde), Rol, Invernadero, Estado (`Activo` en verde / `Inactivo` en rojo) y Acciones (botones `Editar` verde, `Desactivar/Activar` naranja, `Eliminar` rojo).

- **Acciones:**
  - Completar formulario y presionar `Crear usuario` → crear usuario y agregarlo a la tabla
  - Presionar `Editar` en una fila → abrir formulario/modal de edición inline
  - Presionar `Desactivar` → cambiar estado a Inactivo y alternar etiqueta a `Activar`
  - Presionar `Eliminar` → mostrar diálogo de confirmación; al confirmar, eliminar fila de la tabla

- **API:**
  - `POST /api/v1/users`
    - **Headers:** `Authorization: Bearer <token-admin>`
    - **Envío:** `{ "name": string, "email": string, "role": string, "greenhouse_id": string, "status": "active" | "inactive" }`
    - **201:** `{ "message": string, "user_id": string }`
    - **400:** `{ "code": "EMAIL_ALREADY_EXISTS", "message": string }`
    - **403:** `{ "code": "INSUFFICIENT_PERMISSIONS", "message": string }` *(implícito)*
    - **404:** `{ "code": "GREENHOUSE_NOT_FOUND", "message": string }` *(implícito)*

  - `PATCH /api/v1/users/{user_id}`
    - **Headers:** `Authorization: Bearer <token-admin>`
    - **Envío (parcial):** `{ "name"?: string, "status"?: "active" | "inactive", "role"?: string, "greenhouse_id"?: string }`
    - **200:** `{ "message": string }` *(confirmación de actualización)*

  - `DELETE /api/v1/users/{user_id}`
    - **Headers:** `Authorization: Bearer <token-admin>`
    - **200:** `{ "message": "User deleted successfully" }`

- **Reglas:**
  - Solo administradores autenticados con permisos de gestión pueden ejecutar estas acciones
  - El correo debe ser único; si ya existe, rechazar creación con `EMAIL_ALREADY_EXISTS`
  - El `greenhouse_id` debe corresponder a un invernadero existente; si no, bloquear la asignación
  - Si el usuario ya tiene asignado ese invernadero, actualizar la asignación en lugar de duplicarla
  - El botón `Desactivar/Activar` debe alternar su etiqueta y color según el estado actual del usuario (`status`)
  - La eliminación requiere confirmación explícita del administrador antes de ejecutarse
  - Todas las acciones administrativas deben registrarse en el log de auditoría


# RF-07 - Access Audit Log

- **Vista:** Consola de auditoría de página completa sobre fondo blanco. Encabezado con título `Auditoría de accesos` en verde oscuro y subtítulo en gris. Barra de filtros horizontal con: input `Buscar usuario`, dropdown `Tipo de evento`, date picker `dd/mm/aaaa` y botón `Filtrar` en verde oscuro. Tabla de ancho completo con cabecera en verde claro/oscuro y columnas: Fecha y hora, Usuario (en verde), Evento, IP, User-Agent y Estado — color-coded: `Correcto` verde, `Fallido` rojo, `Registrado` naranja.

- **Acciones:**
  - Al cargar la vista → llamar `GET /api/v1/audit-logs` y renderizar tabla con registros recientes
  - Completar uno o más filtros y presionar `Filtrar` → refrescar tabla con parámetros de query
  - Si no hay resultados, mostrar mensaje de estado vacío

- **API:**
  - `GET /api/v1/audit-logs`
    - **Headers:** `Authorization: Bearer <token-admin>`
    - **Query params (todos opcionales):** `user_id`, `event_type`, `from` (ISO 8601), `to` (ISO 8601)
    - **200:** `{ "logs": [ { "audit_id": string, "user_id": string, "event_type": string, "ip_address": string, "user_agent": string, "created_at": string (ISO 8601) } ] }`
    - **403:** `{ "code": "INSUFFICIENT_PERMISSIONS", "message": string }`

- **Reglas:**
  - Solo administradores autenticados pueden acceder al módulo de auditoría
  - Valores válidos de `event_type`: `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_CHANGED`, `PASSWORD_RESET`, `ADMIN_ACTION`
  - El mapeo de `event_type` a etiqueta visual es: `LOGIN_SUCCESS` → `Login exitoso` (Correcto 🟢), `LOGIN_FAILED` → `Login fallido` (Fallido 🔴), `ADMIN_ACTION` → `Acción administrativa` (Registrado 🟠), `LOGOUT` / `PASSWORD_CHANGED` / `PASSWORD_RESET` → (Registrado 🟠)
  - El registro de auditoría es de solo lectura; no existe endpoint de creación o eliminación desde el front-end
  - Si el módulo de auditoría falla al guardar un evento, el error debe registrarse internamente sin interrumpir la operación principal (transparente para el usuario)
  - Sin filtros activos, la tabla muestra los registros más recientes por defecto


## MO2- MONITOREO IOT(Majo)

# RF-08 - Environmental Variable Measurement

- **Vista:** Tarjeta blanca centrada sobre fondo gris claro con título `Monitoreo Ambiental` en verde oscuro. Grid de tarjetas métricas 2×2 con fondo verde claro: valor numérico grande en negrita verde oscuro y etiqueta en gris. Una quinta tarjeta independiente al pie con fondo rojo/rosado para el sensor desconectado, mostrando `--` como valor y etiqueta `CO₂ (sensor desconectado)`.

- **Acciones:**
  - Al cargar el dashboard → solicitar lecturas más recientes al backend y poblar cada tarjeta métrica
  - Si un sensor no devuelve datos → cambiar fondo de su tarjeta a rojo/rosado y mostrar `--`
  - Auto-refresco de valores cada 5–10 segundos (definido en RF-15)

- **API:**
  - `POST /api/v1/sensors/readings`
    - **Envío:** `{ "sensor_id": string, "temperature": number, "humidity_air": number, "humidity_soil": number, "light": number, "co2": number | null, "timestamp": string (ISO 8601) }`
    - **201:** `{ "message": "Sensor readings stored successfully" }`
    - **400:** `{ "code": "INVALID_SENSOR_DATA", "message": string }`
    - **500:** `{ "code": "SENSOR_PROCESSING_ERROR", "message": string }`

- **Reglas:**
  - Rangos válidos por variable (valores fuera de rango → marcar como inválidos y excluir de lógica de control):
    - `temperature`: -10 a 80 °C ✅ requerido
    - `humidity_air`: 0 a 100 % ✅ requerido
    - `humidity_soil`: 0 a 100 % ✅ requerido
    - `light`: 0 a 100,000 lux ✅ requerido
    - `co2`: 300 a 5,000 ppm ❌ opcional — enviar `null` si el sensor no está disponible
  - Si un sensor está desconectado, su tarjeta debe renderizarse con fondo rojo/rosado y valor `--`; no bloquea el resto del dashboard
  - Datos parciales son válidos: el backend almacena las variables disponibles y marca las faltantes
  - El campo `co2: null` es un estado esperado y no debe tratarse como error


# RF-09 - Data Transmission via MQTT

- **Vista:** Tarjeta blanca centrada sobre fondo gris claro con título `Estado de transmisión MQTT` en verde oscuro. Banner pill de ancho completo en verde claro con texto `Dispositivo conectado al broker MQTT` (cambia a rojo/naranja si desconectado). Grid 2×2 de tarjetas grises con valores en negrita: `QoS 1` (Calidad de servicio), `Activo` (Broker), `sensor/001/data` (Topic — en naranja/verde), `Online` (Estado dispositivo). Botón `Simular desconexión` en verde oscuro al pie.

- **Acciones:**
  - Al cargar el panel → mostrar estado actual de conexión MQTT del dispositivo
  - El banner de conexión refleja el estado en tiempo real (verde = conectado, rojo/naranja = desconectado)
  - Presionar `Simular desconexión` → forzar desconexión, el broker emite LWT y el sistema actualiza estado del sensor a `offline` (visible en RF-13)

- **API (MQTT — sin REST):**
  - **Topic de datos:**
    `greenhouse/{greenhouse_id}/sensor/{sensor_id}/data`
    - **QoS:** 1 (at-least-once con acknowledgment)
    - **Payload:** `{ "sensor_id": string, "temperature": number, "humidity_air": number, "humidity_soil": number, "light": number, "timestamp": string (ISO 8601) }`

  - **Topic LWT (Last Will and Testament):**
    `greenhouse/{greenhouse_id}/sensor/{sensor_id}/status`
    - **Publicado por:** el broker automáticamente ante desconexión inesperada
    - **Payload:** `{ "sensor_id": string, "status": "offline", "timestamp": string (ISO 8601) }`
    - **Retained:** `true` — nuevos suscriptores reciben el último estado conocido al conectarse

- **Reglas:**
  - Este RF no expone endpoints REST; la comunicación es exclusivamente MQTT
  - QoS 1 garantiza entrega al menos una vez; el dispositivo reintenta si no recibe ACK del broker
  - Ante pérdida de conexión, el dispositivo debe intentar reconexión automática
  - El mensaje LWT se pre-registra en el broker al momento de la conexión inicial; no requiere acción del front-end
  - El estado `offline` emitido por LWT debe reflejarse visualmente en el panel de sensores (RF-13) y en la tarjeta de estado de este panel
  - El banner de conexión es el indicador principal de estado; debe actualizarse reactivamente sin recargar la página


# RF-10 - Multiple Sensors Registration per Greenhouse

- **Vista:** Panel de administración de página completa sobre fondo blanco. Encabezado con título `Gestión de sensores por invernadero` en verde oscuro y subtítulo en gris. Dos secciones: (1) Formulario horizontal de una fila con cuatro controles — inputs `ID del sensor` y `Dirección MAC`, dropdowns `Tipo de sensor` e `Invernadero` — y botón `Registrar sensor` en verde oscuro. (2) Tabla de ancho completo con cabecera verde claro/oscuro y columnas: ID Sensor, Tipo, MAC, Invernadero, Estado (`Activo` verde / `Inactivo` rojo) y Acciones (botón toggle `Desactivar` naranja / `Activar` verde).

- **Acciones:**
  - Completar formulario y presionar `Registrar sensor` → validar unicidad y registrar sensor; aparece en la tabla
  - Presionar `Desactivar` → cambiar estado a Inactivo y alternar botón a `Activar` (y viceversa)
  - Al cargar el panel → listar sensores del invernadero seleccionado vía `GET /api/v1/sensors?greenhouse_id=`

- **API:**
  - `POST /api/v1/sensors`
    - **Headers:** `Authorization: Bearer <token-admin>`
    - **Envío:** `{ "sensor_code": string, "type": string, "mac_address": string, "greenhouse_id": string, "status": "active" | "inactive" }`
    - **201:** `{ "message": string, "sensor_id": string }`
    - **400:** `{ "code": "DUPLICATE_SENSOR", "message": string }`
    - **404:** `{ "code": "GREENHOUSE_NOT_FOUND", "message": string }` *(implícito)*

  - `PATCH /api/v1/sensors/{sensor_id}/status`
    - **Headers:** `Authorization: Bearer <token-admin>`
    - **Envío:** `{ "status": "active" | "inactive" }`
    - **200:** `{ "message": "Sensor status updated successfully" }`

  - `GET /api/v1/sensors?greenhouse_id={gh_id}`
    - **Headers:** `Authorization: Bearer <token-admin>`
    - **200:** `{ "sensors": [ { "sensor_id": string, "sensor_code": string, "type": string, "mac_address": string, "greenhouse_id": string, "status": string } ] }`

- **Reglas:**
  - `sensor_code` y `mac_address` deben ser únicos en el sistema; cualquier duplicado → rechazar con `DUPLICATE_SENSOR`
  - El invernadero (`greenhouse_id`) debe existir antes de poder asignar un sensor
  - Tipos de sensor válidos: `temperature`, `humidity_air`, `humidity_soil`, `light`, `co2`
  - La desactivación o eliminación de un sensor **no debe borrar su historial de lecturas**
  - El botón de acción en la tabla alterna entre `Desactivar` (naranja, cuando activo) y `Activar` (verde, cuando inactivo) según el campo `status` del sensor
  - Un mismo invernadero puede tener múltiples sensores del mismo tipo registrados simultáneamente


# RF-11 - Time-Series Data Storage

- **Vista:** Tarjeta blanca centrada sobre fondo gris claro con título `Historial de sensores` en verde oscuro. Barra de filtros horizontal con dropdown `Seleccionar sensor` y dos date pickers (`Fecha inicio` / `Fecha fin`), seguido de botón `Consultar` en verde oscuro. Tabla de resultados de ancho completo con cabecera verde claro/oscuro y tres columnas: Fecha, Valor y Unidad. Filas ordenadas por fecha ascendente; mensaje de estado vacío si no hay registros.

- **Acciones:**
  - Seleccionar sensor y rango de fechas, presionar `Consultar` → poblar tabla con registros históricos
  - Si no hay datos para el rango seleccionado → mostrar mensaje de estado vacío

- **API:**
  - `POST /api/v1/readings`
    - **Envío:** `{ "sensor_id": string, "value": number, "unit": string, "timestamp": string (ISO 8601) }`
    - **201:** `{ "message": "Reading stored successfully" }`
    - **400:** `{ "code": "INVALID_SENSOR_DATA", "message": string }` *(implícito — dato inválido o fuera de rango)*

  - `GET /api/v1/readings?sensor_id={id}&from={date}&to={date}&limit={n}`
    - **Query params:** `sensor_id` ✅ requerido · `from` ❌ · `to` ❌ · `limit` ❌ (default: 100)
    - **200:** `{ "sensor_id": string, "readings": [ { "value": number, "unit": string, "timestamp": string (ISO 8601) } ] }`

- **Reglas:**
  - `sensor_id` es obligatorio en el `GET`; sin él no se puede ejecutar la consulta
  - Los resultados deben ordenarse por `timestamp` ascendente
  - El parámetro `limit` controla el máximo de registros devueltos (default 100); el front-end debe considerar paginación o advertencia si el rango es muy amplio
  - Unidades válidas esperadas: `C` (°C), `%`, `lux`, `ppm` — el front-end debe mapearlas a sus símbolos para mostrar en la columna **Unidad**
  - Datos inválidos o fuera de rango deben ser rechazados o marcados sin afectar registros válidos ya almacenados
  - Si la base de datos no está disponible, el backend reintenta el almacenamiento internamente — el front-end no necesita manejar lógica de reintento


# RF-12 - Sampling Frequency Configuration

## Vista
Panel de configuración con encabezado verde oscuro, fondo gris claro y tarjetas blancas con esquinas redondeadas. Controles en barra horizontal superior (dropdowns + botón); tarjetas de estado de sensores debajo con etiquetas color-coded (verde = activo/aplicado, naranja = pendiente, gris oscuro = offline).

## Acciones
- Seleccionar sensor desde dropdown (lista por ID/nombre)
- Seleccionar nuevo intervalo de muestreo desde segundo dropdown
- Clic en **"Guardar configuración"** para aplicar y disparar MQTT
- El sistema muestra tarjeta de estado actualizada por sensor

## API
```
PATCH /api/v1/sensors/{sensor_id}/sampling-frequency
Authorization: Bearer <token>
Content-Type: application/json

BODY:
{ "sampling_interval_seconds": 60 }

RESPUESTAS:
200 OK  → { "sensor_id": "...", "sampling_interval_seconds": 60, "sync_status": "sent_to_device" }
202 ACC → { "sensor_id": "...", "sampling_interval_seconds": 300, "sync_status": "pending" }
400 ERR → { "code": "INVALID_INTERVAL", "message": "..." }
```

## MQTT
```
TOPIC:   greenhouse/{greenhouse_id}/sensor/{sensor_id}/config
PAYLOAD: { "command": "update_sampling_frequency", "sampling_interval_seconds": 60, "timestamp": "ISO8601" }
```

## Reglas
- Intervalo válido: **10 a 3600 segundos**; fuera de rango → rechazar con `INVALID_INTERVAL`
- Sensor offline → guardar config como `pending`; aplicar automáticamente al reconectar
- Fallo MQTT → reintentar entrega o marcar como pendiente
- Usuario debe estar autenticado y con permiso de configuración de sensores
- El sensor debe existir y estar registrado en el sistema


# RF-13 - Offline Sensor Detection

## Vista
Tabla de estado full-width dentro de tarjeta blanca con esquinas redondeadas, fondo gris claro. Encabezado verde oscuro centrado ("Estado de sensores"); fila de cabecera de tabla en verde claro con labels en verde oscuro bold. Estado es el diferenciador visual principal mediante color de texto.

## Acciones
- Operador navega a la sección de estado de sensores
- Sistema carga tabla automáticamente vía `GET /api/v1/sensors/status`
- Tabla se refresca en intervalo configurable (ej. cada 10 segundos)
- Filas actualizan estado en tiempo real al cambiar Online ↔ Offline

## API
```
GET /api/v1/sensors/status
Authorization: Bearer <token>

RESPUESTA 200 OK:
{
  "sensors": [
    { "sensor_id": "sensor_001", "status": "online",   "last_seen": "ISO8601" },
    { "sensor_id": "sensor_002", "status": "inactive", "last_seen": "ISO8601" },
    { "sensor_id": "sensor_003", "status": "offline",  "last_seen": "ISO8601" }
  ]
}
```

## MQTT (LWT)
```
TOPIC:   greenhouse/{greenhouse_id}/sensor/{sensor_id}/status
PAYLOAD: { "sensor_id": "...", "status": "offline", "timestamp": "ISO8601" }
```
El backend suscribe a este topic; al recibir LWT actualiza estado en BD.

## Reglas
- **3 estados posibles:** `online` (datos dentro del intervalo), `inactive` (sin datos recientes, sin superar umbral), `offline` (umbral superado o LWT recibido)
- Umbral de inactividad es **configurable**
- Reconexión + datos nuevos → estado vuelve a `online` automáticamente
- Falsa detección por red → se corrige al reanudar datos (sin intervención manual)
- Color-coding: verde = online, naranja = inactivo, rojo = offline


# RF-14 - Anomalous Reading Validation and Discarding

## Vista
Dashboard de validación con encabezado verde oscuro centrado. Fila superior de 3 tarjetas métricas (verde claro = válidas, amarillo/beige = pendientes, rojo/rosa = inválidas) con número grande en color acento y label gris. Tabla full-width con cabecera verde claro mostrando resultados individuales por sensor; texto naranja en sensores con problemas.

## Acciones
- Sistema valida lecturas automáticamente al recibirlas (sin acción del operador)
- Operador abre panel para revisar resumen y tabla de validación
- Lecturas **Inválidas** → excluidas de control, alertas y AI
- Lecturas **Pendientes** → en espera de que el admin configure rangos válidos
- Dashboard muestra advertencia si un sensor acumula anomalías repetidas

## API
```
POST /api/v1/readings/validate
Authorization: Bearer <token-device>
Content-Type: application/json

BODY:
{ "sensor_id": "sensor_002", "value": 145, "unit": "%", "timestamp": "ISO8601" }
(value puede ser null para dato ausente)

RESPUESTAS 201:
{ "status": "valid",   "used_for_control": true,  "message": "..." }
{ "status": "invalid", "used_for_control": false, "reason": "Value outside allowed range" }
{ "status": "pending", "used_for_control": false, "reason": "Rango no definido" }

RESPUESTA 400:
{ "code": "MALFORMED_READING", "message": "..." }
```

## Reglas
- Rangos válidos por tipo de sensor:

| Tipo            | Variable         | Rango           | Unidad |
|-----------------|------------------|-----------------|--------|
| temperature     | Temperatura aire | -10 a 80        | °C     |
| humidity_air    | Humedad aire     | 0 a 100         | %      |
| humidity_soil   | Humedad suelo    | 0 a 100         | %      |
| light           | Luz              | 0 a 100,000     | lux    |
| co2             | CO₂              | 300 a 5,000     | ppm    |

- `value: null` → inválida por dato ausente
- Sin rango configurado para el tipo → estado `pending`, no se procesa
- Lecturas inválidas: almacenadas en log de errores, **nunca** usadas en actuadores, alertas ni AI
- Anomalías repetidas → sensor marcado como potencialmente defectuoso + advertencia al operador
- Payload malformado → `400 MALFORMED_READING`, se registra evento de error


# RF-15 - Real-Time Data Visualization

## Vista
Dashboard principal con encabezado verde oscuro centrado ("Dashboard en tiempo real"). Sección 1: grilla 2×2 de tarjetas métricas (fondo verde claro, valor en verde oscuro bold, label gris). Sección 2: gráfica de línea full-width (fondo blanco, línea azul con puntos de datos, grilla clara, leyenda en esquina superior derecha). Fondo de página gris claro. Si hay retraso de datos: banner/badge de advertencia con timestamp de última lectura.

## Acciones
- Usuario navega al dashboard y las tarjetas y gráfica cargan automáticamente
- Sistema refresca tarjetas métricas cada **5–10 segundos** (polling o WebSocket)
- Gráfica de línea acumula historial de la sesión y se actualiza con cada nuevo dato
- Si no llegan datos nuevos → advertencia visible de valores desactualizados + último valor conocido se mantiene

## API
```
--- OPCIÓN A: REST Polling ---
GET /api/v1/readings/realtime?greenhouse_id=gh_001
Authorization: Bearer <token-user>

RESPUESTA 200 OK:
{
  "greenhouse_id": "gh_001",
  "data": {
    "temperature": 24.5,
    "humidity_air": 60,
    "humidity_soil": 45,
    "light": 800,
    "timestamp": "ISO8601"
  }
}

--- OPCIÓN B: WebSocket (Recomendado) ---
EVENT: sensor_update
{
  "event": "sensor_update",
  "data": {
    "temperature": 24.8,
    "humidity_air": 61,
    "timestamp": "ISO8601"
  }
}
(Campos ausentes = dato no disponible para esa variable en ese momento)
```

## Reglas
- Actualización cada **5–10 segundos**; WebSocket es la opción preferida por menor latencia
- Variables mostradas: `temperature` (°C), `humidity_air` (%), `humidity_soil` (%), `light` (lux)
- Sin datos recientes → mostrar último valor conocido + indicador visual de retraso
- Sensor offline → marcar variable como **no disponible** (no ocultar)
- Alta latencia → ajustar tasa de refresco o mostrar indicador de carga
- Solo lecturas **válidas** (RF-14) deben alimentar el dashboard

## MO3- CONTROL(Majo)

# RF-16 - Activación y Desactivación de Actuadores

## Vista
Pantalla centrada con fondo blanco. Encabezado verde oscuro + subtítulo gris. Cuerpo: fila de 3 tarjetas (una por actuador) con ícono centrado, nombre en negrita, etiqueta de estado con color semántico (verde = encendido, rojo/naranja = apagado) y dos botones lado a lado: `ON` (fondo verde oscuro, texto blanco) y `OFF` (fondo rojo, texto blanco). En error de timeout: mensaje sobre la tarjeta correspondiente.

**Actuadores:**
| Tarjeta | Ícono | Estados posibles |
|---|---|---|
| Bomba de riego | 💧 gota azul | Apagada / Encendida |
| Ventilador | 🌀 ventilador | Apagado / Encendido |
| Iluminación | 💡 bombilla amarilla | Apagada / Encendida |

## Acciones
- Usuario presiona `ON` u `OFF` sobre un actuador
- Etiqueta de estado se actualiza en tiempo real al recibir confirmación MQTT
- Si no hay confirmación → mensaje de timeout sobre la tarjeta, último estado confirmado se mantiene

## API
```
POST /api/v1/actuators/{actuator_id}/commands
Authorization: Bearer <token-operator>

BODY:
{ "command": "ON", "source": "manual" }

RESPUESTAS:
200 → comando enviado:
  { "actuator_id": "...", "command": "ON", "status": "pending_confirmation" }

200 → estado confirmado:
  { "actuator_id": "...", "current_state": "ON", "confirmed_at": "ISO8601" }

403 → { "code": "INSUFFICIENT_PERMISSIONS", "message": "..." }
504 → { "code": "ACTUATOR_CONFIRMATION_TIMEOUT", "message": "..." }
```

## MQTT
```
COMANDO:
  TOPIC:   greenhouse/{greenhouse_id}/actuator/{actuator_id}/command
  PAYLOAD: { "command": "ON", "source": "manual", "requested_by": "user_001", "timestamp": "ISO8601" }
  (source posibles: "manual", "automatic", "scheduled")

CONFIRMACIÓN:
  TOPIC:   greenhouse/{greenhouse_id}/actuator/{actuator_id}/status
  PAYLOAD: { "actuator_id": "...", "state": "ON", "confirmed_at": "ISO8601" }
```

## Reglas
- Solo valores válidos para `command`: `"ON"` o `"OFF"`
- Usuario debe tener permiso explícito para controlar actuadores → `403` si no
- Actuador desconectado → bloquear comando, marcar como **no disponible**
- Sin confirmación MQTT → `504 ACTUATOR_CONFIRMATION_TIMEOUT`, UI mantiene último estado confirmado
- Estado UI se actualiza **solo tras confirmación del dispositivo**, no tras envío del comando


# RF-17 - Modo Automático Basado en Umbrales

## Vista
Pantalla fondo blanco, tipografía verde. Encabezado verde oscuro centrado + subtítulo gris. Barra de estado (fondo verde muy claro, borde redondeado) con label `Activado` en verde y botón `Cambiar modo` (verde oscuro, texto blanco). Sección de 3 tarjetas de variables (estado rojo si fuera de rango, verde si dentro). Tabla de reglas con encabezados verdes y filas alternas en verde claro.

**Tarjetas de variables:**
| Variable | Valor ejemplo | Estado fuera de rango | Acción |
|---|---|---|---|
| Humedad suelo | 28 % | Debajo del umbral mínimo (rojo) | Activar riego |
| Temperatura | 31 °C | Sobre el umbral máximo (rojo) | Activar ventilador |
| Luz | 400 lux | Dentro del rango (verde) | Ninguna |

## Acciones
- Operador activa/desactiva modo automático con botón `Cambiar modo`
- Tarjetas se actualizan en tiempo real con últimas lecturas
- En modo automático: sistema evalúa umbrales y envía comandos a actuadores sin intervención del usuario
- En modo manual: sin ejecución automática (ver RF-16)

## API
```
PATCH /api/v1/greenhouses/{greenhouse_id}/automatic-mode
Authorization: Bearer <token-operator>

BODY:
{ "automatic_mode": true }

RESPUESTAS:
200 → { "greenhouse_id": "gh_001", "automatic_mode": true, "message": "..." }
403 → { "code": "INSUFFICIENT_PERMISSIONS", "message": "..." }
```

> Los comandos automáticos a actuadores reutilizan el flujo MQTT de RF-16
> (`greenhouse/{greenhouse_id}/actuator/{actuator_id}/command` con `"source": "automatic"`)

## Reglas automáticas configuradas
| Variable | Umbral mín. | Umbral máx. | Actuador | Trigger |
|---|---|---|---|---|
| Humedad suelo | 35 % | 80 % | Bomba de riego | Encender si < mín |
| Temperatura | 18 °C | 30 °C | Ventilador | Encender si > máx |
| Luz | 500 lux | 9000 lux | Iluminación | Encender si < mín |

## Reglas de negocio
- Modo automático debe estar **habilitado** y umbrales **configurados** para ejecutar acciones
- Lectura inválida, ausente u obsoleta → **NO ejecutar** acción automática + generar advertencia
- Actuador no disponible → **NO enviar** comando + generar alerta al operador
- Sin confirmación MQTT del actuador → marcar acción como fallida + notificar operador
- Lectura dentro del rango → ninguna acción (estado pasivo)
- Toda acción automática ejecutada se **registra en historial de actuadores**


# RF-18 - Modo Manual Override

## Vista
Panel de actuadores con encabezado verde oscuro centrado ("Modo manual (override)"). Tarjetas apiladas verticalmente, cada una con: nombre en negrita, etiqueta de modo con color semántico (naranja = `Manual activo`, verde = `Automático activo`) y botones `Encender` (verde oscuro) | `Apagar` (rojo). Cuando override está activo: mensaje de aviso en texto naranja centrado — *"El modo automático está pausado para este actuador"*.

## Acciones
- Operador presiona `Encender` o `Apagar` → se activa override manual
- Etiqueta cambia de verde (`Automático activo`) a naranja (`Manual activo`)
- Aparece mensaje de aviso de pausa automática
- Al expirar el override (o cancelarlo) → etiqueta vuelve a verde, reglas automáticas retoman

## API
```
POST /api/v1/actuators/{actuator_id}/manual-override
Authorization: Bearer <token-operator>

BODY:
{ "command": "ON", "override_duration_minutes": 10 }

RESPUESTAS:
200 → { "actuator_id": "...", "mode": "manual", "expires_at": "ISO8601" }
403 → { "code": "INSUFFICIENT_PERMISSIONS", "message": "..." }
409 → { "code": "ACTUATOR_OFFLINE", "message": "..." }
```

## MQTT
```
TOPIC:   greenhouse/{greenhouse_id}/actuator/{actuator_id}/command
PAYLOAD: {
  "command": "ON",
  "mode": "manual_override",
  "override_duration_minutes": 10,
  "timestamp": "ISO8601"
}
```

## Reglas
- Comando manual tiene **mayor prioridad** que reglas automáticas (RF-17)
- Override pausa el control automático **solo para el actuador afectado**, no para todos
- El override tiene duración configurable (`override_duration_minutes`); al expirar → modo automático se reactiva
- Actuador offline → `409 ACTUATOR_OFFLINE`, comando rechazado
- Sin confirmación MQTT → notificar al usuario (timeout, ver RF-16)
- Usuario requiere permiso de control de actuadores → `403` si no lo tiene


# RF-19 - Programación de Riego

## Vista
Pantalla fondo blanco, encabezado verde oscuro centrado + subtítulo gris. Formulario horizontal de 4 elementos (dropdown día, time input, text input duración, botón `Guardar` verde oscuro). Tabla de programaciones con encabezados verdes y filas en verde claro alternas; columna `Estado` color-coded (verde = Activo, rojo = Inactivo); columna `Acciones` con botones `Desactivar` (naranja) / `Activar` (verde) + `Eliminar` (rojo).

## Acciones
- Operador completa formulario (día + hora + duración) y presiona `Guardar` → nueva fila aparece como `Activo`
- `Desactivar` → programación queda en tabla pero no se ejecuta
- `Activar` → reactiva programación existente
- `Eliminar` → eliminación permanente
- El sistema ejecuta automáticamente la bomba al llegar la hora programada (sin acción del operador)

## API
```
POST /api/v1/irrigation-schedules
Authorization: Bearer <token-operator>

BODY:
{
  "greenhouse_id": "gh_001",
  "actuator_id": "actuator_001",
  "weekday": "MONDAY",          // enum: MONDAY..SUNDAY
  "start_time": "06:00",        // formato HH:mm (24h)
  "duration_minutes": 15,
  "enabled": true
}

RESPUESTAS:
201 → { "schedule_id": "schedule_001", "message": "..." }
400 → { "code": "INVALID_SCHEDULE", "message": "..." }
```

> Activación/desactivación y eliminación de programaciones existentes requieren endpoints adicionales no detallados en el documento (PATCH/DELETE sobre `/api/v1/irrigation-schedules/{schedule_id}`).

## MQTT
Al llegar la hora programada el backend reutiliza el flujo de RF-16:
- **Encendido:** topic `actuator/{id}/command` con `"command": "ON", "source": "scheduled"`
- **Apagado:** mismo topic con `"command": "OFF"` tras `duration_minutes`

## Reglas
- Campos requeridos: `weekday`, `start_time` (HH:mm 24h), `duration_minutes` (entero positivo)
- Duración inválida → `400 INVALID_SCHEDULE`
- Superposición de horarios → `400 INVALID_SCHEDULE` con advertencia de conflicto
- Programación deshabilitada (`enabled: false`) → el sistema la omite en tiempo de ejecución
- Bomba desconectada al momento de ejecución → cancelar ciclo + generar alerta al operador
- Programaciones coexisten con modo automático (RF-17) y pueden ser anuladas por override manual (RF-18)
- Cada ejecución se registra en el historial de actuadores


# RF-20 - Límite de Duración Máxima de Acción de Actuadores

## Vista
Pantalla fondo blanco, encabezado verde oscuro centrado + subtítulo gris. Formulario horizontal de 3 elementos (dropdown actuador, text input duración en minutos, botón `Guardar límite` verde oscuro). Tabla de estado actual con encabezados verdes y color-coding en columna `Estado`: verde = Normal, naranja = Cerca del límite, rojo = Límite alcanzado.

**Tabla de referencia visual:**
| Actuador | Límite | Tiempo actual | Estado |
|---|---|---|---|
| Bomba de riego | 30 min | 12 min | Normal (verde) |
| Ventilador | 60 min | 55 min | Cerca del límite (naranja) |
| Iluminación | 120 min | 120 min | Límite alcanzado (rojo) → apagado auto |

## Acciones
- Operador selecciona actuador, ingresa duración máxima y presiona `Guardar límite`
- Tabla refleja en tiempo real el tiempo acumulado de cada actuador
- Al alcanzar el límite → sistema ejecuta apagado automático sin intervención del usuario
- Si actuador no confirma apagado → evento marcado como **crítico** + notificación al operador

## API
```
PATCH /api/v1/actuators/{actuator_id}/max-duration
Authorization: Bearer <token-operator>

BODY:
{ "max_continuous_minutes": 30 }

RESPUESTAS:
200 → { "actuator_id": "...", "max_continuous_minutes": 30, "message": "..." }
400 → { "code": "INVALID_DURATION", "message": "..." }
```

> ⚠️ **Bug en documento original:** el payload del `400` es idéntico al del `200`. Se recomienda corregir a `{ "code": "INVALID_DURATION", "message": "..." }` antes de implementar.

> El comando de apagado automático reutiliza el flujo MQTT de RF-16
> (`actuator/{id}/command` con `"command": "OFF", "source": "automatic"`)

## Reglas
- El sistema monitorea el tiempo de operación continua desde el encendido del actuador
- Al alcanzar `max_continuous_minutes` → enviar `OFF` automáticamente + registrar evento + generar alerta
- Actuador no responde al `OFF` → marcar como **evento crítico** + notificar operador
- Valor de duración inválido → `400 INVALID_DURATION` (rechazar configuración)
- Si el actuador se detiene antes del límite → fin normal, sin alerta crítica
- Aplica independientemente del origen del encendido: manual, automático o programado (RF-16, RF-17, RF-18, RF-19)


# RF-21 - Registro del Historial de Acciones de Actuadores

## Vista
Pantalla con barra de filtros horizontal (dropdown de actuador, dropdown de tipo de acción, dos date inputs de rango y botón "Consultar" en verde oscuro) seguida de una tabla de resultados. Encabezado centrado en verde oscuro. Columnas `Tipo` y `Resultado` con codificación de color (Programado: azul | Automático: verde oscuro | Manual: naranja | Exitoso: verde | Fallido: rojo). Campos `Fin` y `Duración` muestran `--` cuando la acción falló o no se completó.

## Acciones
- Seleccionar actuador desde dropdown (opcional)
- Seleccionar tipo de acción desde dropdown (opcional)
- Ingresar rango de fechas `desde` / `hasta` (opcional)
- Presionar `Consultar` → la tabla se actualiza con los registros coincidentes

## API
```
GET /api/v1/actuator-history?actuator_id={id}&from={YYYY-MM-DD}&to={YYYY-MM-DD}
```
**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "actuator_id": "string",
  "history": [
    {
      "start_time": "ISO 8601",
      "end_time": "ISO 8601 | null",
      "duration_minutes": "integer | null",
      "source": "manual | automatic | scheduled",
      "result": "success | failed | timeout | partial"
    }
  ]
}
```

**Evento interno de registro (sin endpoint directo):**
```json
{
  "actuator_id": "string",
  "action": "ON | OFF",
  "source": "manual | automatic | scheduled",
  "start_time": "ISO 8601",
  "end_time": "ISO 8601",
  "result": "success | failed"
}
```

## Reglas
- `end_time` y `duration_minutes` deben ser `null` si la acción falló, no se confirmó o fue parcial.
- El sistema debe registrar fallos y timeouts con su estado correspondiente (no omitirlos).
- El origen (`source`) es obligatorio en cada registro: siempre debe identificarse si la acción fue manual, automática o programada.
- Los filtros son opcionales; si no se aplican, se retorna todo el historial disponible en el rango.
# RF-22 - Configuración de Umbrales

## Vista
Pantalla con encabezado en verde oscuro centrado y subtítulo en gris claro. Formulario horizontal de nueva regla con 5 campos (dropdowns de invernadero, variable y severidad; inputs numéricos de mínimo y máximo) y botón "Guardar umbral" en verde oscuro. Tabla inferior con encabezados en verde y codificación de color: Severidad (Crítico: rojo | Advertencia: naranja) y Estado (Activo: verde | Inactivo: gris). Mensaje de confirmación temporal con fondo verde claro al guardar exitosamente.

## Acciones
- Seleccionar invernadero y variable ambiental desde dropdowns
- Ingresar valores numéricos de mínimo y máximo
- Seleccionar severidad (`Advertencia` o `Crítico`)
- Presionar `Guardar umbral` → aparece mensaje de confirmación verde y nueva fila en la tabla
- Si mínimo ≥ máximo → el sistema muestra error de validación (no guarda)

## API
```
POST /api/v1/threshold-rules
```
**Headers:** `Authorization: Bearer <token-operator>`

**Request:**
```json
{
  "greenhouse_id": "string",
  "variable": "temperature | air_humidity | soil_moisture | light_intensity",
  "min_value": "number",
  "max_value": "number",
  "unit": "C | % | lux",
  "severity": "warning | critical",
  "enabled": "boolean"
}
```

**Response 201:**
```json
{
  "message": "Threshold rule created successfully",
  "rule_id": "string"
}
```

**Response 400:**
```json
{
  "code": "INVALID_THRESHOLD_RANGE",
  "message": "Minimum value must be lower than maximum value"
}
```

## Reglas
- `min_value` debe ser estrictamente menor que `max_value`; de lo contrario el backend retorna `400 INVALID_THRESHOLD_RANGE`.
- Si ya existe una regla para el mismo invernadero + variable, el sistema actualiza en lugar de duplicar.
- `enabled: false` permite guardar la regla sin activarla (no se aplica a alertas ni control automático hasta activarse).
- Solo usuarios con rol administrador u operador pueden crear o modificar umbrales.
- Si la variable no tiene sensor activo asociado, la regla se guarda pero el sistema debe advertirlo.

## MO4- CULTIVOS(Tamayo)

# RF-23 - Generación y Gestión de Alertas

## Vista
Pantalla con encabezado en verde oscuro centrado. Fila superior de 3 tarjetas de resumen en colores pastel: Total alertas (fondo verde claro, texto negro), Advertencias (fondo crema, número naranja), Críticas (fondo rojo claro, número rojo oscuro). Tabla inferior con encabezados en negrita sobre fondo verde muy claro y filas alternas; columna `Severidad` con texto en negrita coloreado (Crítico: rojo | Advertencia: naranja).

## Acciones
- Visualizar tarjetas de resumen estadístico (se actualizan en tiempo real)
- Consultar tabla cronológica de alertas con columnas: Fecha, Origen, Descripción, Severidad
- Filtrar por `greenhouse_id`, rango de fechas (`from` / `to`) y, opcionalmente, por origen o severidad

## API
```
GET /api/v1/alerts?greenhouse_id={id}&from={YYYY-MM-DD}&to={YYYY-MM-DD}
```
**Headers:** `Authorization: Bearer <token-user>`

**Response 200:**
```json
{
  "alerts": [
    {
      "alert_id": "string",
      "source": "temperature | air_humidity | soil_moisture | light_intensity | sensor | actuator",
      "description": "string",
      "severity": "warning | critical",
      "timestamp": "ISO 8601"
    }
  ]
}
```

## Reglas
- Las alertas se generan por tres orígenes distintos: umbral superado (variable ambiental), sensor desconectado (`source: "sensor"`) y fallo de actuador (`source: "actuator"`).
- `severity` siempre debe ser `"warning"` o `"critical"`; los fallos de actuador generan automáticamente severidad `"critical"`.
- Si una alerta no puede almacenarse, el sistema debe registrar el error y reintentar (no descartarla silenciosamente).
- El sistema debe agrupar o actualizar alertas duplicadas para evitar redundancia en la tabla.
- Las tarjetas de resumen deben reflejar conteos en tiempo real (total, advertencias, críticas).


# RF-24 - User Notifications

## Vista
Panel con dos secciones: lista de alertas activas (ícono de color por severidad 🔴 crítico / 🟡 advertencia, descripción y tiempo relativo) y preferencias de notificación (3 checkboxes: notificaciones en app, correo y push). Botón `Guardar preferencias` al pie del panel. Sin encabezado de color explícito definido; diseño orientado a gestión rápida desde panel lateral o modal.

## Acciones
- Visualizar alertas activas con indicador de severidad y tiempo transcurrido
- Activar/desactivar canales de notificación mediante checkboxes (in-app, email, push)
- Presionar `Guardar preferencias` → persiste la configuración del usuario
- El sistema envía notificaciones automáticamente al generarse una alerta, sin acción manual del usuario

## API
```
POST /api/v1/notifications
```
**Headers:** `Authorization: Bearer <token-system>`

**Request:**
```json
{
  "user_id": "string",
  "alert_id": "string",
  "channel": "push | email | in-app",
  "message": "string",
  "severity": "warning | critical"
}
```

**Response 200:**
```json
{
  "message": "Notification sent successfully",
  "status": "delivered"
}
```

**Response 500:**
```json
{
  "code": "NOTIFICATION_FAILED",
  "message": "Unable to deliver notification"
}
```

## Reglas
- Las notificaciones críticas se envían siempre de forma inmediata; las de advertencia solo si el canal correspondiente está habilitado en preferencias.
- Si un canal no está disponible, el sistema debe intentar canales alternativos configurados antes de registrar fallo.
- En caso de fallo de entrega (`500 NOTIFICATION_FAILED`), el sistema debe reintentar o registrar el error (no descartarlo silenciosamente).
- El endpoint `POST /api/v1/notifications` es llamado por el sistema backend (token de sistema), no por el usuario directamente.
- Las preferencias de notificación deben estar configuradas previamente; si no lo están, el sistema no envía notificaciones.
# RF-25 - Operator Notes and Observations

## Vista
Panel con dos secciones: formulario de nueva observación (dropdown de cultivo, date input `dd/mm/aaaa` y textarea con placeholder "Escribe una observación del cultivo...") y botón `Guardar observación`. Debajo, tabla de observaciones recientes con columnas: Título, Descripción, Fecha y Operador. Sin especificación de paleta de colores; diseño orientado a registro rápido de campo.

## Acciones
- Seleccionar cultivo desde dropdown
- Ingresar fecha de la observación
- Escribir texto libre en el textarea
- Presionar `Guardar observación` → la nota aparece en la tabla de observaciones recientes
- Si el textarea está vacío al guardar → el sistema rechaza el registro con error

## API
```
POST /api/v1/crops/{crop_id}/notes
```
**Headers:** `Authorization: Bearer <token-operator>`

**Request:**
```json
{
  "note": "string",
  "date": "YYYY-MM-DD"
}
```

**Response 201:**
```json
{
  "message": "Crop note registered successfully",
  "note_id": "string"
}
```

**Response 400:**
```json
{
  "code": "EMPTY_NOTE",
  "message": "The observation text cannot be empty"
}
```

## Reglas
- El campo `note` no puede estar vacío; el sistema debe rechazar el registro con `EMPTY_NOTE`.
- El `crop_id` debe existir en el sistema; si no existe, el backend retorna error (crop not found).
- El operador debe estar autenticado; la nota queda asociada a su ID automáticamente.
- Las notas son de texto libre sin restricción de formato; se almacenan con fecha, cultivo y operador.


# RF-26 - Harvest Date Estimation

## Vista
Panel de planificación con dos secciones: tabla resumen de todos los cultivos activos (Cultivo, Invernadero, Siembra, Ciclo, Estado, Cosecha estimada) donde los cultivos sin ciclo configurado muestran "(por definir)". Sección de detalle por cultivo con campos individuales en formato clave-valor, ícono 📅 en la fecha estimada, indicador de estado de maduración con emoji y botón `Actualizar estimación`. Sin paleta de colores explícita definida.

## Acciones
- Visualizar tabla resumen de cosechas estimadas por cultivo
- Abrir detalle de un cultivo para ver fecha de siembra, ciclo esperado, estado actual, cosecha estimada y estado de maduración
- Presionar `Actualizar estimación` → el sistema recalcula con datos actuales y/o resultado de IA de madurez
- Si el ciclo de la especie no está configurado → el campo muestra "(por definir)" sin acción adicional requerida del sistema

## API
```
GET /api/v1/crops/{crop_id}/harvest-estimation
```
**Headers:** `Authorization: Bearer <token-user>`

**Response 200:**
```json
{
  "crop_id": "string",
  "species": "string",
  "sowing_date": "YYYY-MM-DD",
  "expected_cycle_days": "integer",
  "estimated_harvest_date": "YYYY-MM-DD",
  "maturity_status": "in_progress | ready | harvested | unavailable",
  "source": "species_cycle | species_cycle_and_ai_adjustment"
}
```

**Response 400:**
```json
{
  "code": "MISSING_CROP_CYCLE",
  "message": "The crop species does not have an expected cycle configured"
}
```

## Reglas
- La estimación base se calcula como `sowing_date + expected_cycle_days`; si no hay ciclo configurado para la especie, retorna `MISSING_CROP_CYCLE`.
- Si existe resultado del modelo IA de madurez, puede ajustar la fecha estimada; el campo `source` refleja si se usó ajuste IA (`species_cycle_and_ai_adjustment`).
- Si el cultivo ya fue cosechado, el sistema debe mostrar la fecha real de cosecha en lugar de la estimación.
- Si no hay resultado IA disponible, la estimación se calcula únicamente con especie y fecha de siembra (`source: "species_cycle"`).
- La imagen del cultivo es entrada opcional para el modelo IA; su ausencia no bloquea la estimación base.


# RF-27 - Actual Harvest Registration

## Vista
Panel de formulario simple identificado con el nombre del cultivo e invernadero como encabezado (ej. "🍅 Tomate Cherry – Invernadero Norte"). Dos campos: date input de fecha de cosecha (`dd/mm/aaaa`) y campo de texto opcional para cantidad cosechada (ej. "150 kg"). Botón `Registrar cosecha`. Sin paleta de colores explícita; diseño orientado a cierre rápido del ciclo de cultivo.

## Acciones
- Ingresar fecha real de cosecha (obligatorio)
- Ingresar cantidad cosechada: peso, volumen o unidades (opcional)
- Presionar `Registrar cosecha` → el sistema marca el cultivo como cosechado, reemplaza la fecha estimada con la real y cierra el ciclo
- Si el cultivo ya fue cosechado previamente → el sistema rechaza la operación con error

## API
```
POST /api/v1/crops/{crop_id}/harvest
```
**Headers:** `Authorization: Bearer <token-operator>`

**Request:**
```json
{
  "harvest_date": "YYYY-MM-DD",
  "harvest_quantity": "number (opcional)"
}
```

**Response 200:**
```json
{
  "message": "Harvest registered successfully",
  "crop_id": "string",
  "status": "harvested"
}
```

**Response 400:**
```json
{
  "code": "CROP_ALREADY_HARVESTED",
  "message": "This crop has already been marked as harvested"
}
```

## Reglas
- `harvest_date` es obligatorio; una fecha inválida debe ser rechazada por el sistema.
- `harvest_quantity` es opcional; su ausencia no bloquea el registro.
- La operación solo puede ejecutarse si el cultivo está activo (no cosechado); si ya tiene estado `"harvested"` el backend retorna `CROP_ALREADY_HARVESTED`.
- Al registrar exitosamente, la fecha estimada de RF-26 queda reemplazada por la fecha real y el estado del cultivo pasa a `"harvested"` de forma permanente.

## MO5- INVENTARIO(Santiago)

# RF-28 - Crop History Management

## Vista
Panel con dos filtros superiores (selector de tipo de cultivo y date input de rango `dd/mm/aaaa`). Tabla de histórico con columnas: Cultivo, Fecha siembra, Fecha estimada, Fecha cosecha y Estado; el estado usa íconos visuales (✅ Completado | ⚠️ Datos incompletos). Sección de detalle por cultivo en formato clave-valor, destacando la diferencia entre fecha estimada y real (ej. "2 días antes de lo estimado"). Si `actual_harvest_date` es null → columna muestra guion y estado ⚠️.

## Acciones
- Filtrar historial por tipo de cultivo y/o rango de fechas
- Visualizar tabla con todos los ciclos completados o incompletos
- Seleccionar un cultivo para ver su detalle completo (fechas, observaciones, datos ambientales, cosecha)
- Si no hay datos históricos → el sistema muestra mensaje informativo sin tabla

## API
```
GET /api/v1/crops/history?from={YYYY-MM-DD}&to={YYYY-MM-DD}
```
**Headers:** `Authorization: Bearer <token-user>`

**Response 200:**
```json
{
  "crops": [
    {
      "crop_id": "string",
      "species": "string",
      "sowing_date": "YYYY-MM-DD",
      "estimated_harvest_date": "YYYY-MM-DD",
      "actual_harvest_date": "YYYY-MM-DD | null",
      "status": "completed | incomplete"
    }
  ]
}
```

## Reglas
- `actual_harvest_date: null` indica ciclo incompleto; el sistema debe mostrarlo con advertencia ⚠️, no ocultarlo.
- Si los datos históricos están incompletos, el sistema debe mostrar la información disponible acompañada de una advertencia visible (no bloquear la vista).
- Si no existe ningún registro en el rango consultado, el sistema muestra un mensaje indicando que no hay datos disponibles.
- Los filtros `from` y `to` son opcionales; sin ellos se retorna todo el historial disponible.
- El detalle de un cultivo debe incluir: fechas clave, observaciones del operador (RF-25), condiciones ambientales y resultado de cosecha (RF-27).


# RF-29 - Resource Consumption Registration

## Vista
Panel con formulario de registro superior (4 campos en fila: dropdown de insumo, dropdown de cultivo, input numérico de cantidad y campo/dropdown de unidad) y botón `Registrar consumo`. Tabla de historial inferior con columnas: Fecha, Recurso/Insumo, Cantidad, Cultivo y Origen. La columna `Origen` distingue visualmente entre **Automático** (por sistema de riego) y **Manual** (ingresado por operador). Sin paleta de colores explícita definida.

## Acciones
- Seleccionar insumo y cultivo desde dropdowns
- Ingresar cantidad usada y unidad (L, kg, mL, etc.)
- Presionar `Registrar consumo` → el sistema almacena el movimiento y actualiza el inventario
- Si el stock es insuficiente → el sistema muestra advertencia antes de confirmar o bloquear el registro
- El registro de agua por riego es **automático** al finalizar una activación de irrigación (sin acción manual del operador)

## API
```
POST /api/v1/inventory/consumption
```
**Headers:** `Authorization: Bearer <token-operator>`

**Request:**
```json
{
  "item_id": "string",
  "crop_id": "string",
  "quantity": "number",
  "unit": "L | kg | mL | string",
  "source": "manual | automatic"
}
```

**Response 200:**
```json
{
  "message": "Resource consumption registered successfully",
  "movement_id": "string"
}
```

## Reglas
- El consumo de agua por riego se calcula automáticamente como `duración × caudal configurado`; si el actuador no tiene caudal configurado, el sistema registra la duración pero marca el consumo de agua como pendiente de cálculo.
- Si el stock disponible es insuficiente, el sistema debe advertir al usuario antes de registrar (no rechazar silenciosamente).
- `quantity` debe ser un valor numérico positivo; cualquier valor inválido debe ser rechazado.
- El campo `source` es obligatorio y debe identificar si el origen es `"manual"` o `"automatic"`.
- Cada registro de consumo actualiza el inventario disponible del insumo correspondiente.


# RF-30 - General System Dashboard

## Vista
Panel de control principal con dos zonas: fila de 4 tarjetas KPI (Temperatura °C, Humedad %, Alertas activas, Actuadores activos) con íconos representativos y valores en tiempo real. Gráfico de línea de temperatura de los últimos 15 minutos con escala Y entre 22.0–25.0 °C. Tabla de funcionalidades adicionales: estado de sensores, conteo de alertas y estado de actuadores, todo en vista única sin necesidad de navegar a otros módulos. Si un módulo no tiene datos → el sistema muestra la sección con advertencia visible, no la oculta.

## Acciones
- Visualizar KPIs en tiempo real al abrir el dashboard (sin interacción requerida)
- Leer el gráfico de tendencia de temperatura de los últimos 15 minutos
- Identificar alertas activas y estado de actuadores desde la vista principal
- Si no hay datos en algún módulo → el sistema muestra indicador de estado normal o advertencia de módulo no disponible

## API
```
GET /api/v1/dashboard/summary
```
**Headers:** `Authorization: Bearer <token-user>`

**Response 200:**
```json
{
  "environment": {
    "temperature": "number (°C)",
    "humidity": "number (%)",
    "light": "number (lux)"
  },
  "alerts": {
    "total": "integer",
    "critical": "integer",
    "warning": "integer"
  },
  "actuators": {
    "active": "integer",
    "inactive": "integer"
  },
  "crops": {
    "active": "integer",
    "harvested": "integer"
  },
  "consumption": {
    "water_today_liters": "number"
  }
}
```

## Reglas
- El dashboard agrega datos de múltiples módulos (sensores, actuadores, alertas, cultivos, consumo) en una sola llamada.
- Si algún módulo no tiene datos disponibles, el sistema debe mostrar la sección con advertencia; no debe bloquear la carga del dashboard completo.
- Si no hay alertas activas, el sistema debe mostrar un indicador de "estado normal" en lugar de un contador vacío.
- Los datos de ambiente y actuadores deben reflejar valores en tiempo real; los indicadores de cultivos y consumo pueden ser datos del día actual.
- El gráfico de temperatura requiere datos históricos de los últimos 15 minutos con resolución de 5 minutos (endpoint de series de tiempo separado o incluido en la respuesta extendida).


# RF-31 - Reports and Analytics

## Vista
Panel con barra de filtros de 3 elementos (dropdown de tipo de reporte, date input de rango `dd/mm/aaaa` y dropdown de invernadero) y botón `Generar reporte`. Área principal con gráfico de barras o líneas por variable (ej. consumo de agua en L por día de la semana, escala Y 0–180 L). Sin paleta de colores explícita. El panel incluye funcionalidades de identificación de patrones y botón de exportación para descarga del reporte generado.

## Acciones
- Seleccionar tipo de reporte desde dropdown (consumo, rendimiento, clima, actuadores, etc.)
- Ingresar rango de fechas (`from` / `to`)
- Seleccionar invernadero (opcional)
- Presionar `Generar reporte` → el sistema procesa los datos y renderiza gráfico + tabla
- Presionar exportar → el sistema genera un archivo descargable con los datos del reporte
- Si no hay datos suficientes → el sistema notifica que el reporte no puede generarse o lo genera parcialmente con advertencia

## API
```
GET /api/v1/reports?type={report_type}&from={YYYY-MM-DD}&to={YYYY-MM-DD}
```
**Headers:** `Authorization: Bearer <token-user>`

**Query params opcionales:** `greenhouse_id`, `crop_id`

**Response 200:**
```json
{
  "report_type": "consumption | environment | actuators | crops",
  "data": [
    {
      "date": "YYYY-MM-DD",
      "water_liters": "number"
    }
  ]
}
```
> La estructura de cada objeto en `data[]` varía según `report_type` (ej. para `environment` incluiría temperatura, humedad, luz; para `actuators` incluiría conteo de activaciones, duración, etc.).

## Reglas
- Los filtros `from` y `to` son obligatorios para generar el reporte; `greenhouse_id` y `crop_id` son opcionales.
- Si no hay datos en el rango solicitado, el sistema debe informar al usuario en lugar de retornar un array vacío sin contexto.
- Si los datos son parciales, el sistema genera el reporte con la información disponible e incluye una advertencia visible.
- La exportación es opcional y debe soportar al menos un formato descargable (CSV o PDF).
- Los tipos de reporte soportados deben estar documentados como enum en el backend: `consumption`, `environment`, `actuators`, `crops`.

## MO6- ALERTAS Y REPORTES(Majo)

# RF-32 - Threshold-Based Alerts

## Vista
Panel de alertas activas recientes con tabla de 6 columnas: #, Variable (con ícono 🌡️💧), Descripción, Valor detectado, Severidad (🔴 Crítica | 🟡 Advertencia) y Fecha/hora. Leyenda de severidad al pie de la tabla. Botón `Ver todas las alertas` para navegar al módulo completo de alertas (RF-23). El panel es de solo lectura; las alertas son generadas automáticamente por el sistema backend.

## Acciones
- Visualizar alertas activas recientes generadas automáticamente por violación de umbrales
- Identificar severidad visualmente por ícono de color (🔴 acción inmediata | 🟡 monitorear)
- Presionar `Ver todas las alertas` → navega al módulo de alertas (RF-23)
- No hay acciones manuales de creación; el disparo es 100% automático por el backend al procesar una lectura

## API
```
POST /api/v1/alerts/threshold
```
**Headers:** `Authorization: Bearer <token-system>`

**Request:**
```json
{
  "greenhouse_id": "string",
  "sensor_reading_id": "string",
  "threshold_rule_id": "string",
  "variable": "temperature | air_humidity | soil_moisture | light_intensity",
  "value": "number",
  "severity": "warning | critical"
}
```

**Response 200:**
```json
{
  "message": "Threshold alert generated successfully",
  "alert_id": "string",
  "notification_status": "sent | failed"
}
```

**Response 500:**
```json
{
  "code": "NOTIFICATION_SERVICE_ERROR",
  "message": "Alert was stored but notification could not be delivered"
}
```

## Reglas
- Este endpoint es llamado exclusivamente por el sistema backend (token de sistema), no por el usuario.
- La alerta **siempre debe almacenarse** aunque el servicio de notificación falle; el fallo de entrega no impide el registro.
- Si la notificación falla (`NOTIFICATION_SERVICE_ERROR`), el sistema debe reintentar la entrega; el `alert_id` ya queda creado.
- Las reglas de umbral deben estar activas (`enabled: true` de RF-22) para que se evalúen lecturas.
- Si la lectura está dentro del rango normal, el sistema no llama a este endpoint (ninguna alerta se genera).
- Las notificaciones se envían por push obligatoriamente; email es opcional según preferencias del usuario (RF-24).


# RF-33 - In-App Notification Center

## Vista
Panel de centro de notificaciones con tabla de 7 columnas: #, Evento (con ícono temático 🔥💧), Descripción, Severidad (🔴 Crítica | 🟡 Advertencia), Tiempo relativo (ej. "Hace 2 minutos"), Acción sugerida (con ícono) y Opciones inline por fila (Marcar como leída / Archivar / Eliminar). Notificaciones ordenadas cronológicamente de más reciente a más antigua. Si no hay notificaciones → mensaje de estado vacío "No notifications available".

## Acciones
- Abrir el centro de notificaciones → el sistema carga la lista ordenada por fecha
- Marcar como leída → cambia `status` de `"unread"` a `"read"`
- Archivar → retira la notificación de la lista activa (sin eliminarla definitivamente)
- Eliminar → elimina la notificación de forma permanente
- Cada acción actualiza la lista inmediatamente (refresh de UI)

## API
```
GET /api/v1/notifications
```
**Headers:** `Authorization: Bearer <token-user>`

**Response 200:**
```json
{
  "notifications": [
    {
      "notification_id": "string",
      "alert_id": "string",
      "title": "string",
      "message": "string",
      "severity": "warning | critical",
      "status": "unread | read | archived",
      "suggested_action": "string",
      "created_at": "ISO 8601"
    }
  ]
}
```

> Acciones de gestión implican endpoints adicionales no detallados en el documento original:
> - `PATCH /api/v1/notifications/{notification_id}` -> actualizar `status` (read / archived)
> - `DELETE /api/v1/notifications/{notification_id}` -> eliminar definitivamente

## Reglas
- Las notificaciones se muestran ordenadas por `created_at` descendente (más recientes primero).
- Si no existen notificaciones, el sistema muestra estado vacío; no retorna error.
- Las acciones Archivar y Eliminar son distintas: archivar cambia el estado; eliminar es irreversible.
- Las notificaciones no leídas (`status: "unread"`) deben ser visualmente diferenciadas de las leídas.
- El campo `suggested_action` es de solo lectura; lo asigna el sistema al crear la notificación según el tipo de alerta.
- Cada notificación está vinculada a un `alert_id` de RF-23/RF-32 para trazabilidad.


# RF-34 - Notification Preferences Configuration

## Vista:
Panel de configuración de notificaciones. El usuario visualiza tipos de eventos, canales disponibles (push, email, in-app) y un bloque opcional de horario "No molestar".

## Acciones:
- Seleccionar qué eventos generan notificaciones (alertas críticas, advertencias, sensores offline, fallas de actuadores)
- Activar/desactivar canales: push, email, in-app
- Habilitar "Do Not Disturb" con hora de inicio y fin
- Guardar preferencias

## API:
```
PATCH /api/v1/users/{user_id}/notification-preferences
Auth: Bearer <token>

BODY:
{
  "events": { "critical_alerts": bool, "warnings": bool, "offline_sensors": bool, "actuator_failures": bool },
  "channels": { "push": bool, "email": bool, "in_app": bool },
  "do_not_disturb": { "enabled": bool, "start_time": "HH:MM", "end_time": "HH:MM" }
}

RESPONSE 200: { "message": "Notification preferences updated successfully" }
ERROR:        { "code": "INVALID_NOTIFICATION_CONFIGURATION", "message": "..." }
```

## Reglas:
- Al menos un canal debe estar habilitado cuando `critical_alerts: true`; si no, mostrar advertencia antes de guardar
- Si el horario "Do Not Disturb" es inválido (e.g. rango incorrecto), solicitar corrección antes de guardar
- Las notificaciones críticas se envían siempre, incluso dentro del horario "No molestar"


# RF-35 - Reports and Analytics

## Vista:
Módulo de reportes con selector de tipo de reporte (ambiente, actuadores, cultivos, consumo), filtros de fecha, invernadero y cultivo, y área de visualización con gráficas y tablas. Incluye botón de exportación/descarga.

## Acciones:
- Seleccionar tipo de reporte: environment | actuators | crops | consumption
- Aplicar filtros: rango de fechas, invernadero, cultivo
- Generar reporte y visualizar resultados (gráficas + tablas)
- Exportar/descargar el reporte generado

## API:
```
GET /api/v1/reports?type={tipo}&from={YYYY-MM-DD}&to={YYYY-MM-DD}
Auth: Bearer <token>

Query params:
  - type: "consumption" | "environment" | "actuators" | "crops"
  - from: fecha inicio (YYYY-MM-DD)
  - to: fecha fin (YYYY-MM-DD)
  - greenhouse_id: (opcional)
  - crop_id: (opcional)

RESPONSE 200:
{
  "report_type": "consumption",
  "data": [
    { "date": "YYYY-MM-DD", "water_liters": number }
  ]
}
```

## Reglas:
- Si no existe data histórica, mostrar mensaje informativo (no generar reporte vacío silencioso)
- Si la data es parcial, generar reporte con advertencia visible indicando el período sin datos
- Los filtros de fecha son obligatorios; greenhouse y crop son opcionales

## MO7- INTELIGENCIA ARTIFICIAL(Tamayo)
## MO8- DASHBOARD Y UX(Santiago)

## 🔌 4. CONTRATO DE DATOS (API CONTRACTS)

### A. MÓDULO IOT (Lectura de Sensores)
- **Endpoint:** GET /api/sensors/data
- **Campos:**
  - device_id (string)
  - temperatura (float)
  - humedad_suelo (int)
  - humedad_relativa (int)
  - luz (int)
- **JSON de ejemplo:**
  {
    "device_id": "esp32_1",
    "timestamp": "2026-04-22T10:00:00Z",
    "temperatura": 25.5,
    "humedad_suelo": 60,
    "humedad_relativa": 40,
    "luz": 300
  }

### B. MÓDULO IOT (Control de Actuadores)
- **Endpoint:** POST /api/actuators/control
- **Campos:**
  - device_id (string)
  - action (string: "activar_riego", etc)
  - value (int: duración o intensidad)
- **JSON de ejemplo:**
  {
    "device_id": "esp32_1",
    "action": "activar_riego",
    "value": 10
  }

### C. MÓDULO IA (Predicciones)
- **Endpoint:** GET /api/ia/predictions
- **Campos:**
  - predicciones (objeto: temperatura, humedad_relativa)
  - alerta (string: mensaje de aviso)
- **JSON de ejemplo:**
  {
    "timestamp": "2026-04-22T10:05:00Z",
    "predicciones": { "temperatura": 28.0, "humedad_relativa": 35 },
    "alerta": "Possible water stress in the coming hours"
  }

### D. MÓDULO IA (Estado de Planta)
- **Endpoint:** GET /api/ia/growth
- **Campo:** estado_planta (string: "saludable", "enferma", etc)
- **JSON de ejemplo:**
  {
    "timestamp": "2026-04-22T10:10:00Z",
    "estado_planta": "saludable"
  }