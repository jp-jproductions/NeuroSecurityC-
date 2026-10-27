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

La aplicación muestra la URL local al iniciar. Si no defines `DATABASE_URL` o `POSTGRES_URL`, usa `data/db.json` para desarrollo local.

## Datos y configuración

- En producción, define `DATABASE_URL` con la cadena de conexión PostgreSQL. La app crea la tabla necesaria y, si está vacía, importa los datos iniciales de `data/db.json`.
- Para usar una ubicación JSON distinta en desarrollo, define `NEUROSECURITY_DB` con la ruta del archivo.
- `JWT_SECRET` es obligatorio en producción; genera un valor largo y aleatorio y guárdalo como variable de entorno secreta.
- La aplicación valida las contraseñas usando los hashes existentes en la base de datos. No publiques credenciales.

## Funciones

- Consulta pública, búsqueda, filtros y resumen del estado de las sedes.
- Historial de auditoría, impresión y exportaciones CSV.
- Inicio de sesión administrativo, actualización de estados y revisión masiva.
- Gestión de sedes y cuentas administradoras.
- Solo un superadministrador puede eliminar la cuenta de otro superadministrador; no puede eliminarse a sí mismo ni al último superadministrador.

Al marcar las cámaras «Con novedad», se debe seleccionar una opción: No conecta por fallo de internet; No conecta por falta de energía; Falla de DVR; Falla de disco duro; Cambio de horario por pila desgastada; o Cámara sin funcionamiento.

## Despliegue en Vercel

El proyecto incluye `Dockerfile.vercel`, que publica la aplicación ASP.NET Core en un contenedor. Vercel ofrece su Container Runtime en beta y admite WebSockets en beta, necesarios para la interactividad de Blazor Server. Revisa las [limitaciones del Container Runtime](https://vercel.com/docs/functions/runtimes/container) y la [guía de WebSockets](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections).

1. Importa el repositorio en Vercel y configura **Root Directory** como la raíz del repositorio (`.`), no `dotnet/`; el contenedor necesita tanto `dotnet/` como `data/db.json`.
2. Selecciona el framework **Container**. Vercel detecta `Dockerfile.vercel`; también puedes seleccionarlo con `vercel project update --framework container --yes`.
3. Crea una base de datos PostgreSQL en Neon y copia su cadena de conexión **pooled**. Añádela como variable `DATABASE_URL` para los entornos que vayas a desplegar.
4. Añade `JWT_SECRET` como variable secreta de Vercel. Usa un secreto largo, aleatorio y único para producción; no uses el ejemplo de desarrollo.
5. Habilita **Fluid Compute / WebSockets** en la configuración de Functions del proyecto si aún no está activo y despliega. Blazor se reconecta si Vercel termina una conexión por sus límites de duración.

La primera ejecución en una base Neon vacía crea la tabla `neurosecurity_state` y carga allí el contenido inicial de `data/db.json`. Los cambios posteriores quedan guardados en PostgreSQL, no en el sistema de archivos temporal del contenedor. Configura las variables de producción y preview según corresponda.

## Estructura

```text
├── Dockerfile.vercel
├── dotnet/
│   ├── Program.cs
│   ├── NeuroSecurityStore.cs
│   └── Components/
├── data/
│   └── db.json
└── README.md
```
