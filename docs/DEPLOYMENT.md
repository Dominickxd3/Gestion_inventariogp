# Manual de Despliegue en Producción (Fase 10)

## 1. Arquitectura de Despliegue Institucional

El sistema **Gestión TI** se despliega sobre la infraestructura corporativa Windows Server de Grupo Pecuario utilizando Internet Information Services (IIS) como frontend web server y terminador TLS, y NestJS ejecutándose como servicio interno en bucle local (`127.0.0.1`).

```
                              CLIENTES CORPORATIVOS
                                       |
                                       v HTTPS (Puerto 443)
                    +-------------------------------------+
                    |     INTERNET INFORMATION SERVICES   |
                    |                 (IIS)               |
                    +-------------------------------------+
                                       |
                      +----------------+----------------+
                      |                                 |
                      v                                 v
          [ Rutas SPA Frontend ]             [ Regla Reverse Proxy ]
             /inicio, /activos,                      /api/*
          /asignaciones, /qr, etc.                      |
                      |                                 | (HTTP Interno)
                      v                                 v
               apps/frontend/dist             127.0.0.1:3000/api/*
             (index.html fallback)                      |
                                                        v
                                             +--------------------+
                                             |   NESTJS BACKEND   |
                                             |  (Servicio Windows)|
                                             +--------------------+
                                                        |
                                                        v TCP 1433
                                             +--------------------+
                                             |     SQL SERVER     |
                                             |  DB_GP_GestionTI   |
                                             +--------------------+
```

---

## 2. Prerrequisitos del Servidor

* **Sistema Operativo:** Windows Server 2019 / 2022.
* **Node.js:** Versión 20.x o 22.x LTS (x64) instalada en el servidor.
* **IIS Features Requeridas:**
  * IIS Web Server Role.
  * Módulo **URL Rewrite 2.1**.
  * Módulo **Application Request Routing (ARR) 3.0** (con opción *Enable Proxy* activada).
* **Gestor de Servicios de Windows:** **NSSM** (Non-Sucking Service Manager) o **WinSW**.
* **Acceso a Base de Datos:** SQL Server 2019+ con la base `DB_GP_GestionTI` y linked server hacia el ERP.

---

## 3. Preparación de Artefactos de Compilación

### A. Frontend (Build Estático)
Desde la máquina de compilación o servidor:
```powershell
cd d:\Gestion_inventariogp\apps\frontend
npm run build
```
El resultado se generará en `d:\Gestion_inventariogp\apps\frontend\dist`.

### B. Backend (Transpilación TypeScript)
```powershell
cd d:\Gestion_inventariogp\apps\backend
npm run build
```
El código JavaScript transpilado residirá en `d:\Gestion_inventariogp\apps\backend\dist`.

---

## 4. Configuración de IIS

### A. Sitio Web Principal de IIS
1. Crear un sitio en IIS apuntando al directorio físico `D:\inetpub\gestionti\frontend` (o copiar el contenido de `apps/frontend/dist` ahí).
2. Configurar el enlace HTTPS con el certificado digital corporativo de Grupo Pecuario.

### B. Archivo `web.config` de IIS
Crear o copiar el siguiente `web.config` en la raíz del frontend (`D:\inetpub\gestionti\frontend\web.config`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Regla 1: Reverse Proxy hacia NestJS API -->
        <rule name="ReverseProxyToBackendAPI" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3000/api/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
            <set name="HTTP_X_FORWARDED_SCHEMA" value="https" />
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
          </serverVariables>
        </rule>

        <!-- Regla 2: SPA Fallback para React Router -->
        <rule name="SPARoutesFallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>

    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

> [!NOTE]
> En ARR (Application Request Routing), abrir *Application Request Routing Cache* -> *Server Proxy Settings* -> Marcar la casilla **Enable proxy** y aplicar cambios.

---

## 5. Configuración de Variables de Entorno de Backend

Crear el archivo `d:\Gestion_inventariogp\apps\backend\.env` (nunca versionado en git):

```dotenv
# Entorno
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
LOG_LEVEL=info
SWAGGER_ENABLED=false

# CORS & Proxy
CORS_ORIGINS=https://gestionti.grupopeuario.local
TRUST_PROXY=127.0.0.1

# Autenticación Corporativa
AUTH_MODE=ERP
JWT_SECRET=replace-with-at-least-32-random-characters
JWT_EXPIRES_IN=8h
JWT_ISSUER=gp-gestion-ti
JWT_AUDIENCE=gp-gestion-ti-web

# Base de Datos SQL Server
DB_SERVER=10.10.1.x
DB_PORT=1433
DB_USER=usr_gestionti_prod
DB_PASSWORD=replace-with-database-password
DB_DATABASE=DB_GP_GestionTI
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
DB_CONNECTION_TIMEOUT_MS=15000
DB_REQUEST_TIMEOUT_MS=30000
DB_POOL_MAX=25

# Almacenamiento Seguro
PUBLIC_APP_URL=https://gestionti.grupopeuario.local
DOCUMENTOS_STORAGE_PATH=D:\GestionTI_Storage\documentos
```

---

## 6. Instalación del Backend como Servicio de Windows (NSSM)

Utilizando la herramienta aprobada `nssm.exe`:

```powershell
# 1. Instalar el servicio
nssm install GestionTI-Backend "C:\Program Files\nodejs\node.exe" "d:\Gestion_inventariogp\apps\backend\dist\main.js"

# 2. Configurar directorio de trabajo
nssm set GestionTI-Backend AppDirectory "d:\Gestion_inventariogp\apps\backend"

# 3. Configurar reinicio automático en caso de fallo
nssm set GestionTI-Backend AppRestartDelay 5000

# 4. Configurar salida de logs a disco
nssm set GestionTI-Backend AppStdout "D:\GestionTI_Logs\backend-service.log"
nssm set GestionTI-Backend AppStderr "D:\GestionTI_Logs\backend-service-err.log"

# 5. Iniciar el servicio
nssm start GestionTI-Backend
```

---

## 7. Verificación de Salud del Sistema (Health Checks)

Una vez iniciado el servicio, validar mediante PowerShell:

1. **Liveness Check (Proceso activo):**
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/v1/health"
   # Respuesta esperada: @{ status = "ok" }
   ```

2. **Readiness Check (Conectividad SQL Server):**
   ```powershell
   Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/v1/health/ready"
   # Respuesta esperada: @{ status = "ok" }
   ```

3. **Verificación Externa vía IIS:**
   ```powershell
   Invoke-RestMethod -Uri "https://gestionti.grupopeuario.local/api/v1/health/ready"
   ```

---

## 8. Procedimiento de Rollback (Plan de Contingencia)

En caso de requerir volver a la versión anterior:
1. Detener el servicio: `nssm stop GestionTI-Backend`.
2. Restaurar la carpeta `apps/backend/dist` con la copia de respaldo de la versión previa.
3. Restaurar la carpeta del frontend en IIS con los artefactos estáticos previos.
4. Reiniciar el servicio: `nssm start GestionTI-Backend`.
5. Ejecutar la prueba de salud (`/api/v1/health/ready`).
