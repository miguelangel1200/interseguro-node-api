import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { StatisticsController } from './statistics.controller';
import { AuthService } from '../../application/ports/auth-service';
import { StatisticsService } from '../../application/ports/statistics-service';
import { Statistics } from '../../domain/statistics';

function appWith(router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

function errorCaptureApp(router: express.Router) {
  const app = express();
  app.use(express.json());
  app.use(router);
  app.use((err: Error, _req: Request, _res: Response, next: NextFunction) => {
    app.locals.caughtError = err;
    next();
  });
  return app;
}

const sampleStats: Statistics = {
  rotated: null,
  original: null,
  q: { rows: 1, cols: 1, sum: 1, mean: 1, max: 1, min: 1, isDiagonal: true, frobeniusNorm: 1 },
  r: { rows: 1, cols: 1, sum: 2, mean: 2, max: 2, min: 2, isDiagonal: true, frobeniusNorm: 2 },
  qr: { qRows: 1, qCols: 1, rRows: 1, rCols: 1, rFrobeniusNorm: 2, determinantOfR: 2, isSquare: true, isDiagonal: true },
  orthogonalityError: 0,
  global: { max: 2, min: 1, mean: 1.5, sum: 3, matricesCount: 2 },
  diagonal: { any: false, matrices: [] },
};

describe('AuthController', () => {
  it('responde 200 con token y expiresIn', async () => {
    const service = {
      login: vi.fn().mockResolvedValue({ token: 'jwt', expiresIn: 7200 }),
      verify: vi.fn(),
    } as unknown as AuthService;

    const res = await request(appWith(new AuthController(service).router))
      .post('/login')
      .send({ username: 'admin', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'jwt', expiresIn: 7200 });
    expect(service.login).toHaveBeenCalledWith({ username: 'admin', password: 'password123' });
  });

  it('envía el error de login al middleware siguiente', async () => {
    const boom = new Error('credenciales inválidas');
    const service = {
      login: vi.fn().mockRejectedValue(boom),
      verify: vi.fn(),
    } as unknown as AuthService;

    const app = errorCaptureApp(new AuthController(service).router);
    const res = await request(app).post('/login').send({ username: 'admin', password: 'mala' });

    expect(res.status).toBe(404); // el error solo se captura, no se responde aquí
    expect(app.locals.caughtError).toBe(boom);
  });
});

describe('StatisticsController', () => {
  it('responde 200 con id y estadísticas', async () => {
    const service = {
      getStatistics: vi.fn().mockResolvedValue({ id: 'id-1', statistics: sampleStats }),
    } as unknown as StatisticsService;

    const res = await request(appWith(new StatisticsController(service).router))
      .post('/')
      .send({ Q: [[1, 0], [0, 1]], R: [[2, 1], [0, 1]] });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('id-1');
    expect(res.body.statistics).toEqual(sampleStats);
  });

  it('envía el error del servicio al middleware siguiente', async () => {
    const boom = new Error('fallo del servicio');
    const service = {
      getStatistics: vi.fn().mockRejectedValue(boom),
    } as unknown as StatisticsService;

    const app = errorCaptureApp(new StatisticsController(service).router);
    const res = await request(app).post('/').send({ Q: [[1]], R: [[2]] });

    expect(res.status).toBe(404);
    expect(app.locals.caughtError).toBe(boom);
  });
});
