import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { errorMiddleware } from './middleware/error.middleware';
import agentsRouter    from './routes/agents.routes';
import autopilotRouter from './routes/autopilot.routes';
import templatesRouter from './routes/templates.routes';
import authRouter      from './routes/auth.routes';

export function createApp() {
  const app = express();

  // ── Security & Parsing ──────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGINS.split(',').map(s => s.trim()),
    credentials: true,
  }));
  app.use(compression());
  app.use(express.json({ limit: '512kb' }));

  // ── Health ──────────────────────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

  // ── Routes ──────────────────────────────────────────────────────
  app.use('/api/v1/auth',       authRouter);
  app.use('/api/v1/agents',     agentsRouter);
  app.use('/api/v1/autopilot',  autopilotRouter);
  app.use('/api/v1/templates',  templatesRouter);

  // ── 404 ─────────────────────────────────────────────────────────
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));

  // ── Error handler ───────────────────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
