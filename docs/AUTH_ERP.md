# Arquitectura y Mecanismo de Autenticación Corporativa ERP (Fase 10)

## 1. Resumen Ejecutivo y Deuda de Fase 2

La autenticación en el sistema **Gestión TI** de Grupo Pecuario resuelve definitivamente la separación entre **identidad/autenticación corporativa** (provista por el ERP institucional) y **autorización local** (gestionada por la base de datos `DB_GP_GestionTI`).

```
+----------------------------------------------------------------------------------------+
|                                    FLUJO DE AUTENTICACIÓN                              |
+----------------------------------------------------------------------------------------+
|                                                                                        |
|   Cliente Web (Login)                                                                  |
|          |                                                                             |
|          v POST /api/v1/auth/login (@Usuario, @Contrasena)                             |
|   NestJS / Fastify (AuthService)                                                       |
|          |                                                                             |
|          |---> [Paso 1: Autenticación Corporativa]                                     |
|          |     Consulta a vista ERP vinculada:                                         |
|          |     [DB_GP_Trabajos_TEST].[dbo].[vw_ERP_Usuarios]                          |
|          |     (Servidor 10.10.1.3 · Base dbGP_2024_GP · Tabla dbo.MAA001020)          |
|          |     Predicado: User_Logon = @Usuario AND User_Estado = '0'                  |
|          |                AND CONVERT(VARCHAR(15), User_PassBin) = @Contrasena         |
|          |                                                                             |
|          |---> [Paso 2: Autorización Local en DB_GP_GestionTI]                         |
|          |     Ejecución SP: dbo.sp_validar_acceso_sistema @Usuario                    |
|          |     Verificaciones:                                                         |
|          |       - Usuario existe en dbo.usuarios_sistema                              |
|          |       - user_estado_erp = 0 (Activo en ERP)                                 |
|          |       - permitir_acceso = 1                                                 |
|          |       - estado_local = 1                                                    |
|          |       - id_rol IS NOT NULL Y rol.estado = 1 (en dbo.roles)                  |
|          |                                                                             |
|          |---> [Paso 3: Carga de Permisos Efectivos]                                   |
|          |     Consulta: dbo.vw_usuarios_permisos (WHERE id_usuario_sistema = @id)     |
|          |                                                                             |
|          v                                                                             |
|   Emisión de JWT (firmado con HMAC-SHA256, 8h expiración, aud/iss validados)           |
+----------------------------------------------------------------------------------------+
```

---

## 2. Fuente Oficial del ERP Corporativo

* **Servidor Origen:** `10.10.1.3:1433` (Red interna corporativa Grupo Pecuario)
* **Base de Datos Institucional:** `dbGP_2024_GP`
* **Tabla Maestra de Usuarios:** `dbo.MAA001020` (o `MA001020` según alias de esquema histórico)
* **Linked Server Local:** Configurado en la instancia SQL Server mediante la base intermedia `DB_GP_Trabajos_TEST` con la vista `dbo.vw_ERP_Usuarios`.

### Política Estricta sobre Contraseñas
* **PROHIBICIÓN ABSOLUTA:** En ningún caso se permite copiar, clonar, migrar ni persistir `User_PassBin`, contraseñas en texto claro o hashes hacia la base de datos `DB_GP_GestionTI`.
* La columna binaria `User_PassBin` se utiliza **únicamente como predicado de filtrado** (`CONVERT(VARCHAR(15), User_PassBin) = @Contrasena`) en una sentencia `CASE WHEN EXISTS (...) THEN 1 ELSE 0 END`.
* La respuesta del motor SQL es un valor escalar booleano (`Success: 1` o `Success: 0`). Ninguna columna sensible es proyectada, retornada ni almacenada en memoria de la aplicación.

---

## 3. Sincronización de Identidad (`dbo.sp_sincronizar_usuarios_erp`)

Para mantener actualizados los datos institucionales sin almacenar contraseñas, el sistema cuenta con el procedimiento almacenado:

```sql
EXEC dbo.sp_sincronizar_usuarios_erp;
```

### Datos Sincronizados desde ERP
* `user_logon` (Identificador de inicio de sesión institucional)
* `user_fullname` (Nombres y apellidos oficiales)
* `user_email` (Correo electrónico corporativo)
* `user_estado_erp` (`0 = ACTIVO`, `1 = INACTIVO`)
* `ultima_sincronizacion` (Marca de tiempo de sincronización)

### Datos de Control Local Exclusivo
* `permitir_acceso` (Booleano administrado por TI local)
* `estado_local` (Booleano de habilitación administrativa)
* `id_rol` (Rol asignado en Gestión TI: `ADMIN`, `GESTION_TI`, `CONSULTA`)
* `observaciones` (Notas locales de auditoría)

---

## 4. Modos de Ejecución: `AUTH_MODE`

Para evitar bloqueos durante el desarrollo en entornos sin acceso de red al servidor remoto `10.10.1.3`, se implementó la variable de configuración `AUTH_MODE`:

| Modo | Entorno Permitido | Comportamiento |
| :--- | :--- | :--- |
| `ERP` | **Producción** y Staging | Consulta obligatoria contra linked server `10.10.1.3 / vw_ERP_Usuarios`. Falla de forma cerrada si el enlace está caído. |
| `LOCAL_TEST` | **Solo Desarrollo / Tests** | Permite autenticar contra usuarios existentes en `dbo.usuarios_sistema` sin requerir conectividad de red al ERP. |

> [!CAUTION]
> **Seguridad en Producción:** El archivo `apps/backend/src/config/environment.ts` valida en tiempo de arranque que si `NODE_ENV === 'production'`, el valor de `AUTH_MODE` **no puede ser `LOCAL_TEST`**. Intentar arrancar en producción con `LOCAL_TEST` aborta inmediatamente el proceso con error de configuración.

---

## 5. Respuestas de Seguridad y Códigos HTTP

* **HTTP 401 Unauthorized:**
  * Emitido cuando las credenciales ERP no coinciden o el usuario no existe en la vista ERP.
  * Mensaje genérico: *"Usuario o contraseña incorrectos"* (previene enumeración de usuarios).
* **HTTP 403 Forbidden:**
  * Emitido cuando las credenciales ERP son correctas pero la autorización local en `DB_GP_GestionTI` es denegada:
    * Usuario no registrado en `dbo.usuarios_sistema`.
    * Usuario inactivo en el ERP (`user_estado_erp <> 0`).
    * Acceso local revocado (`permitir_acceso = 0`).
    * Cuenta local deshabilitada (`estado_local = 0`).
    * Rol inexistente o deshabilitado (`roles.estado = 0`).
* **HTTP 429 Too Many Requests:**
  * Límite estricto de 5 intentos por minuto por dirección IP en el endpoint `/api/v1/auth/login`.

---

## 6. Estado de Producción y Bloqueador Detectado

> [!WARNING]
> ### PRODUCTION BLOCKER: Confirmación de Conectividad y Credenciales Linked Server 10.10.1.3
>
> * **Descripción:** El servidor corporativo ERP `10.10.1.3` aloja `dbGP_2024_GP.dbo.MAA001020`. En el entorno productivo de despliegue, el servidor Windows que hospeda la instancia de SQL Server `DB_GP_GestionTI` debe contar con la regla de firewall en puerto TCP 1433 y la cuenta de servicio del linked server con permisos `SELECT` sobre `MAA001020`.
> * **Acción Requerida antes de Go-Live:**
>   1. Validar desde SQL Server Management Studio (SSMS) la conectividad del linked server hacia `10.10.1.3`.
>   2. Ejecutar prueba controlada de login con un usuario corporativo habilitado.
>   3. Asegurar que `AUTH_MODE=ERP` esté activo en el `.env` de producción.
