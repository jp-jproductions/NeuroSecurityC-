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
- Solo un superadministrador puede eliminar la cuenta de otro superadministrador; no puede eliminarse a sí mismo ni al último superadministrador.

Al marcar las cámaras «Con novedad», se debe seleccionar una opción: No conecta por fallo de internet; No conecta por falta de energía; Falla de DVR; Falla de disco duro; Cambio de horario por pila desgastada; o Cámara sin funcionamiento.

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
