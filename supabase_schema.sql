-- ==============================================================================
-- NEUROMÉDICA: Script de Base de Datos PostgreSQL / Supabase
-- Sistema de Estado de Seguridad por Sede
-- Incluye Tablas, Llaves Foráneas, Reglas RLS y Datos Iniciales
-- ==============================================================================

-- 1. Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: sedes
CREATE TABLE IF NOT EXISTS public.sedes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    nombre TEXT NOT NULL,
    grupo TEXT NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT true,
    orden INTEGER NOT NULL DEFAULT 0,
    creada_en TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota'::text, now())
);

-- 3. TABLA: estados
CREATE TABLE IF NOT EXISTS public.estados (
    sede_id TEXT PRIMARY KEY REFERENCES public.sedes(id) ON DELETE CASCADE,
    estado_camaras TEXT NOT NULL CHECK (estado_camaras IN ('operativo', 'desactivado', 'novedad')),
    estado_alarma TEXT NOT NULL CHECK (estado_alarma IN ('operativo', 'desactivado', 'novedad')),
    nota TEXT DEFAULT '',
    fecha_revision TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota'::text, now()),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota'::text, now()),
    actualizado_por TEXT DEFAULT 'Administrador'
);

-- 4. TABLA: historial (Auditoría de Cambios)
CREATE TABLE IF NOT EXISTS public.historial (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    sede_id TEXT NOT NULL,
    sede_nombre TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota'::text, now()),
    usuario TEXT NOT NULL,
    estado_camaras_anterior TEXT,
    estado_camaras_nuevo TEXT,
    estado_alarma_anterior TEXT,
    estado_alarma_nuevo TEXT,
    nota_anterior TEXT,
    nota_nueva TEXT,
    tipo_evento TEXT NOT NULL DEFAULT 'actualizacion'
);

-- ==============================================================================
-- 5. SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- Cualquier persona puede LEER (público), solo ADMINS autenticados pueden ESCRIBIR
-- ==============================================================================

ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial ENABLE ROW LEVEL SECURITY;

-- Políticas de LECTURA PÚBLICA (sin login)
CREATE POLICY "Permitir lectura pública de sedes"
    ON public.sedes FOR SELECT
    USING (true);

CREATE POLICY "Permitir lectura pública de estados"
    ON public.estados FOR SELECT
    USING (true);

CREATE POLICY "Permitir lectura pública de historial"
    ON public.historial FOR SELECT
    USING (true);

-- Políticas de ESCRITURA (solo usuarios autenticados / admin)
CREATE POLICY "Permitir inserción de sedes solo a autenticados"
    ON public.sedes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Permitir actualización de sedes solo a autenticados"
    ON public.sedes FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Permitir eliminación de sedes solo a autenticados"
    ON public.sedes FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Permitir inserción/actualización de estados solo a autenticados"
    ON public.estados FOR ALL
    TO authenticated
    USING (true);

CREATE POLICY "Permitir inserción en historial solo a autenticados"
    ON public.historial FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ==============================================================================
-- 6. CARGA DE DATOS INICIALES DE NEUROMÉDICA (Todas en Operativo)
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    v_now TIMESTAMPTZ := timezone('America/Bogota'::text, now());
BEGIN
    -- Lista de sedes iniciales
    CREATE TEMP TABLE tmp_sedes (nombre TEXT, grupo TEXT) ON COMMIT DROP;

    INSERT INTO tmp_sedes (nombre, grupo) VALUES
        -- CEDI
        ('CEDI', 'CEDI'),
        ('CEDI 2 MAYORCA P7', 'CEDI'),
        ('CEDI COMPRAS', 'CEDI'),
        -- DROGUERÍAS Y FARMA
        ('DROGUERIA MEDICAL TOWER', 'DROGUERÍAS Y FARMA'),
        ('FARMA NORTE', 'DROGUERÍAS Y FARMA'),
        ('FARMA SUR', 'DROGUERÍAS Y FARMA'),
        ('FARMA MANIZALES', 'DROGUERÍAS Y FARMA'),
        -- SF (PUNTOS DE VENTA)
        ('SF ALMACENTRO', 'SF (PUNTOS DE VENTA)'),
        ('SF ALMACENTRO 2', 'SF (PUNTOS DE VENTA)'),
        ('SF ARRAYANES', 'SF (PUNTOS DE VENTA)'),
        ('SF CITY PLAZA', 'SF (PUNTOS DE VENTA)'),
        ('SF COPACABANA', 'SF (PUNTOS DE VENTA)'),
        ('SF ENVIGADO CENTRO', 'SF (PUNTOS DE VENTA)'),
        ('SF MAYORCA', 'SF (PUNTOS DE VENTA)'),
        ('SF SABANETA PARQUE', 'SF (PUNTOS DE VENTA)'),
        ('SF APARTADO 1', 'SF (PUNTOS DE VENTA)'),
        ('SF APARTADO 2', 'SF (PUNTOS DE VENTA)'),
        ('SF BOGOTA', 'SF (PUNTOS DE VENTA)'),
        ('SF BARRANQUILLA', 'SF (PUNTOS DE VENTA)'),
        ('SF LA CEJA', 'SF (PUNTOS DE VENTA)'),
        ('SF RIONEGRO', 'SF (PUNTOS DE VENTA)'),
        ('SF BUCARAMANGA', 'SF (PUNTOS DE VENTA)'),
        ('SF CABECERA', 'SF (PUNTOS DE VENTA)'),
        ('SF FLORIDABLANCA', 'SF (PUNTOS DE VENTA)'),
        ('SF PIEDECUESTA', 'SF (PUNTOS DE VENTA)'),
        ('SF ARMENIA', 'SF (PUNTOS DE VENTA)'),
        ('SF MANIZALES', 'SF (PUNTOS DE VENTA)'),
        ('SF PEREIRA ACTUAL', 'SF (PUNTOS DE VENTA)'),
        ('SF PEREIRA EN OBRA', 'SF (PUNTOS DE VENTA)'),
        ('SF ARBOLETES', 'SF (PUNTOS DE VENTA)'),
        ('SF CAREPA', 'SF (PUNTOS DE VENTA)'),
        ('SF CHIGORODO', 'SF (PUNTOS DE VENTA)'),
        ('SF CURRULAO', 'SF (PUNTOS DE VENTA)'),
        ('SF NUEVA COLONIA', 'SF (PUNTOS DE VENTA)'),
        ('SF TURBO', 'SF (PUNTOS DE VENTA)'),
        -- DOMICILIOS
        ('DOMICILIOS 1', 'DOMICILIOS'),
        ('DOMICILIOS 2', 'DOMICILIOS'),
        -- IPS
        ('IPS MAYORCA PISO 7', 'IPS'),
        ('IPS MAYORCA PISO 8', 'IPS'),
        ('IPS MAYORCA PISO 14', 'IPS'),
        ('IPS PEREIRA', 'IPS'),
        ('IPS RIONEGRO PISO 5', 'IPS'),
        ('IPS RIONEGRO PISO 6', 'IPS'),
        ('IPS BOGOTA', 'IPS'),
        -- ADMINISTRATIVAS
        ('ADMIN MAYORCA PISO 8', 'ADMINISTRATIVAS'),
        ('ADMIN RIONEGRO PISO 4', 'ADMINISTRATIVAS'),
        -- MEDICAL TOWER
        ('MEDICAL TOWER', 'MEDICAL TOWER'),
        -- RAYOS X
        ('RAYOS X 1', 'RAYOS X'),
        ('RAYOS X 2', 'RAYOS X'),
        ('RAYOS X MEDICAL TOWER', 'RAYOS X'),
        -- OTROS
        ('AXON', 'OTROS');

    FOR r IN SELECT row_number() over() as idx, nombre, grupo FROM tmp_sedes
    LOOP
        INSERT INTO public.sedes (id, nombre, grupo, activa, orden, creada_en)
        VALUES ('sede-' || r.idx, r.nombre, r.grupo, true, r.idx, v_now)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.estados (sede_id, estado_camaras, estado_alarma, nota, fecha_revision, actualizado_en, actualizado_por)
        VALUES ('sede-' || r.idx, 'operativo', 'operativo', '', v_now, v_now, 'Sistema Inicial')
        ON CONFLICT (sede_id) DO NOTHING;
    END LOOP;
END $$;
