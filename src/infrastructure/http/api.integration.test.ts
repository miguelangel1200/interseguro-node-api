import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server';

// Configuración determinista para las pruebas de integración.
function testApp() {
  return createApp({
    envUser: { username: 'admin', password: 'password123' },
    auth: {
      secret: 'test-secret',
      issuer: 'interseguro',
      audience: 'interseguro-api',
      expiresIn: '1h',
    },
  });
}

describe('POST /auth/login', () => {
  it('devuelve un token con credenciales válidas', async () => {
    const res = await request(testApp())
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(typeof res.body.expiresIn).toBe('number');
  });

  it('rechaza credenciales inválidas con 401', async () => {
    const res = await request(testApp())
      .post('/auth/login')
      .send({ username: 'admin', password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /statistics (protegido por JWT)', () => {
  const Q = [[0.316227766, 0.948683298], [0.948683298, -0.316227766]];
  const R = [[3.16227766, 4.427188724], [0, 0.632455532]];

  it('rechaza la petición sin token con 401', async () => {
    const res = await request(testApp()).post('/statistics').send({ Q, R });
    expect(res.status).toBe(401);
  });

  it('rechaza un token inválido con 401', async () => {
    const res = await request(testApp())
      .post('/statistics')
      .set('Authorization', 'Bearer token-invalido')
      .send({ Q, R });
    expect(res.status).toBe(401);
  });

  it('acepta un token válido y devuelve estadísticas', async () => {
    const app = testApp();

    const login = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' });
    const token = login.body.token;

    const res = await request(app)
      .post('/statistics')
      .set('Authorization', `Bearer ${token}`)
      .send({ Q, R });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeTruthy();
    expect(res.body.statistics.orthogonalityError).toBeCloseTo(0, 6);
    expect(res.body.statistics.qr.determinantOfR).toBeCloseTo(2, 6);
    expect(res.body.statistics.global.max).toBeCloseTo(4.427189, 6);
    expect(res.body.statistics.global.min).toBeCloseTo(-0.316228, 6);
    expect(res.body.statistics.global.matricesCount).toBe(2);
    expect(res.body.statistics.diagonal.any).toBe(false);
  });

  it('devuelve 400 si faltan Q/R (incluso con token válido)', async () => {
    const app = testApp();
    const login = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'password123' });

    const res = await request(app)
      .post('/statistics')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('CORS', () => {
  it('responde al preflight OPTIONS permitiendo el origen y Authorization', async () => {
    const res = await request(testApp())
      .options('/auth/login')
      .set('Origin', 'https://interseguro-frontend.pages.dev')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-headers']).toMatch(/authorization/i);
  });
});

describe('Seguridad (helmet)', () => {
  it('incluye cabeceras de seguridad básicas', async () => {
    const res = await request(testApp()).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });
});

describe('Rate limiting del login', () => {
  it('bloquea con 429 tras superar el máximo de intentos', async () => {
    const app = createApp({
      envUser: { username: 'admin', password: 'password123' },
      auth: {
        secret: 'test-secret',
        issuer: 'interseguro',
        audience: 'interseguro-api',
        expiresIn: '1h',
      },
      loginRateLimit: 3,
    });

    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'incorrecta' });
      expect(res.status).toBe(401);
    }

    const blocked = await request(app)
      .post('/auth/login')
      .send({ username: 'admin', password: 'incorrecta' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
  });
});
