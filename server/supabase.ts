import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type EstadoSistema = 'operativo' | 'desactivado' | 'novedad';

export interface SedeRow {
  id: string;
  nombre: string;
  grupo: string;
  activa: boolean;
  orden: number;
  creada_en: string;
}

export interface EstadoRow {
  sede_id: string;
  estado_camaras: EstadoSistema;
  estado_alarma: EstadoSistema;
  nota: string;
  fecha_revision: string;
  actualizado_en: string;
  actualizado_por: string;
}

export interface HistorialRow {
  id?: string;
  sede_id: string;
  sede_nombre: string;
  fecha: string;
  usuario: string;
  estado_camaras_anterior: string;
  estado_camaras_nuevo: string;
  estado_alarma_anterior: string;
  estado_alarma_nuevo: string;
  nota_anterior?: string;
  nota_nueva?: string;
  tipo_evento: string;
}

export interface UsuarioRow {
  id: string;
  email: string;
  nombre: string;
  password_hash: string;
  rol: 'superadmin' | 'admin';
  creado_en: string;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return Boolean(url && key);
}

let client: SupabaseClient | null = null;

// Server-only client: the service role key bypasses RLS, so it must never reach the browser.
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return null;
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

