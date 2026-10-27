import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import app from './server/app';
import { storage } from './server/storage';

dotenv.config({ path: ['.env.development.local', '.env.local', '.env'], quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dev server runs on port 3000 as required
const portArgIndex = process.argv.indexOf('--port');
const portArg = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : undefined;
const PORT = Number(portArg || process.env.APP_PORT || 3000);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize data layer (Supabase if configured, or data/db.json)
  await storage.initStorage();

  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: hmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Neuromédica iniciado en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
});
