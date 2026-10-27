import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  getSupabase,
  isSupabaseConfigured,
  check,
  SedeRow,
  EstadoRow,
  HistorialRow,
  UsuarioRow,
} from './supabase.js';
import { INITIAL_SEDES_DATA } from './sedes-iniciales.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '..', 'data', 'db.json');

export function hashPassword(password: string, salt: string = 'neuromedica_salt_2026'): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export const SYSTEM_ADMINS: UsuarioRow[] = [
  {
    id: 'admin-pablo',
    email: 'pablo.escobar@neuromedica.com.co',
    nombre: 'Pablo Escobar',
    password_hash: hashPassword('98638026.esco'),
    rol: 'superadmin',
    creado_en: '2026-10-26T01:15:29.656Z',
  },
  {
    id: 'admin-1',
    email: 'admin@neuromedica.com',
    nombre: 'Administrador de Seguridad',
    password_hash: hashPassword('1027740143'),
    rol: 'superadmin',
    creado_en: '2026-10-26T01:15:29.656Z',
  },
  {
    id: 'admin-jupaesra',
    email: 'jupaesra170504@gmail.com',
    nombre: 'Superadministrador',
    password_hash: hashPassword('1027740143'),
    rol: 'superadmin',
    creado_en: '2026-10-26T01:15:29.656Z',
  },
];

interface LocalDatabase {
  sedes: SedeRow[];
  estados: Record<string, EstadoRow>;
  historial: HistorialRow[];
  usuarios: UsuarioRow[];
}

let localDb: LocalDatabase | null = null;

function defaultEstado(sedeId: string): EstadoRow {
  const now = new Date().toISOString();
  return {
    sede_id: sedeId,
    estado_camaras: 'operativo',
    estado_alarma: 'operativo',
    nota: '',
    fecha_revision: now,
    actualizado_en: now,
    actualizado_por: 'Sistema',
  };
}

function loadLocalDatabase(): LocalDatabase {
  if (localDb) return localDb;

  let loaded: any = null;
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      loaded = JSON.parse(content);
    } catch (e) {
      console.warn('Advertencia al leer data/db.json:', e);
    }
  }

  const now = new Date().toISOString();
  const sedes: SedeRow[] =
    Array.isArray(loaded?.sedes) && loaded.sedes.length > 0
      ? loaded.sedes
      : INITIAL_SEDES_DATA.map((item, index) => ({
          id: `sede-${index + 1}`,
          nombre: item.nombre,
          grupo: item.grupo,
          activa: true,
          orden: index + 1,
          creada_en: now,
        }));

  const estados: Record<string, EstadoRow> =
    loaded?.estados && typeof loaded.estados === 'object' ? { ...loaded.estados } : {};
  sedes.forEach((s) => {
    if (!estados[s.id]) {
      estados[s.id] = defaultEstado(s.id);
    }
  });

  const historial: HistorialRow[] =
    Array.isArray(loaded?.historial) && loaded.historial.length > 0
      ? loaded.historial
      : [
          {
            id: 'hist-init',
            sede_id: 'todas',
            sede_nombre: 'Todas las Sedes',
            fecha: now,
            usuario: 'Sistema',
            estado_camaras_anterior: 'operativo',
            estado_camaras_nuevo: 'operativo',
            estado_alarma_anterior: 'operativo',
            estado_alarma_nuevo: 'operativo',
            nota_anterior: '',
            nota_nueva: 'Carga inicial del sistema. Todas las sedes operativas.',
            tipo_evento: 'creacion',
          },
        ];

  // Map existing users and make sure system admins are present
  const usersMap = new Map<string, UsuarioRow>();
  if (Array.isArray(loaded?.usuarios)) {
    for (const u of loaded.usuarios) {
      usersMap.set(u.email.toLowerCase(), {
        id: u.id,
        email: u.email.toLowerCase(),
        nombre: u.nombre,
        password_hash: u.password_hash || u.passwordHash,
        rol: u.rol || 'admin',
        creado_en: u.creado_en || now,
      });
    }
  }

  for (const admin of SYSTEM_ADMINS) {
    usersMap.set(admin.email.toLowerCase(), admin);
  }

  localDb = {
    sedes,
    estados,
    historial,
    usuarios: Array.from(usersMap.values()),
  };

  saveLocalDatabase();
  return localDb;
}

function saveLocalDatabase() {
  if (!localDb) return;
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), 'utf-8');
  } catch (err) {
    // If running in a read-only serverless environment (e.g. Vercel Lambda), saving to disk might fail gracefully.
    // In-memory localDb remains active for the invocation.
  }
}

// Storage Interface
export const storage = {
  isSupabaseActive(): boolean {
    return isSupabaseConfigured();
  },

  async initStorage(): Promise<void> {
    const db = loadLocalDatabase();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        const { count, error } = await client.from('sedes').select('id', { count: 'exact', head: true });
        if (error) {
          console.warn('Aviso de conexión a Supabase:', error.message, '- Usando base local de respaldo.');
          return;
        }

        if (!count || count === 0) {
          console.log('Sembrando datos en Supabase desde base local...');
          await client.from('sedes').insert(db.sedes);
          await client.from('estados').upsert(Object.values(db.estados), { onConflict: 'sede_id' });
          if (db.historial.length > 0) {
            await client.from('historial').insert(db.historial);
          }
        }

        // Ensure system admins exist in Supabase
        await client.from('usuarios').upsert(SYSTEM_ADMINS, { onConflict: 'email' });
        console.log('✅ Supabase conectado y sincronizado.');
      } catch (e: any) {
        console.warn('Fallo al inicializar Supabase, usando respaldo local:', e?.message || e);
      }
    } else {
      console.log('ℹ️ Modo Local/Respaldo activo con data/db.json (Supabase no configurado).');
    }
  },

  async fetchSedes(includeArchived = false): Promise<SedeRow[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        let query = client.from('sedes').select('id, nombre, grupo, activa, orden, creada_en').order('orden');
        if (!includeArchived) query = query.eq('activa', true);
        return check(await query) as SedeRow[];
      } catch (err) {
        console.warn('Supabase fetchSedes error, usando local:', err);
      }
    }

    const db = loadLocalDatabase();
    const list = includeArchived ? db.sedes : db.sedes.filter((s) => s.activa);
    return [...list].sort((a, b) => a.orden - b.orden);
  },

  async fetchSede(id: string): Promise<SedeRow | null> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        const res = await client.from('sedes').select('id, nombre, grupo, activa, orden, creada_en').eq('id', id).maybeSingle();
        return check(res) as SedeRow | null;
      } catch (err) {
        console.warn('Supabase fetchSede error, usando local:', err);
      }
    }

    const db = loadLocalDatabase();
    return db.sedes.find((s) => s.id === id) || null;
  },

  async fetchEstadosMap(): Promise<Record<string, EstadoRow>> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        const rows = check(
          await client.from('estados').select('sede_id, estado_camaras, estado_alarma, nota, fecha_revision, actualizado_en, actualizado_por')
        ) as EstadoRow[];
        return Object.fromEntries(rows.map((r) => [r.sede_id, r]));
      } catch (err) {
        console.warn('Supabase fetchEstadosMap error, usando local:', err);
      }
    }

    const db = loadLocalDatabase();
    return { ...db.estados };
  },

  async fetchEstado(sedeId: string): Promise<EstadoRow | null> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        const res = await client
          .from('estados')
          .select('sede_id, estado_camaras, estado_alarma, nota, fecha_revision, actualizado_en, actualizado_por')
          .eq('sede_id', sedeId)
          .maybeSingle();
        return check(res) as EstadoRow | null;
      } catch (err) {
        console.warn('Supabase fetchEstado error, usando local:', err);
      }
    }

    const db = loadLocalDatabase();
    return db.estados[sedeId] || null;
  },

  async saveEstado(estado: EstadoRow): Promise<void> {
    const db = loadLocalDatabase();
    db.estados[estado.sede_id] = { ...estado };
    saveLocalDatabase();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        check(await client.from('estados').upsert(estado, { onConflict: 'sede_id' }));
      } catch (err) {
        console.warn('Supabase saveEstado error:', err);
      }
    }
  },

  async saveEstadosBatch(estados: EstadoRow[]): Promise<void> {
    const db = loadLocalDatabase();
    for (const est of estados) {
      db.estados[est.sede_id] = { ...est };
    }
    saveLocalDatabase();

    if (isSupabaseConfigured() && estados.length > 0) {
      try {
        const client = getSupabase()!;
        check(await client.from('estados').upsert(estados, { onConflict: 'sede_id' }));
      } catch (err) {
        console.warn('Supabase saveEstadosBatch error:', err);
      }
    }
  },

  async addHistorial(entries: HistorialRow | HistorialRow[]): Promise<void> {
    const list = Array.isArray(entries) ? entries : [entries];
    if (list.length === 0) return;

    const db = loadLocalDatabase();
    for (const entry of list) {
      const item: HistorialRow = {
        id: entry.id || `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...entry,
      };
      db.historial.unshift(item);
    }
    // Keep reasonable history size
    if (db.historial.length > 2000) {
      db.historial = db.historial.slice(0, 2000);
    }
    saveLocalDatabase();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        check(await client.from('historial').insert(list));
      } catch (err) {
        console.warn('Supabase addHistorial error:', err);
      }
    }
  },

  async fetchHistorial(sedeId?: string, limit = 100): Promise<{ historial: HistorialRow[]; total: number }> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        let query = client.from('historial').select('*', { count: 'exact' }).order('fecha', { ascending: false }).limit(limit);
        if (sedeId) query = query.eq('sede_id', sedeId);
        const { data, count, error } = await query;
        if (!error && data) {
          return { historial: data, total: count ?? data.length };
        }
      } catch (err) {
        console.warn('Supabase fetchHistorial error, usando local:', err);
      }
    }

    const db = loadLocalDatabase();
    let filtered = db.historial;
    if (sedeId) {
      filtered = filtered.filter((h) => h.sede_id === sedeId);
    }
    return {
      historial: filtered.slice(0, limit),
      total: filtered.length,
    };
  },

  async getLatestUpdateDate(): Promise<string> {
    const db = loadLocalDatabase();
    const dates = Object.values(db.estados)
      .map((e) => e.actualizado_en)
      .filter(Boolean);

    if (dates.length > 0) {
      dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      return dates[0];
    }
    return new Date().toISOString();
  },

  async fetchUserByEmail(email: string): Promise<UsuarioRow | null> {
    const cleanEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        const res = await client.from('usuarios').select('id, email, nombre, password_hash, rol, creado_en').eq('email', cleanEmail).maybeSingle();
        const user = check(res) as UsuarioRow | null;
        if (user) return user;
      } catch (err) {
        console.warn('Supabase fetchUserByEmail error, buscando en local:', err);
      }
    }

    const db = loadLocalDatabase();
    const found = db.usuarios.find((u) => u.email.toLowerCase() === cleanEmail);
    if (found) return found;

    // Check system admin fallback
    const sysAdmin = SYSTEM_ADMINS.find((a) => a.email.toLowerCase() === cleanEmail);
    return sysAdmin || null;
  },

  async fetchUserById(id: string): Promise<UsuarioRow | null> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        const res = await client.from('usuarios').select('id, email, nombre, password_hash, rol, creado_en').eq('id', id).maybeSingle();
        const user = check(res) as UsuarioRow | null;
        if (user) return user;
      } catch (err) {
        console.warn('Supabase fetchUserById error, buscando en local:', err);
      }
    }

    const db = loadLocalDatabase();
    return db.usuarios.find((u) => u.id === id) || SYSTEM_ADMINS.find((a) => a.id === id) || null;
  },

  async fetchAllUsers(): Promise<Omit<UsuarioRow, 'password_hash'>[]> {
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        const res = await client.from('usuarios').select('id, email, nombre, rol, creado_en').order('creado_en');
        const rows = check(res) as Omit<UsuarioRow, 'password_hash'>[];
        if (rows && rows.length > 0) return rows;
      } catch (err) {
        console.warn('Supabase fetchAllUsers error, usando local:', err);
      }
    }

    const db = loadLocalDatabase();
    return db.usuarios.map(({ id, email, nombre, rol, creado_en }) => ({
      id,
      email,
      nombre,
      rol,
      creado_en,
    }));
  },

  async createUser(user: UsuarioRow): Promise<Omit<UsuarioRow, 'password_hash'>> {
    const db = loadLocalDatabase();
    db.usuarios.push(user);
    saveLocalDatabase();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        check(await client.from('usuarios').insert(user));
      } catch (err) {
        console.warn('Supabase createUser error:', err);
      }
    }

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      creado_en: user.creado_en,
    };
  },

  async updateUserPassword(userId: string, newHash: string): Promise<boolean> {
    const db = loadLocalDatabase();
    const user = db.usuarios.find((u) => u.id === userId);
    if (user) {
      user.password_hash = newHash;
      saveLocalDatabase();
    }

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        check(await client.from('usuarios').update({ password_hash: newHash }).eq('id', userId));
      } catch (err) {
        console.warn('Supabase updateUserPassword error:', err);
      }
    }

    return true;
  },

  async createSede(sede: SedeRow, initialEstado: EstadoRow): Promise<void> {
    const db = loadLocalDatabase();
    db.sedes.push(sede);
    db.estados[sede.id] = initialEstado;
    saveLocalDatabase();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        check(await client.from('sedes').insert(sede));
        check(await client.from('estados').insert(initialEstado));
      } catch (err) {
        console.warn('Supabase createSede error:', err);
      }
    }
  },

  async updateSede(id: string, changes: Partial<SedeRow>): Promise<SedeRow | null> {
    const db = loadLocalDatabase();
    const index = db.sedes.findIndex((s) => s.id === id);
    if (index === -1) return null;

    db.sedes[index] = { ...db.sedes[index], ...changes };
    saveLocalDatabase();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        check(await client.from('sedes').update(changes).eq('id', id));
      } catch (err) {
        console.warn('Supabase updateSede error:', err);
      }
    }

    return db.sedes[index];
  },

  async deleteSede(id: string, permanent: boolean): Promise<SedeRow | null> {
    const db = loadLocalDatabase();
    const index = db.sedes.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const sede = db.sedes[index];
    if (permanent) {
      db.sedes.splice(index, 1);
      delete db.estados[id];
    } else {
      sede.activa = !sede.activa;
    }
    saveLocalDatabase();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        if (permanent) {
          check(await client.from('sedes').delete().eq('id', id));
        } else {
          check(await client.from('sedes').update({ activa: sede.activa }).eq('id', id));
        }
      } catch (err) {
        console.warn('Supabase deleteSede error:', err);
      }
    }

    return sede;
  },

  async resetDefaults(): Promise<void> {
    const now = new Date().toISOString();
    const sedes: SedeRow[] = INITIAL_SEDES_DATA.map((item, index) => ({
      id: `sede-${index + 1}`,
      nombre: item.nombre,
      grupo: item.grupo,
      activa: true,
      orden: index + 1,
      creada_en: now,
    }));

    const estados: Record<string, EstadoRow> = {};
    sedes.forEach((s) => {
      estados[s.id] = { ...defaultEstado(s.id), actualizado_por: 'Sistema Inicial' };
    });

    const historial: HistorialRow[] = [
      {
        id: 'hist-init',
        sede_id: 'todas',
        sede_nombre: 'Todas las Sedes',
        fecha: now,
        usuario: 'Sistema',
        estado_camaras_anterior: 'operativo',
        estado_camaras_nuevo: 'operativo',
        estado_alarma_anterior: 'operativo',
        estado_alarma_nuevo: 'operativo',
        nota_anterior: '',
        nota_nueva: 'Carga inicial del sistema. Todas las sedes operativas.',
        tipo_evento: 'creacion',
      },
    ];

    localDb = {
      sedes,
      estados,
      historial,
      usuarios: [...SYSTEM_ADMINS],
    };
    saveLocalDatabase();

    if (isSupabaseConfigured()) {
      try {
        const client = getSupabase()!;
        await client.from('historial').delete().neq('id', '');
        await client.from('sedes').delete().neq('id', '');
        await client.from('sedes').insert(sedes);
        await client.from('estados').upsert(Object.values(estados), { onConflict: 'sede_id' });
        await client.from('historial').insert(historial);
        await client.from('usuarios').upsert(SYSTEM_ADMINS, { onConflict: 'email' });
      } catch (err) {
        console.warn('Supabase resetDefaults error:', err);
      }
    }
  },
};
