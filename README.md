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

La aplicación muestra la URL local al iniciar. En producción, `JWT_SECRET` es obligatorio.

## Datos y configuración

- Los datos y las cuentas de administrador se leen y guardan en `data/db.json`.
- Para usar otra ubicación de base de datos, define `NEUROSECURITY_DB` con la ruta del archivo.
- La aplicación valida las contraseñas usando los hashes existentes en la base de datos. No publiques credenciales.

## Funciones

- Consulta pública, búsqueda, filtros y resumen del estado de las sedes.
- Historial de auditoría, impresión y exportaciones CSV.
- Inicio de sesión administrativo, actualización de estados y revisión masiva.
- Gestión de sedes y cuentas administradoras.

## Estructura

```text
├── dotnet/
│   ├── Program.cs
│   ├── NeuroSecurityStore.cs
│   └── Components/
├── data/
│   └── db.json
└── README.md
```
