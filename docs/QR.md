# Arquitectura y Especificación de Códigos QR Transversales (Fase 10)

## 1. Objetivo y Filosofía de Diseño

El subsistema de **Códigos QR** en Gestión TI es una capacidad **transversal e integradora**, no perteneciente en exclusiva al módulo de Inventarios. Su función principal es servir como llave de acceso rápida, segura e inequívoca a los activos físicos de la empresa desde cualquier flujo operativo.

```
+-------------------------------------------------------------------------------+
|                        ECOSISTEMA TRANSVERSAL QR                              |
+-------------------------------------------------------------------------------+
|                                                                               |
|                             [ ETIQUETA QR FÍSICA ]                            |
|                                       |                                       |
|                                       v Escaneo por Cámara                    |
|                         GET /api/v1/qr/<token_opaco>                          |
|                                       |                                       |
|                         +-------------+-------------+                         |
|                         |  Validación Firma HMAC   |                         |
|                         |    (No modificó BD)       |                         |
|                         +-------------+-------------+                         |
|                                       |                                       |
|                     +-----------------+-----------------+                     |
|                     |                                   |                     |
|                     v                                   v                     |
|            [ Módulo Activos ]                 [ Módulo Inventarios ]          |
|            Consulta de ficha técnica          Verificación en lote abierto    |
|                     |                                   |                     |
|                     v                                   v                     |
|         [ Módulo Mantenimientos ]              [ Módulo Asignaciones ]        |
|         Preselección en apertura OT           Recepción y entrega de bienes   |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 2. Principios de Seguridad y Privacidad

### Regla Fundamental: QR Opaco sin Datos Sensibles
El código QR codifica un **identificador opaco** o URL del sistema, nunca la información del bien en texto plano.

* **PROHIBIDO INCLUIR EN EL QR:**
  * Nombre, DNI o datos personales del trabajador.
  * Número IMEI (telefonía móvil).
  * Dirección IP o Dirección MAC.
  * Número de serie completo del fabricante.
  * Ubicación geográfica física o de red.

### Solución Arquitectónica sin Alteración de Esquema
La tabla `dbo.activos` no cuenta con una columna específica para almacenar tokens aleatorios. Para evitar modificar el esquema de SQL Server (regla estricta del proyecto) y al mismo tiempo impedir la enumeración secuencial predecible (vulnerabilidad `/qr/1`, `/qr/2`):

1. **Token Criptográfico HMAC-SHA256:**
   El backend deriva el token del activo utilizando el `JWT_SECRET` institucional como semilla privada:
   $$\text{Firma} = \text{HMAC-SHA256}(\text{id\_activo} : \text{codigo\_activo}, \text{JWT\_SECRET})[0..16]$$
   $$\text{Token} = \text{base64url}(\text{id\_activo} . \text{Firma})$$

2. **Propiedades del Token:**
   * **Inmutable y determinístico:** Un activo siempre genera el mismo QR.
   * **No enumerable:** Es matemáticamente imposible adivinar la firma de otro activo.
   * **Cero cambios de esquema:** No requirió agregar columnas ni triggers a la base de datos.
   * **Verificación en $O(1)$:** El endpoint extrae el ID, consulta el registro en SQL y comprueba la firma antes de responder.

---

## 3. Endpoints del API

### A. Resolución de Token QR
```http
GET /api/v1/qr/:token
Authorization: Bearer <JWT>
Permiso: ACTIVOS_VER
```
* **Respuesta Exitosa (HTTP 200):**
  ```json
  {
    "id": 101,
    "codigo": "ACT-000101",
    "tipo": "LAPTOP",
    "tipoCodigo": "LAPTOP",
    "marca": "LENOVO",
    "modelo": "THINKPAD T14",
    "color": "NEGRO",
    "estado": "OPERATIVO",
    "estadoCodigo": "OPERATIVO",
    "ubicacion": "OFICINA PRINCIPAL",
    "ubicacionCodigo": "UBI-LIM-01",
    "responsableActual": {
      "id": 5,
      "dni": "45678901",
      "nombreCompleto": "CARLOS MENDOZA",
      "cargo": "ANALISTA TI",
      "area": "TI",
      "sede": "LIMA",
      "asignacionId": 12,
      "fechaAsignacion": "2026-01-15T00:00:00.000Z"
    },
    "navigation": {
      "activoUrl": "/activos/101",
      "asignacionesUrl": "/asignaciones?idActivo=101",
      "mantenimientoUrl": "/mantenimientos?idActivo=101",
      "inventarioUrl": "/inventarios?search=ACT-000101"
    }
  }
  ```
* **Respuestas de Error:**
  * `400 Bad Request`: Formato de token inválido o firma criptográfica alterada.
  * `404 Not Found`: El activo no existe en el sistema.

### B. Generación de Etiqueta QR
```http
GET /api/v1/activos/:id/qr
Authorization: Bearer <JWT>
Permiso: ACTIVOS_VER
```
* **Respuesta (HTTP 200):**
  Devuelve el token, la URL institucional (`${PUBLIC_APP_URL}/qr/${token}`), la imagen en formato DataURL Base64 PNG y el SVG vectorial para renderizado o impresión industrial.

---

## 4. Integraciones Transversales

1. **Módulo de Activos:**
   * En la vista de detalle del activo (`/activos/:id`), el botón *"Etiqueta QR"* abre una ventana modal con vista previa de rotulado e impresión mediante estilos `@media print`.
2. **Módulo de Inventarios Físicos:**
   * Desde la pantalla de escaneo (`/qr`), al leer un activo se ofrece el botón *"Verificar en Inventario"*, el cual invoca el servicio existente `inventarios.service.verifyActivo` sin duplicar lógica de negocio.
3. **Módulo de Mantenimientos:**
   * El botón *"Registrar Mantenimiento"* preselecciona el activo en el formulario de apertura de orden técnica.
4. **Módulo de Asignaciones:**
   * Permite consultar directamente el historial de entregas y devoluciones del bien escaneado.

---

## 5. Impresión de Etiquetas

* La etiqueta de rotulado se diseñó siguiendo el estándar de rotulado de activos fijos de Grupo Pecuario:
  * Encabezado institucional: `GRUPO PECUARIO · TI`.
  * Gráfico QR centrado de alta legibilidad (corrección de error nivel M).
  * Código patrimonial en tipografía monoespaciada grande (`ACT-000101`).
  * Descripción resumida (Tipo y Marca).
  * **Sin datos personales ni sensibles del colaborador.**
