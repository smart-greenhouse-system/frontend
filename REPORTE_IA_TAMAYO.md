# Reporte IA / Cultivos / Alertas — Tamayo

Resumen de lo implementado en el frontend alineado con `FRONTEND_MASTER_PLAN.md`, cubriendo los tres bloques de trabajo: **módulo de alertas (RF-23/24)**, **gestión de cultivos (RF-25/27)** y **estimación de cosecha + contratos IA secciones C y D (RF-26)**.

---

## 1. RFs completados (por bloque)

### Token 1 — Alertas
- **RF-23:** Pantalla de alertas con tarjetas de resumen (Total / Advertencias / Críticas), filtros (invernadero, fechas API, severidad y origen en tabla), tabla cronológica y leyenda de severidad.
- **RF-24 (UI):** Panel de preferencias con checkboxes Push, Email e In-app y botón **Guardar preferencias** (persistencia vía RF-34, ver endpoints).

### Token 2 — Gestión de cultivos
- **RF-25:** Componente `CropNotes` (formulario + tabla de historial de sesión tras POST exitoso).
- **RF-27:** Componente `HarvestRegistration` (cierre de ciclo con fecha y cantidad opcional).

### Token 3 — Estimación de cosecha e IA
- **RF-26:** Vista `HarvestEstimation` con tabla de cultivos activos (demo), fechas de siembra y cosecha estimada, ciclo, origen de predicción (`source`), detalle por fila y botón **Actualizar estimación** por cultivo.
- **Contrato IA sección C:** Bloque de predicciones ambientales consumiendo `GET /api/ia/predictions`.
- **Contrato IA sección D:** Estado de planta con `estado_planta` desde `GET /api/ia/growth`, mapeado a emojis y etiquetas en español (saludable, enferma, estrés, etc.).

---

## 2. Endpoints de API integrados

| Método y ruta | Uso |
|---------------|-----|
| `GET /api/v1/alerts?greenhouse_id=&from=&to=` | Listado de alertas (RF-23). |
| `PATCH /api/v1/users/{user_id}/notification-preferences` | Guardar canales de notificación (RF-34; UI RF-24). |
| `POST /api/v1/crops/{crop_id}/notes` | Notas de operador (RF-25). |
| `POST /api/v1/crops/{crop_id}/harvest` | Registro de cosecha (RF-27). |
| `GET /api/v1/crops/{crop_id}/harvest-estimation` | Estimación de cosecha y `source` / `maturity_status` (RF-26). |
| `GET /api/ia/predictions` | Predicciones y alerta textual (sección C). |
| `GET /api/ia/growth` | `estado_planta` (sección D); en código se permite `?crop_id=` opcional. |

**Configuración:** `VITE_API_BASE_URL`, token en `localStorage` (`token` / `operator_token`), y para preferencias `user_id` en `localStorage`.

---

## 3. Discrepancias entre diseño del plan y código generado

1. **RF-26 — Columna “Estado” única:** El plan describe una sola columna *Estado* en la tabla resumen. La vista separa **Estado (IA planta)** (contrato D, `estado_planta`) y **Madurez (ciclo)** (`maturity_status` del RF-26) para no mezclar dos contratos distintos en un solo campo ambiguo.
2. **RF-26 — Sección C en la misma vista:** El plan no exige el panel de predicciones ambientales en la pantalla de estimación de cosecha; se añadió explícitamente por el requisito de integrar secciones **C y D** del contrato IA en esta entrega.
3. **`GET /api/ia/growth` y `crop_id`:** El documento base no define query `crop_id`; el frontend lo envía opcionalmente por si el backend lo soporta. Si el servidor ignora el parámetro, el estado IA puede repetirse entre filas.
4. **Lista de cultivos activos:** No hay endpoint documentado para “todos los cultivos activos” en el extracto usado; se reutilizan IDs de demostración alineados con la página de cultivos.
5. **`estado_planta` “etc.”:** El plan solo ejemplifica `"saludable"`. El código añade sinónimos y estados relacionados (enferma, estrés, debilidad, normal) para cubrir el “etc.” y respuestas en inglés típicas.
6. **RF-24 vs RF-34:** La UI de preferencias sigue RF-24; el guardado usa el PATCH de RF-34 porque RF-24 solo documenta `POST /api/v1/notifications` para el sistema, no para el usuario.

---

## 4. Pendientes sugeridos para el siguiente sprint

1. **Sustituir cultivos demo** por `GET` real de cultivos activos por invernadero (si el backend lo expone) y enlazar filas con rutas `/inventory/crops` o detalle de cultivo.
2. **Confirmar con backend** el contrato de `GET /api/ia/growth` (multi-cultivo, `crop_id`, caché) y alinear el mapeo de `estado_planta` con la taxonomía final del modelo.
3. **Unificar tokens** (`token-user` vs `token-operator`) y contexto de auth React en lugar de `localStorage` disperso.
4. **RF-26:** Manejo explícito de “fecha real de cosecha” cuando `maturity_status === "harvested"` si el API devuelve un campo dedicado no listado en el extracto del plan.
5. **Pruebas e2e** o mocks MSW para alertas, notas, cosecha, estimación e IA sin depender del backend en desarrollo.
6. **Accesibilidad:** revisar foco y `aria` en filas clicables de `HarvestEstimation` y contrastes de chips pastel en alertas.

---

## 5. Cómo probar la vista nueva

- Ruta: **`/inventory/harvest-estimation`** (menú lateral **Cosecha estimada**).
- Requiere API accesible y, para datos completos, respuestas válidas en los endpoints listados arriba.

---

*Documento generado como parte de la entrega del sprint descrito por el usuario.*
