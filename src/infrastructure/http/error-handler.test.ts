import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../application/statistics.service';
import { UnauthorizedError } from '../../application/auth.service';
import { errorHandler, notFoundHandler } from './error-handler';

function appWith(handler: (req: express.Request, res: express.Response, next: express.NextFunction) => void) {
  const app = express();
  app.get('/boom', (req, res, next) => handler(req, res, next));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('notFoundHandler', () => {
  it('devuelve 404 con el formato de error normalizado', async () => {
    const app = express();
    app.use(notFoundHandler);
    app.use(errorHandler);

    const res = await request(app).get('/ruta-inexistente');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not found', code: 'NOT_FOUND' });
  });
});

describe('errorHandler', () => {
  it('mapea ValidationError a 400 con su código', async () => {
    const app = appWith((_req, _res, next) => {
      const err = new ValidationError('fields Q and R are required');
      next(err);
    });

    const res = await request(app).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'fields Q and R are required', code: 'VALIDATION_ERROR' });
  });

  it('mapea UnauthorizedError a 401', async () => {
    const app = appWith((_req, _res, next) => next(new UnauthorizedError('invalid credentials')));

    const res = await request(app).get('/boom');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('usa status/code del error para 4xx', async () => {
    const app = appWith((_req, _res, next) => {
      const err: Error & { status?: number; code?: string } = new Error('recurso ocupado');
      err.status = 409;
      err.code = 'CONFLICT';
      next(err);
    });

    const res = await request(app).get('/boom');
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'recurso ocupado', code: 'CONFLICT' });
  });

  it('enmascara el mensaje en errores 500', async () => {
    const app = appWith((_req, _res, next) => next(new Error('detalle interno sensible')));

    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'internal server error', code: 'INTERNAL_SERVER_ERROR' });
  });
});
