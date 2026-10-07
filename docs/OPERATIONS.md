# Manual de Operaciones y Mantenimiento (Fase 10)

## 1. Control del Servicio de Backend

El backend se ejecuta como el servicio de Windows `GestionTI-Backend`.

### Comandos de Operación (PowerShell como Administrador)

```powershell
# Consultar estado del servicio
Get-Service -Name GestionTI-Backend

# Iniciar servicio
Start-Service -Name GestionTI-Backend
# O con NSSM:
nssm start GestionTI-Backend

# Detener servicio
Stop-Service -Name GestionTI-Backend
# O con NSSM:
nssm stop GestionTI-Backend

# Reiniciar servicio
Restart-Service -Name GestionTI-Backend
# O con NSSM:
nssm restart GestionTI-Backend
```

---

## 2. Gestión de Logs y Rotación

### A. Ubicación de Archivos de Log
* **Logs del Servicio (Consola y Fastify):** `D:\GestionTI_Logs\backend-service.log`
* **Logs de Errores Críticos:** `D:\GestionTI_Logs\backend-service-err.log`
* **Logs de IIS (Peticiones HTTP):** `C:\inetpub\logs\LogFiles\W3SVC*`

### B. Formato de Logs de Aplicación
Los logs emitidos por la aplicación utilizan **Pino Logger** en formato JSON estructurado:
```json
{"level":30,"time":1770284400000,"pid":4812,"hostname":"SRV-APP-TI","req":{"id":"req-1","method":"GET","url":"/api/v1/activos"},"res":{"statusCode":200},"msg":"request completed"}
```

### C. Política de Rotación y Retención
1. Configurar rotación de logs mediante script programado en *Windows Task Scheduler* o la utilidad `logrotate-win` cada medianoche.
2. Comprimir logs anteriores a 7 días en formato ZIP.
3. Eliminar archivos comprimidos con antigüedad superior a **90 días**.
4. Alerta de capacidad cuando el disco `D:` supere el 85% de utilización.

---

## 3. Monitoreo Continuo y Health Checks

El sistema expone dos endpoints HTTP de monitoreo continuo para software de observabilidad o scripts de comprobación:

| Endpoint | Tipo | Función | Intervalo Recomendado |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/health` | Liveness | Comprueba que el proceso Node.js responde | Cada 15 segundos |
| `GET /api/v1/health/ready` | Readiness | Comprueba conectividad activa con SQL Server | Cada 60 segundos |

---

## 4. Política de Copias de Seguridad (Backups de Base de Datos)

> [!IMPORTANT]
> Los backups se ejecutan a nivel de motor SQL Server mediante planes de mantenimiento o scripts T-SQL de **SQL Server Agent**, nunca desde el código de la aplicación.

### Esquema Recomendado para `DB_GP_GestionTI` (Recovery Model: FULL)
* **Backup Completo (FULL):** Diario a las 01:00 AM (Retención: 30 días).
* **Backup Diferencial (DIFF):** Cada 6 horas (07:00, 13:00, 19:00).
* **Backup de Log de Transacciones (LOG):** Cada 15 minutos (permite recuperación point-in-time).

### Script de Backup Diario de Ejemplo
```sql
BACKUP DATABASE [DB_GP_GestionTI]
TO DISK = N'D:\SQL_Backups\DB_GP_GestionTI_Full.bak'
WITH FORMAT, INIT, COMPRESSION, STATS = 10, CHECKSUM;
GO
```

---

## 5. Almacenamiento de Documentos PDF y Cuotas

* **Ruta de Almacenamiento:** Configurada mediante `DOCUMENTOS_STORAGE_PATH` (ej. `D:\GestionTI_Storage\documentos`).
* **Permisos NTFS:** La cuenta de servicio de Windows (`NT SERVICE\GestionTI-Backend` o cuenta de servicio dedicada) debe tener permisos exclusivos de `Lectura y Escritura` sobre la carpeta. Los usuarios de red o cuentas genéricas no deben tener acceso directo a la carpeta física.
* **Integridad:** Cada documento almacenado posee su firma hash SHA-256 registrada en `dbo.documentos.hash_archivo`.

---

## 6. Procedimientos ante Incidentes Operativos

### Incidente 1: Falla de Conectividad con el Linked Server del ERP (10.10.1.3)
* **Síntoma:** Los usuarios reciben HTTP 401 o 500 al intentar iniciar sesión; los logs indican *Could not find server '10.10.1.3'* o *Linked server query failed*.
* **Procedimiento:**
  1. Comprobar conectividad IP: `Test-NetConnection -ComputerName 10.10.1.3 -Port 1433`.
  2. Verificar estado del servicio SQL Server en el nodo ERP.
  3. Comprobar validez de las credenciales de mapeo en el objeto Linked Server en SSMS.
  4. Los usuarios con sesiones JWT activas continuarán operando hasta la expiración de su token (8h).

### Incidente 2: Deshabilitación accidental de Administradores
* **Síntoma:** Ningún administrador puede acceder al sistema.
* **Procedimiento de Recuperación:**
  1. Acceder con rol de Administrador de Base de Datos (sysadmin) a la instancia SQL Server mediante SSMS.
  2. Ejecutar la reactivación controlada del usuario administrador oficial:
     ```sql
     UPDATE dbo.usuarios_sistema
     SET permitir_acceso = 1,
         estado_local = 1,
         id_rol = (SELECT id_rol FROM dbo.roles WHERE codigo = 'ADMIN')
     WHERE user_logon = 'administrador_oficial';
     ```
  3. El cambio toma efecto inmediatamente en la siguiente petición.
