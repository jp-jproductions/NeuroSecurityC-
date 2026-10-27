import { useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getBrowserClient(): SupabaseClient | null {
  if (client) return client;
  const url = (import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL) as string | undefined;
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_PUBLISHABLE_KEY) as string | undefined;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

/**
 * Calls `onChange` whenever cámaras/alarmas status, sedes or history change in Supabase,
 * so every open dashboard reflects updates instantly. Bursts (e.g. bulk reviews) are debounced.
 */
export function useRealtimeSecurityUpdates(onChange: () => void) {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const trigger = () => {
      clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current(), 400);
    };

    const channel = supabase
      .channel('neuromedica-seguridad')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estados' }, trigger)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sedes' }, trigger)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'historial' }, trigger)
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, []);
}
