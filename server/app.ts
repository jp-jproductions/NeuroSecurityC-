import express, { Request, Response, NextFunction, RequestHandler, Router } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import {
  storage,
  hashPassword,
} from './storage.js';
import { SedeRow, EstadoRow, HistorialRow, EstadoSistema } from './supabase.js';

dotenv.config({ path: ['.env.development.local', '.env.local', '.env'], quiet: true });

const JWT_SECRET = process.env.JWT_SECRET || 'neuromedica-security-secret-key-2026';

function generateToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyToken(token: string): any | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

const VALID_STATES: EstadoSistema[] = ['operativo', 'desactivado', 'novedad'];
function isValidState(value: unknown): value is EstadoSistema {
  return typeof value === 'string' && VALID_STATES.includes(value as EstadoSistema);
}

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

function enrichSede(sede: SedeRow, estado?: EstadoRow | null) {
  const est = estado || defaultEstado(sede.id);

  const revisionTime = new Date(est.fecha_revision).getTime();
  const diffHours = (Date.now() - revisionTime) / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  return {
    ...sede,
    estado_camaras: est.estado_camaras,
    estado_alarma: est.estado_alarma,
    nota: est.nota || '',
    fecha_revision: est.fecha_revision,
    actualizado_en: est.actualizado_en,
    actualizado_por: est.actualizado_por,
    dias_sin_revision: diffDays >= 0 ? diffDays : 0,
    horas_sin_revision: Math.round(diffHours),
    es_desactualizada: diffHours > 96,
    es_100_operativa: est.estado_camaras === 'operativo' && est.estado_alarma === 'operativo',
    tiene_novedad: est.estado_camaras === 'novedad' || est.estado_alarma === 'novedad',
    tiene_desactivado: est.estado_camaras === 'desactivado' || est.estado_alarma === 'desactivado',
  };
}

async function fetchEnrichedSedes(includeArchived = false) {
  const [sedes, estados] = await Promise.all([
    storage.fetchSedes(includeArchived),
    storage.fetchEstadosMap(),
  ]);
  return sedes.map((s) => enrichSede(s, estados[s.id]));
}

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

const actorName = (user: any) => user?.name || user?.nombre || user?.email || 'Administrador';

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
  }
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) {
    return res.status(401).json({ error: 'Sesión expirada o token inválido.' });
  }
  (req as any).user = payload;
  next();
}

// Router containing all API endpoints
const router = Router();

router.get(
  '/health',
  ah(async (_req, res) => {
    const sedes = await storage.fetchSedes(false);
    res.json({
      status: 'ok',
      total_sedes: sedes.length,
      supabase_configured: storage.isSupabaseActive(),
      timestamp: new Date().toISOString(),
    });
  })
);

router.get(
  '/sedes',
  ah(async (req, res) => {
    const includeArchived = req.query.include_archived === 'true';
    const [sedesList, latest] = await Promise.all([
      fetchEnrichedSedes(includeArchived),
      storage.getLatestUpdateDate(),
    ]);
    res.json({ sedes: sedesList, total: sedesList.length, ultima_actualizacion_general: latest });
  })
);

router.get(
  '/stats',
  ah(async (_req, res) => {
    const [activeSedes, latest] = await Promise.all([
      fetchEnrichedSedes(false),
      storage.getLatestUpdateDate(),
    ]);
    res.json({
      total_sedes: activeSedes.length,
      operativas_100: activeSedes.filter((s) => s.es_100_operativa).length,
      con_novedad: activeSedes.filter((s) => s.tiene_novedad).length,
      con_desactivado: activeSedes.filter((s) => s.tiene_desactivado).length,
      desactualizadas: activeSedes.filter((s) => s.es_desactualizada).length,
      ultima_actualizacion_general: latest,
    });
  })
);

router.get(
  '/historial',
  ah(async (req, res) => {
    const sedeId = req.query.sede_id as string | undefined;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 100, 1), 1000);
    const result = await storage.fetchHistorial(sedeId, limit);
    res.json({ historial: result.historial, total: result.total });
  })
);

router.get(
  '/export/sedes-csv',
  ah(async (_req, res) => {
    const activeSedes = await fetchEnrichedSedes(false);
    const headers = [
      'ID', 'Sede', 'Grupo', 'Estado Cámaras', 'Estado Alarma', 'Nota / Novedad',
      'Fecha Última Revisión', 'Días Sin Revisar', 'Desactualizada (>4 días)', 'Última Modificación', 'Responsable',
    ];
    const rows = activeSedes.map((s) => [
      csvCell(s.id),
      csvCell(s.nombre),
      csvCell(s.grupo),
      csvCell(s.estado_camaras.toUpperCase()),
      csvCell(s.estado_alarma.toUpperCase()),
      csvCell(s.nota),
      csvCell(s.fecha_revision),
      s.dias_sin_revision,
      s.es_desactualizada ? 'SÍ' : 'NO',
      csvCell(s.actualizado_en),
      csvCell(s.actualizado_por),
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Neuromedica_Estado_Seguridad_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send(csvContent);
  })
);

router.get(
  '/export/historial-csv',
  ah(async (_req, res) => {
    const result = await storage.fetchHistorial(undefined, 10000);
    const headers = [
      'Fecha Evento', 'Sede', 'Usuario Responsable', 'Tipo Evento', 'Cámaras Anterior',
      'Cámaras Nuevo', 'Alarma Anterior', 'Alarma Nuevo', 'Nota Anterior', 'Nota Nueva',
    ];
    const rows = result.historial.map((h) => [
      csvCell(h.fecha),
      csvCell(h.sede_nombre),
      csvCell(h.usuario),
      csvCell(h.tipo_evento),
      csvCell(h.estado_camaras_anterior),
      csvCell(h.estado_camaras_nuevo),
      csvCell(h.estado_alarma_anterior),
      csvCell(h.estado_alarma_nuevo),
      csvCell(h.nota_anterior),
      csvCell(h.nota_nueva),
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Neuromedica_Historial_Seguridad_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send(csvContent);
  })
);

router.post(
  '/auth/login',
  ah(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await storage.fetchUserByEmail(cleanEmail);
    const inputHash = hashPassword(String(password));

    if (!user || user.password_hash !== inputHash) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique el correo o contraseña.' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      rol: user.rol,
      name: user.nombre,
      iat: Date.now(),
    });

    res.json({ token, user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol } });
  })
);

router.get(
  '/auth/me',
  authMiddleware,
  ah(async (req, res) => {
    const user = await storage.fetchUserById((req as any).user.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol } });
  })
);

router.post(
  '/auth/change-password',
  authMiddleware,
  ah(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 6 caracteres.' });
    }
    const user = await storage.fetchUserById((req as any).user.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.password_hash !== hashPassword(String(currentPassword ?? ''))) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    }
    await storage.updateUserPassword(user.id, hashPassword(newPassword));
    res.json({ message: 'Contraseña actualizada correctamente.' });
  })
);

router.get(
  '/admin/users',
  authMiddleware,
  ah(async (_req, res) => {
    const users = await storage.fetchAllUsers();
    res.json({ users });
  })
);

router.post(
  '/admin/users',
  authMiddleware,
  ah(async (req, res) => {
    const { email, nombre, password, rol } = req.body || {};
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (email, nombre, password).' });
    }
    const cleanEmail = String(email).toLowerCase().trim();
    if (await storage.fetchUserByEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Ya existe un administrador con este correo.' });
    }
    const newUser = await storage.createUser({
      id: `admin-${Date.now()}`,
      email: cleanEmail,
      nombre: String(nombre).trim(),
      password_hash: hashPassword(String(password)),
      rol: rol === 'superadmin' ? 'superadmin' : 'admin',
      creado_en: new Date().toISOString(),
    });
    res.status(201).json({ message: 'Administrador creado con éxito', user: newUser });
  })
);

router.put(
  '/admin/sedes/:id/status',
  authMiddleware,
  ah(async (req, res) => {
    const sedeId = req.params.id;
    const { estado_camaras, estado_alarma, nota, fecha_revision } = req.body || {};
    const user = (req as any).user;

    if ((estado_camaras && !isValidState(estado_camaras)) || (estado_alarma && !isValidState(estado_alarma))) {
      return res.status(400).json({ error: 'Estado inválido.' });
    }
    if ((estado_camaras === 'novedad' || estado_alarma === 'novedad') && (!nota || nota.trim() === '')) {
      return res.status(400).json({ error: 'El estado "Con novedad" exige escribir una nota explicativa.' });
    }

    const [sede, prev] = await Promise.all([storage.fetchSede(sedeId), storage.fetchEstado(sedeId)]);
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });
    const prevEstado = prev || defaultEstado(sedeId);

    const now = new Date().toISOString();
    const newEstado: EstadoRow = {
      sede_id: sedeId,
      estado_camaras: estado_camaras || prevEstado.estado_camaras,
      estado_alarma: estado_alarma || prevEstado.estado_alarma,
      nota: nota !== undefined ? String(nota).trim() : prevEstado.nota,
      fecha_revision: fecha_revision || now,
      actualizado_en: now,
      actualizado_por: actorName(user),
    };

    await storage.saveEstado(newEstado);
    await storage.addHistorial({
      sede_id: sede.id,
      sede_nombre: sede.nombre,
      fecha: now,
      usuario: actorName(user),
      estado_camaras_anterior: prevEstado.estado_camaras,
      estado_camaras_nuevo: newEstado.estado_camaras,
      estado_alarma_anterior: prevEstado.estado_alarma,
      estado_alarma_nuevo: newEstado.estado_alarma,
      nota_anterior: prevEstado.nota,
      nota_nueva: newEstado.nota,
      tipo_evento: 'actualizacion',
    });

    res.json({ message: 'Estado actualizado correctamente', sede: enrichSede(sede, newEstado) });
  })
);

router.post(
  '/admin/sedes/:id/mark-operational',
  authMiddleware,
  ah(async (req, res) => {
    const sedeId = req.params.id;
    const user = (req as any).user;

    const [sede, prev] = await Promise.all([storage.fetchSede(sedeId), storage.fetchEstado(sedeId)]);
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });
    const prevEstado = prev || defaultEstado(sedeId);

    const now = new Date().toISOString();
    const newEstado: EstadoRow = {
      sede_id: sedeId,
      estado_camaras: 'operativo',
      estado_alarma: 'operativo',
      nota: '',
      fecha_revision: now,
      actualizado_en: now,
      actualizado_por: actorName(user),
    };

    await storage.saveEstado(newEstado);
    await storage.addHistorial({
      sede_id: sede.id,
      sede_nombre: sede.nombre,
      fecha: now,
      usuario: actorName(user),
      estado_camaras_anterior: prevEstado.estado_camaras,
      estado_camaras_nuevo: 'operativo',
      estado_alarma_anterior: prevEstado.estado_alarma,
      estado_alarma_nuevo: 'operativo',
      nota_anterior: prevEstado.nota,
      nota_nueva: 'Marcada como 100% operativa',
      tipo_evento: 'marcado_operativo',
    });

    res.json({ message: `${sede.nombre} marcada como 100% operativa.`, sede: enrichSede(sede, newEstado) });
  })
);

router.post(
  '/admin/sedes/bulk-update',
  authMiddleware,
  ah(async (req, res) => {
    const { updates, fecha_revision_general } = req.body || {};
    const user = (req as any).user;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Lista de actualizaciones inválida o vacía.' });
    }

    const [sedesList, estadosMap] = await Promise.all([
      storage.fetchSedes(true),
      storage.fetchEstadosMap(),
    ]);
    const sedesById = new Map(sedesList.map((s) => [s.id, s]));
    const now = new Date().toISOString();
    const revisionTime = fecha_revision_general || now;

    const estadosToSave: EstadoRow[] = [];
    const historyToAdd: HistorialRow[] = [];

    for (const item of updates) {
      const sede = sedesById.get(item.sede_id);
      if (!sede) continue;
      if (!isValidState(item.estado_camaras) || !isValidState(item.estado_alarma)) {
        return res.status(400).json({ error: `Estado inválido para la sede "${sede.nombre}".` });
      }
      if (
        (item.estado_camaras === 'novedad' || item.estado_alarma === 'novedad') &&
        (!item.nota || item.nota.trim() === '')
      ) {
        return res
          .status(400)
          .json({ error: `La sede "${sede.nombre}" está "Con novedad" y requiere nota explicativa.` });
      }

      const prevEstado = estadosMap[sede.id] || defaultEstado(sede.id);
      const newEstado: EstadoRow = {
        sede_id: sede.id,
        estado_camaras: item.estado_camaras,
        estado_alarma: item.estado_alarma,
        nota: (item.nota || '').trim(),
        fecha_revision: item.fecha_revision || revisionTime,
        actualizado_en: now,
        actualizado_por: actorName(user),
      };
      estadosToSave.push(newEstado);

      const hasChanged =
        prevEstado.estado_camaras !== newEstado.estado_camaras ||
        prevEstado.estado_alarma !== newEstado.estado_alarma ||
        (prevEstado.nota || '') !== newEstado.nota;

      if (hasChanged) {
        historyToAdd.push({
          sede_id: sede.id,
          sede_nombre: sede.nombre,
          fecha: now,
          usuario: actorName(user),
          estado_camaras_anterior: prevEstado.estado_camaras,
          estado_camaras_nuevo: newEstado.estado_camaras,
          estado_alarma_anterior: prevEstado.estado_alarma,
          estado_alarma_nuevo: newEstado.estado_alarma,
          nota_anterior: prevEstado.nota,
          nota_nueva: newEstado.nota,
          tipo_evento: 'masivo',
        });
      }
    }

    if (estadosToSave.length) {
      await storage.saveEstadosBatch(estadosToSave);
    }
    if (historyToAdd.length) {
      await storage.addHistorial(historyToAdd);
    }

    res.json({
      message: `Se actualizaron ${estadosToSave.length} sedes exitosamente en revisión masiva.`,
      actualizadas: estadosToSave.length,
    });
  })
);

router.post(
  '/admin/sedes',
  authMiddleware,
  ah(async (req, res) => {
    const { nombre, grupo, estado_camaras, estado_alarma, nota } = req.body || {};
    const user = (req as any).user;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre de la sede es obligatorio.' });
    }

    const cleanName = String(nombre).trim().toUpperCase();
    const cleanGrupo = String(grupo || 'OTROS').trim().toUpperCase();
    const id = `sede-${Date.now()}`;
    const now = new Date().toISOString();

    const allSedes = await storage.fetchSedes(true);
    const maxOrden = allSedes.reduce((max, s) => Math.max(max, s.orden || 0), 0);

    const nuevaSede: SedeRow = {
      id,
      nombre: cleanName,
      grupo: cleanGrupo,
      activa: true,
      orden: maxOrden + 1,
      creada_en: now,
    };

    const initialStatus: EstadoRow = {
      sede_id: id,
      estado_camaras: isValidState(estado_camaras) ? estado_camaras : 'operativo',
      estado_alarma: isValidState(estado_alarma) ? estado_alarma : 'operativo',
      nota: (nota || '').trim(),
      fecha_revision: now,
      actualizado_en: now,
      actualizado_por: actorName(user),
    };

    await storage.createSede(nuevaSede, initialStatus);
    await storage.addHistorial({
      sede_id: id,
      sede_nombre: cleanName,
      fecha: now,
      usuario: actorName(user),
      estado_camaras_anterior: 'operativo',
      estado_camaras_nuevo: initialStatus.estado_camaras,
      estado_alarma_anterior: 'operativo',
      estado_alarma_nuevo: initialStatus.estado_alarma,
      nota_anterior: '',
      nota_nueva: 'Sede creada en el sistema',
      tipo_evento: 'creacion',
    });

    res.status(201).json({ message: 'Sede creada exitosamente.', sede: enrichSede(nuevaSede, initialStatus) });
  })
);

router.put(
  '/admin/sedes/:id',
  authMiddleware,
  ah(async (req, res) => {
    const sedeId = req.params.id;
    const { nombre, grupo, activa, orden } = req.body || {};

    const changes: Partial<SedeRow> = {};
    if (nombre) changes.nombre = String(nombre).trim().toUpperCase();
    if (grupo) changes.grupo = String(grupo).trim().toUpperCase();
    if (typeof activa === 'boolean') changes.activa = activa;
    if (typeof orden === 'number') changes.orden = orden;

    const updated = await storage.updateSede(sedeId, changes);
    if (!updated) return res.status(404).json({ error: 'Sede no encontrada.' });

    const estado = await storage.fetchEstado(sedeId);
    res.json({ message: 'Sede actualizada correctamente.', sede: enrichSede(updated, estado) });
  })
);

router.delete(
  '/admin/sedes/:id',
  authMiddleware,
  ah(async (req, res) => {
    const sedeId = req.params.id;
    const permanent = req.query.permanent === 'true';
    const user = (req as any).user;

    const sede = await storage.fetchSede(sedeId);
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });

    const deleted = await storage.deleteSede(sedeId, permanent);
    if (!deleted) return res.status(404).json({ error: 'No se pudo procesar la eliminación.' });

    await storage.addHistorial({
      sede_id: sedeId,
      sede_nombre: sede.nombre,
      fecha: new Date().toISOString(),
      usuario: actorName(user),
      estado_camaras_anterior: '',
      estado_camaras_nuevo: '',
      estado_alarma_anterior: '',
      estado_alarma_nuevo: '',
      nota_anterior: '',
      nota_nueva: permanent
        ? `Sede eliminada permanentemente por ${actorName(user)}`
        : `Sede ${deleted.activa ? 'reactivada' : 'archivada'} por ${actorName(user)}`,
      tipo_evento: permanent ? 'eliminacion' : 'actualizacion',
    });

    if (permanent) {
      return res.json({ message: `Sede ${sede.nombre} eliminada definitivamente.` });
    }
    return res.json({ message: `Sede ${sede.nombre} ${deleted.activa ? 'reactivada' : 'archivada'}.` });
  })
);

router.post(
  '/admin/reset-defaults',
  authMiddleware,
  ah(async (_req, res) => {
    await storage.resetDefaults();
    res.json({ message: 'Base de datos restaurada con los datos iniciales de Neuromédica.' });
  })
);

// Create the Express App
const app = express();

// Safe body parsing: When deployed on Vercel, the runtime may already parse req.body as an object.
// Calling express.json() on an already consumed stream causes a hang or unhandled 500 error.
app.use((req: any, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    return next();
  }
  express.json()(req, res, next);
});

// CORS & Preflight handling
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mount routes at BOTH `/api` and root `/` so that regardless of how Vercel rewrites or sends `/api/*`,
// it ALWAYS resolves and never 404s!
app.use('/api', router);
app.use(router);

// JSON 404 handler for API routes
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl || req.url}` });
});

// JSON error handler for API
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error procesando solicitud API:', err?.message || err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  const message = err?.message || (typeof err === 'string' ? err : 'Error en el servidor. Intente nuevamente.');
  res.status(status).json({ error: message });
});

export default app;
