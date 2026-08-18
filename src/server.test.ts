import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './server';

const ENV_KEYS = ['AUTH_USER', 'AUTH_PASSWORD', 'JWT_SECRET', 'JWT_ISSUER', 'JWT_AUDIENCE', 'JWT_EXPIRES_IN', 'CORS_ORIGIN'] as const;

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

afterEach(() => {
  clearEnv();
});

describe('createApp con valores por defecto', () => {
  it('usa los defaults de entorno cuando no se pasa configuración', async () => {
    clearEnv();
    const app = createApp();

    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'ok', service: 'node-api' });

    // Login con las credenciales por defecto (admin/password123).
    const login = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
  });

  it('aplica CORS por defecto (*) cuando no hay CORS_ORIGIN', async () => {
    clearEnv();
    const app = createApp();
    const res = await request(app)
      .options('/auth/login')
      .set('Origin', 'https://ejemplo.com')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});

describe('createApp con variables de entorno', () => {
  it('toma credenciales del entorno (AUTH_PASSWORD como hash bcrypt)', async () => {
    clearEnv();
    process.env.AUTH_USER = 'envuser';
    process.env.AUTH_PASSWORD = '$2b$10$TUTDxxdMlDFF/RWFarXTcuMceWFdtpIMvdwt3FNhJGopg0QZXC.Tu'; // hash de password123
    process.env.JWT_SECRET = 'env-secret';
    process.env.CORS_ORIGIN = 'https://intranet.example.com';

    const app = createApp();
    const bad = await request(app)
      .post('/auth/login')
      .send({ username: 'envuser', password: 'password-incorrecta' });
    expect(bad.status).toBe(401);

    const ok = await request(app).post('/auth/login').send({ username: 'envuser', password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();

    const cors = await request(app)
      .options('/auth/login')
      .set('Origin', 'https://intranet.example.com')
      .set('Access-Control-Request-Method', 'POST');
    expect(cors.headers['access-control-allow-origin']).toBe('https://intranet.example.com');
  });
});
