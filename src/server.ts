/**
 * Punto de entrada de la API Node.js (TypeScript).
 * Realiza la composición de dependencias (wiring) según arquitectura hexagonal:
 * adaptador de infraestructura (repositorio) -> caso de uso -> adaptador HTTP.
 */
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { StatisticsServiceImpl } from './application/statistics.service';
import { AuthServiceImpl, AuthConfig } from './application/auth.service';
import { InMemoryStatisticsRepository } from './infrastructure/repository/in-memory-repository';
import { EnvUserRepository, EnvUserConfig } from './infrastructure/auth/env-user-repository';
import { StatisticsController } from './infrastructure/http/statistics.controller';
import { AuthController } from './infrastructure/http/auth.controller';
import { jwtAuth } from './infrastructure/auth/jwt-middleware';
import { notFoundHandler, errorHandler } from './infrastructure/http/error-handler';

/** Configuración de la aplicación (permite inyectar valores en pruebas). */
export interface AppConfig {
  port?: number;
  auth?: AuthConfig;
  envUser?: EnvUserConfig;
  /** Máximo de intentos de login por ventana e IP (anti fuerza bruta). */
  loginRateLimit?: number;
}

/** Crea y configura la aplicación Express con las dependencias inyectadas. */
export function createApp(config: AppConfig = {}): Express {
  const app = express();

  // Repositorio de usuarios (puerto de salida de auth).
  // AUTH_PASSWORD debe contener un hash bcrypt; el default es un hash de
  // "password123" para desarrollo.
  const userConfig: EnvUserConfig = config.envUser ?? {
    username: process.env.AUTH_USER ?? 'admin',
    password: process.env.AUTH_PASSWORD ?? '$2b$10$TUTDxxdMlDFF/RWFarXTcuMceWFdtpIMvdwt3FNhJGopg0QZXC.Tu',
  };
  const userRepository = new EnvUserRepository(userConfig);

  // Servicio de autenticación (caso de uso).
  const authConfig: AuthConfig = config.auth ?? {
    secret: process.env.JWT_SECRET ?? 'interseguro-dev-secret',
    issuer: process.env.JWT_ISSUER ?? 'interseguro',
    audience: process.env.JWT_AUDIENCE ?? 'interseguro-api',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  };
  const authService = new AuthServiceImpl(userRepository, authConfig);
  const authController = new AuthController(authService);

  // Repositorio y caso de uso de estadísticas.
  const repository = new InMemoryStatisticsRepository(); // puerto de salida
  const service = new StatisticsServiceImpl(repository); // caso de uso
  const controller = new StatisticsController(service);  // puerto de entrada

  app.use(express.json({ limit: '1mb' }));

  // Cabeceras de seguridad HTTP básicas (helmet). La CSP se gestiona en el
  // frontend (Cloudflare Pages) vía public/_headers.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: { action: 'deny' },
    }),
  );

  // CORS: permite que el frontend (Cloudflare Pages o dev) consuma la API.
  const corsOrigin = process.env.CORS_ORIGIN ?? '*';
  app.use(cors({ origin: corsOrigin, allowedHeaders: ['Content-Type', 'Authorization'] }));

  // Rate limiting en el login para mitigar fuerza bruta.
  const loginMax = config.loginRateLimit ?? 10;
  app.use(
    '/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      limit: loginMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'too many login attempts, try again later', code: 'RATE_LIMITED' },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'node-api' });
  });

  // Autenticación: login público, resto protegido.
  app.use('/auth', authController.router);
  app.use('/statistics', jwtAuth(authService), controller.router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const PORT = Number(process.env.PORT) || 3000;

if (require.main === module) {
  createApp().listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Node API listening on :${PORT}`);
  });
}
