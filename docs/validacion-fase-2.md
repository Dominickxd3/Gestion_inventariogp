# Validación de Fase 2

Verificado inicialmente el 7 de octubre de 2026 (America/Lima). Flujo de autenticación corregido el mismo día después de inspeccionar el modelo ERP real.

## Alcance implementado

- Autenticación corporativa de solo lectura mediante `[DB_GP_Trabajos_TEST].[dbo].[vw_ERP_Usuarios]`.
- La vista consulta `10.10.1.3 / dbGP_2024_GP.dbo.MA001020` mediante el linked server existente.
- Usuario y contraseña se envían como parámetros SQL.
- `User_PassBin` se utiliza exclusivamente en el predicado de comparación; nunca se selecciona, almacena, registra ni devuelve.
- La vista y la base ERP permanecen intactas porque otros sistemas dependen de ellas.
- Autorización local mediante `DB_GP_GestionTI.dbo.sp_validar_acceso_sistema`.
- Validación adicional de `roles.estado = 1`.
- Permisos obtenidos de `dbo.vw_usuarios_permisos`, nunca inferidos del rol.
- JWT con `sub`, `username`, `nombre` y `rol`, validando emisor, audiencia y expiración.
- Revalidación de estado ERP (`0 = ACTIVO`), acceso, rol y permisos en cada petición autenticada.
- `POST /api/v1/auth/login` limitado a 5 solicitudes por minuto por cliente.
- `GET /api/v1/auth/me`, `JwtAuthGuard`, `PermissionsGuard` y `@Permissions(...)`.
- Logs Pino de éxito o rechazo sin contraseña, `User_PassBin` ni JWT.

## Flujo vigente

1. El backend recibe usuario y contraseña.
2. Ejecuta una consulta parametrizada con `EXISTS` sobre `vw_ERP_Usuarios`.
3. Exige `User_Logon = @Usuario`, `User_Estado = '0'` y equivalencia entre la contraseña y la representación ERP de `User_PassBin`.
4. La consulta devuelve únicamente `Success`; no proyecta columnas sensibles.
5. Con `Success = 1`, ejecuta el SP local de autorización para el mismo usuario.
6. Comprueba acceso local, rol activo y permisos efectivos.
7. Emite JWT y descarta la contraseña al terminar la petición.
8. Passport recarga la autorización efectiva en cada endpoint protegido.

El backend ya no utiliza `DB_GP_Trabajos_TEST.dbo.sp_login_usuario` ni `TBL_USUARIOS`. Esos objetos pertenecen al flujo temporal anterior y se mantienen intactos para no afectar otros sistemas.

## Variables

```dotenv
JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRES_IN=8h
JWT_ISSUER=gp-gestion-ti
JWT_AUDIENCE=gp-gestion-ti-web
```

`JWT_SECRET` es obligatorio, debe tener al menos 32 caracteres y no debe versionarse un valor real.

## Seguridad y compatibilidad

- No se modificó `MA001020`, `vw_ERP_Usuarios`, `sp_login_usuario` ni ningún objeto SQL.
- No se usa `SELECT *`.
- El backend no conserva credenciales.
- Un cambio de contraseña en el ERP se refleja inmediatamente porque la vista consulta la tabla principal en tiempo real.
- La respuesta de credenciales inválidas continúa siendo genérica para evitar enumeración de usuarios.
- La autorización local permanece separada de la autenticación corporativa.

## Validación

Las pruebas usan dobles y credenciales ficticias. Cubren aceptación/rechazo ERP, consulta parametrizada, ausencia del SP temporal, autorización local, rol activo, permisos, JWT y límites HTTP. No se ejecuta una escritura real durante las pruebas.

## Riesgos conocidos

- El contrato de `vw_ERP_Usuarios` incluye `User_PassBin` por compatibilidad con otros sistemas. Gestión TI no modifica ese contrato y limita su uso al predicado de autenticación.
- La autenticación depende de la disponibilidad del linked server y del ERP; ante una caída se rechaza el login sin habilitar un modo alternativo inseguro.
- El SP local actualiza `ultimo_acceso` antes de que el backend compruebe `roles.estado`; modificarlo está fuera del alcance autorizado.
