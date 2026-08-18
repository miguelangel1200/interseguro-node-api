import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { jwtAuth } from './jwt-middleware';
import { AuthService } from '../../application/ports/auth-service';
import { UnauthorizedError } from '../../application/auth.service';
import { TokenPayload } from '../../domain/auth';

function appWith(auth: AuthService) {
  const app = express();
  app.get(
    '/protegida',
    jwtAuth(auth),
    (req, res) => {
      res.json({ user: res.locals.authUser });
    },
  );
  return app;
}

const payload: TokenPayload = { sub: 'admin', username: 'admin' };

describe('jwtAuth', () => {
  it('rechaza con 401 si no hay header Authorization', async () => {
    const auth = { login: vi.fn(), verify: vi.fn() } as unknown as AuthService;
    const res = await request(appWith(auth)).get('/protegida');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'missing bearer token', code: 'UNAUTHORIZED' });
  });

  it('rechaza con 401 si el header no es Bearer', async () => {
    const auth = { login: vi.fn(), verify: vi.fn() } as unknown as AuthService;
    const res = await request(appWith(auth)).get('/protegida').set('Authorization', 'Basic abc');

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('rechaza con 401 si el token no es válido', async () => {
    const auth = {
      login: vi.fn(),
      verify: vi.fn().mockRejectedValue(new UnauthorizedError('invalid or expired token')),
    } as unknown as AuthService;

    const res = await request(appWith(auth)).get('/protegida').set('Authorization', 'Bearer invalido');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'invalid or expired token', code: 'UNAUTHORIZED' });
  });

  it('permite el acceso y adjunta el payload al locals con un token válido', async () => {
    const auth = {
      login: vi.fn(),
      verify: vi.fn().mockResolvedValue(payload),
    } as unknown as AuthService;

    const res = await request(appWith(auth)).get('/protegida').set('Authorization', 'Bearer token-valido');
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(payload);
  });

  it('recorta espacios alrededor del token', async () => {
    const auth = {
      login: vi.fn(),
      verify: vi.fn().mockResolvedValue(payload),
    } as unknown as AuthService;

    const res = await request(appWith(auth)).get('/protegida').set('Authorization', 'Bearer   token-valido  ');
    expect(res.status).toBe(200);
    expect(auth.verify).toHaveBeenCalledWith('token-valido');
  });
});
