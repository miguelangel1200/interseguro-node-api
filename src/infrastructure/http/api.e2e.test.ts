import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'http';
import { createApp } from '../../server';

// E2E: levanta el servidor real (Express) en un puerto efímero y lo ejercita
// por HTTP con datos de prueba (repo en memoria + credenciales mockeadas).
let server: Server;
let baseURL: string;

beforeAll(async () => {
  const app = createApp({
    envUser: { username: 'admin', password: '$2b$10$TUTDxxdMlDFF/RWFarXTcuMceWFdtpIMvdwt3FNhJGopg0QZXC.Tu' },
    auth: {
      secret: 'e2e-secret',
      issuer: 'interseguro',
      audience: 'interseguro-api',
      expiresIn: '1h',
    },
  });
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  if (address && typeof address === 'object') {
    baseURL = `http://127.0.0.1:${address.port}`;
  } else {
    throw new Error('no se pudo obtener el puerto del servidor');
  }
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('E2E: ciclo completo sobre HTTP', () => {
  it('GET /health responde ok', async () => {
    const res = await fetch(`${baseURL}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', service: 'node-api' });
  });

  it('login → POST /statistics devuelve estadísticas', async () => {
    const login = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });
    expect(login.status).toBe(200);
    const { token } = (await login.json()) as { token: string };

    const Q = [[0.316227766, 0.948683298], [0.948683298, -0.316227766]];
    const R = [[3.16227766, 4.427188724], [0, 0.632455532]];

    const stats = await fetch(`${baseURL}/statistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ Q, R }),
    });
    expect(stats.status).toBe(200);
    const body = (await stats.json()) as { id: string; statistics: { orthogonalityError: number; qr: { determinantOfR: number }; global: { matricesCount: number } } };
    expect(body.id).toBeTruthy();
    expect(body.statistics.orthogonalityError).toBeCloseTo(0, 6);
    expect(body.statistics.qr.determinantOfR).toBeCloseTo(2, 6);
    expect(body.statistics.global.matricesCount).toBe(2);
  });

  it('rechaza /statistics sin token', async () => {
    const res = await fetch(`${baseURL}/statistics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Q: [[1]], R: [[2]] }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('responde 404 a rutas inexistentes', async () => {
    const res = await fetch(`${baseURL}/no-existe`);
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: 'NOT_FOUND' });
  });

  it('CORS: preflight OPTIONS permite el origen y Authorization', async () => {
    const res = await fetch(`${baseURL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://interseguro-frontend.pages.dev',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-headers') ?? '').toMatch(/authorization/i);
  });
});
