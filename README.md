# Estado de Seguridad por Sede - NEUROMÉDICA

Aplicación ASP.NET Core y Blazor para consultar y administrar el estado de seguridad de las sedes de NEUROMÉDICA.

## Requisitos

- .NET 10 SDK

## Ejecución

Desde la raíz del repositorio, en PowerShell:

```powershell
$env:JWT_SECRET = "configure-un-secreto-largo-y-aleatorio"
dotnet run --project dotnet\dotnet.csproj
```

En otra terminal, inicia el frontend:

```powershell
dotnet run --project frontend\Client.csproj
```

Abre la URL que muestra el frontend. La API local usa `http://localhost:5115`. Si no defines `DATABASE_URL` o `POSTGRES_URL`, el servidor usa `data/db.json` para desarrollo local.

## Datos y configuración

- En producción, define `DATABASE_URL` con la cadena de conexión PostgreSQL. La app crea la tabla necesaria y, si está vacía, importa los datos iniciales de `data/db.json`.
- Para usar una ubicación JSON distinta en desarrollo, define `NEUROSECURITY_DB` con la ruta del archivo.
- `JWT_SECRET` es obligatorio en producción; genera un valor largo y aleatorio y guárdalo como variable de entorno secreta.
- `FRONTEND_ORIGINS` es obligatorio en producción y debe contener el origen del frontend, por ejemplo `https://mi-proyecto.vercel.app`. Separa varios orígenes con comas.
- La aplicación valida las contraseñas usando los hashes existentes en la base de datos. No publiques credenciales.

## Publicación en Vercel

El frontend Blazor WebAssembly se publica en Vercel; la API ASP.NET Core y PostgreSQL se alojan por separado. El repositorio incluye `vercel.json` y `scripts/vercel-build.sh`; el script compila el cliente y requiere la variable de entorno `API_BASE_URL` con la URL pública de la API, por ejemplo `https://mi-api.onrender.com/`.

1. Crea una base PostgreSQL y un servicio Docker en Render, usando `dotnet/Dockerfile` y la raíz del repositorio como contexto.
2. Configura en Render `DATABASE_URL` (URL interna de PostgreSQL), `JWT_SECRET` (secreto largo aleatorio) y `FRONTEND_ORIGINS` (origen exacto de Vercel).
3. Importa el repositorio en Vercel y configura `API_BASE_URL` en las variables de entorno de producción.
4. Vercel detectará la configuración de `vercel.json`. Después del primer despliegue, comprueba que `FRONTEND_ORIGINS` en Render coincida exactamente con el dominio asignado por Vercel.

No uses `data/db.json` como base de datos de producción: PostgreSQL es el almacenamiento persistente. No publiques secretos ni credenciales en el repositorio.

## Funciones

- Consulta pública, búsqueda, filtros y resumen del estado de las sedes.
- Historial de auditoría, impresión y exportaciones CSV.
- Inicio de sesión administrativo, actualización de estados y revisión masiva.
- Gestión de sedes y cuentas administradoras.
- Solo un superadministrador puede eliminar la cuenta de otro superadministrador; no puede eliminarse a sí mismo ni al último superadministrador.

Al marcar las cámaras «Con novedad», se debe seleccionar una opción: No conecta por fallo de internet; No conecta por falta de energía; Falla de DVR; Falla de disco duro; Cambio de horario por pila desgastada; o Cámara sin funcionamiento.

## Estructura

```text
├── dotnet/
│   ├── Program.cs              # API ASP.NET Core
│   ├── NeuroSecurityStore.cs
│   └── Dockerfile
├── frontend/                   # Cliente Blazor WebAssembly para Vercel
├── data/
│   └── db.json
├── scripts/
│   └── vercel-build.sh
├── vercel.json
└── README.md
```
