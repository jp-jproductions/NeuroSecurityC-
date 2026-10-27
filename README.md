# Estado de Seguridad por Sede - NEUROMÉDICA

Aplicación web para la administración y consulta pública en tiempo real del estado de seguridad física y electrónica (cámaras de seguridad CCTV y sistemas de alarma) de todas las sedes de **NEUROMÉDICA**.

---

## Versión C# (ASP.NET Core + Blazor)

El proyecto C# está en `dotnet/` y ofrece una aplicación Blazor interactiva, API REST compatible con las rutas actuales y persistencia local en `data/db.json`.

Requisitos: .NET 10 SDK.

En Windows, desde la raíz del repositorio:

```powershell
$env:JWT_SECRET = "configure-un-secreto-largo-y-aleatorio"
dotnet run --project dotnet\dotnet.csproj
```

La aplicación inicia en la URL que muestra `dotnet run`. La base de datos se lee y actualiza en `data/db.json`; puede cambiar su ubicación definiendo `NEUROSECURITY_DB`. En producción, `JWT_SECRET` es obligatorio.

La versión C# usa almacenamiento JSON local. La integración opcional con Supabase y el cliente React/TypeScript existentes siguen disponibles en el proyecto anterior; no forman parte del host C#.

---

## 🚀 Características Principales

1. **Consulta Pública (Sin inicio de sesión):**
   - Vista de monitoreo en tiempo real con actualización automática (polling de 30s) sin necesidad de recargar la página.
   - Tarjetas de resumen ejecutivo (KPIs): Total de sedes, 100% operativas, con novedad, desactivadas y desactualizadas (> 4 días).
   - Buscador por nombre de sede, grupo o contenido de notas.
   - Filtros por estado y por grupo (CEDI, Droguerías y Farma, SF puntos de venta, Domicilios, IPS, Administrativas, Medical Tower, Rayos X, Otros).
   - Ordenamiento inteligente con **atención prioritaria automática** (las sedes con desactivación o novedad aparecen de primero).
   - Alerta visual de **"Revisión desactualizada"** cuando una sede lleva más de 4 días sin revisarse (frecuencia normal de 2 veces por semana).
   - Modal de historial de auditoría detallado por sede o global (quién cambió, cuándo en hora Colombia, estado anterior y nuevo, y observaciones).
   - Vista de impresión limpia y botón de exportación a PDF y hoja de cálculo Excel (CSV).
   - Soporte nativo para modo claro y oscuro con persistencia.
   - Reloj en vivo sincronizado con la zona horaria **America/Bogotá (UTC-5)**.

2. **Panel de Administración Protegido (`/admin`):**
   - Inicio de sesión con correo y contraseña para el administrador del sistema.
   - Actualización individual de estado de cámaras y alarma con nota obligatoria ante novedades.
   - Botón de un solo clic **"Marcar 100% Operativa"**.
   - **Modo Pase de Guardia / Revisión Masiva:** interfaz ultra rápida para recorrer todas las sedes, cambiar estados con 1 clic y guardar todo en lote.
   - **Gestión dinámica de sedes:** añadir sedes nuevas, renombrarlas, reasignar grupos, archivarlas o eliminarlas.
   - Gestión de usuarios administradores y cambio de contraseña.
   - Exportación de auditoría completa a archivo CSV compatible con Excel.

---

## 🎨 Cómo Cambiar el Logo de Neuromédica

El logo está configurado para cargarse desde:
```text
/public/assets/logo.png
```

1. Guarda tu logo de Neuromédica con el nombre `logo.png` (o `logo.svg`).
2. Cópialo o reemplázalo en la carpeta `public/assets/logo.png`.
3. La aplicación detectará automáticamente el archivo y lo mostrará en el encabezado, en la pantalla de inicio de sesión de admin y en las impresiones/reportes.
4. *Nota:* Mientras no coloques la imagen, el sistema muestra automáticamente el isotipo vectorial corporativo de Neuromédica en azul institucional y cian.

---

## 📱 Añadir la aplicación a la pantalla de inicio

La aplicación incluye un manifiesto y sus iconos para instalarla desde un navegador compatible. En iPhone o iPad, abre el sitio en Safari, toca **Compartir** y selecciona **Añadir a pantalla de inicio**. En Android, abre el sitio en Chrome y selecciona **Instalar aplicación** o **Añadir a pantalla de inicio** desde el menú del navegador.

La instalación requiere abrir el sitio publicado con HTTPS. La aplicación necesita conexión a internet para consultar el estado actualizado de las sedes.

---

## 🔐 Acceso de administrador

La versión C# reutiliza las cuentas almacenadas en `data/db.json`; las contraseñas se validan contra sus hashes existentes. No publiques credenciales en el repositorio. Después de iniciar sesión, el panel permite cambiar la contraseña y crear otras cuentas administradoras.

---

## 📦 Estructura del Proyecto

```text
├── server.ts                 # Backend Express con API REST y persistencia
├── dotnet/
│   ├── Program.cs            # Host ASP.NET Core y API REST en C#
│   ├── NeuroSecurityStore.cs # Modelos, autenticación y almacenamiento JSON
│   └── Components/           # Interfaz interactiva Blazor
├── data/
│   └── db.json               # Almacenamiento JSON con las 49 sedes y auditoría
├── public/
│   └── assets/
│       ├── logo.png          # Ubicación del logo institucional de Neuromédica
│       └── README.txt
├── src/
│   ├── App.tsx               # Orquestador principal de vistas y filtros
│   ├── types/index.ts        # Interfaces TypeScript (Sedes, Estados, Historial)
│   ├── services/api.ts       # Cliente API REST y gestión de tokens
│   ├── utils/date.ts         # Formateador de fechas en zona horaria America/Bogota
│   └── components/
│       ├── NeuromedicaLogo.tsx    # Logo con fallback vectorial corporativo
│       ├── StatusBadge.tsx        # Badges accesibles de Cámaras y Alarmas
│       ├── SummaryCards.tsx       # Tarjetas KPI interactivas
│       ├── SedeCard.tsx           # Tarjeta individual con alertas de revisión
│       ├── SedeTableView.tsx      # Vista tabular compacta tipo NOC
│       ├── HistoryModal.tsx       # Trazabilidad y auditoría de cambios
│       ├── EditStatusModal.tsx    # Modal de edición con nota obligatoria
│       ├── BulkReviewModal.tsx    # Modo de revisión masiva (Pase de Guardia)
│       ├── SedeManagementModal.tsx # Altas, bajas y edición de sedes
│       ├── AdminLoginModal.tsx    # Pantalla de login administrativo
│       └── AdminUserModal.tsx     # Gestión de claves y nuevos administradores
├── supabase_schema.sql       # Script SQL para despliegue en Supabase (opcional)
└── package.json
```

---

## 🛠️ Ejecución Local

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo en el puerto 3000:
   ```bash
   npm run dev
   ```

3. Abre tu navegador en:
   `http://localhost:3000`

---

## ☁️ Guía de Despliegue Paso a Paso

### Opción A: Despliegue Full-Stack Rápido y Gratuito (Render / Railway / Fly.io)

1. Sube tu código a un repositorio de GitHub (privado o público).
2. Entra a [Render.com](https://render.com/) o [Railway.app](https://railway.app/).
3. Crea un nuevo **Web Service** conectado a tu repositorio de GitHub.
4. Configura:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
   - **Environment Variables:**
     - `NODE_ENV`: `production`
     - `PORT`: `3000`
     - `JWT_SECRET`: una clave secreta segura (ej. `neuromedica-prod-2026-secret`)
5. ¡Listo! Tendrás tu enlace público permanente con HTTPS y base de datos persistente.

### Opción B: Despliegue en Vercel con Frontend + Supabase (PostgreSQL)

Si prefieres la arquitectura de Supabase con PostgreSQL gratuito y Row Level Security (RLS):

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com/).
2. En el **SQL Editor** de Supabase, copia y pega el contenido del archivo `supabase_schema.sql` incluido en este proyecto y presiona **Run**.
3. El script creará:
   - Tabla `sedes` con las 49 sedes iniciales de Neuromédica.
   - Tabla `estados` con los estados iniciales 100% operativos.
   - Tabla `historial` para la auditoría de cambios.
   - Reglas RLS para que **cualquier persona pueda leer públicamente**, pero **solo administradores autenticados puedan escribir o modificar**.
4. En Vercel:
   - Importa tu repositorio.
   - Framework preset: `Vite`.
   - Build command: `npm run build`.
   - Output directory: `dist`.

---

## 📋 Lista Inicial de Sedes Cargadas

- **CEDI:** CEDI, CEDI 2 MAYORCA P7, CEDI COMPRAS.
- **DROGUERÍAS Y FARMA:** DROGUERIA MEDICAL TOWER, FARMA NORTE, FARMA SUR, FARMA MANIZALES.
- **SF (Puntos de Venta):** ALMACENTRO, ALMACENTRO 2, ARRAYANES, CITY PLAZA, COPACABANA, ENVIGADO CENTRO, MAYORCA, SABANETA PARQUE, APARTADO 1, APARTADO 2, BOGOTA, BARRANQUILLA, LA CEJA, RIONEGRO, BUCARAMANGA, CABECERA, FLORIDABLANCA, PIEDECUESTA, ARMENIA, MANIZALES, PEREIRA ACTUAL, PEREIRA EN OBRA, ARBOLETES, CAREPA, CHIGORODO, CURRULAO, NUEVA COLONIA, TURBO.
- **DOMICILIOS:** DOMICILIOS 1, DOMICILIOS 2.
- **IPS:** IPS MAYORCA P7, P8, P14; IPS PEREIRA; IPS RIONEGRO P5, P6; IPS BOGOTA.
- **ADMINISTRATIVAS:** ADMIN MAYORCA P8, ADMIN RIONEGRO P4.
- **MEDICAL TOWER:** MEDICAL TOWER.
- **RAYOS X:** RAYOS X 1, RAYOS X 2, RAYOS X MEDICAL TOWER.
- **OTROS:** AXON.

Todas las sedes pueden renombrarse, archivarse o reasignarse desde el panel de administración.
