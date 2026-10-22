import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Trust exactly the configured number of proxy hops (Render = 1) so req.ip is the
  // real client IP and spoofed X-Forwarded-For entries are ignored.
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');

  // BigInt (BSON Long) values from lean queries/aggregations → exact decimal strings.
  app.set('json replacer', (key, value) => {
    if (key === '__v') return undefined;
    return typeof value === 'bigint' ? value.toString() : value;
  });

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.BODY_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));
  app.use(cookieParser());

  // API responses are private and dynamic.
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads'), {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  }));
  app.use('/api/v1', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
