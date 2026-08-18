import { describe, expect, it, vi } from 'vitest';
import { AuthServiceImpl, UnauthorizedError } from './auth.service';
import { UserRepository } from './ports/user-repository';
import { Credentials } from '../domain/auth';

/** Repositorio de usuarios mockeado con datos de prueba. */
function mockUserRepo(): { repo: UserRepository; findByCredentials: ReturnType<typeof vi.fn> } {
  const findByCredentials = vi.fn();
  const repo = { findByCredentials };
  return { repo: repo as unknown as UserRepository, findByCredentials };
}

const config = {
  secret: 'test-secret',
  issuer: 'interseguro',
  audience: 'interseguro-api',
  expiresIn: '2h',
};

describe('AuthServiceImpl.login', () => {
  it('devuelve un token y expiresIn en segundos con credenciales válidas', async () => {
    const { repo, findByCredentials } = mockUserRepo();
    findByCredentials.mockResolvedValue({ username: 'admin' });
    const service = new AuthServiceImpl(repo, config);

    const result = await service.login({ username: 'admin', password: 'password123' } satisfies Credentials);

    expect(result.token).toBeTruthy();
    expect(result.expiresIn).toBe(7200); // 2h
    expect(findByCredentials).toHaveBeenCalledWith({
      username: 'admin',
      password: 'password123',
    });
  });

  it('lanza UnauthorizedError si el usuario no existe', async () => {
    const { repo, findByCredentials } = mockUserRepo();
    findByCredentials.mockResolvedValue(null);
    const service = new AuthServiceImpl(repo, config);

    await expect(service.login({ username: 'x', password: 'y' })).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('usa expiresIn numérico directamente', async () => {
    const { repo, findByCredentials } = mockUserRepo();
    findByCredentials.mockResolvedValue({ username: 'admin' });
    const service = new AuthServiceImpl(repo, { ...config, expiresIn: 900 });

    const result = await service.login({ username: 'admin', password: 'password123' });
    expect(result.expiresIn).toBe(900);
  });
});

describe('AuthServiceImpl.verify', () => {
  it('devuelve el payload de un token firmado por el mismo servicio', async () => {
    const { repo, findByCredentials } = mockUserRepo();
    findByCredentials.mockResolvedValue({ username: 'admin' });
    const service = new AuthServiceImpl(repo, config);

    const { token } = await service.login({ username: 'admin', password: 'password123' });
    const payload = await service.verify(token);

    expect(payload.sub).toBe('admin');
    expect(payload.username).toBe('admin');
  });

  it('lanza UnauthorizedError para un token inválido', async () => {
    const service = new AuthServiceImpl(mockUserRepo().repo, config);
    await expect(service.verify('token-no-valido')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('lanza UnauthorizedError si el issuer no coincide', async () => {
    const { repo, findByCredentials } = mockUserRepo();
    findByCredentials.mockResolvedValue({ username: 'admin' });
    const service = new AuthServiceImpl(repo, config);
    const { token } = await service.login({ username: 'admin', password: 'x' });

    const other = new AuthServiceImpl(repo, { ...config, issuer: 'otro-issuer' });
    await expect(other.verify(token)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('lanza UnauthorizedError si la audience no coincide', async () => {
    const { repo, findByCredentials } = mockUserRepo();
    findByCredentials.mockResolvedValue({ username: 'admin' });
    const service = new AuthServiceImpl(repo, config);
    const { token } = await service.login({ username: 'admin', password: 'x' });

    const other = new AuthServiceImpl(repo, { ...config, audience: 'otra-audience' });
    await expect(other.verify(token)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('lanza UnauthorizedError si el token expiró', async () => {
    const service = new AuthServiceImpl(mockUserRepo().repo, config);
    await expect(service.verify('abc.def.ghi')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('AuthServiceImpl: duración del token (expiresIn)', () => {
  it.each([
    ['1s', 1],
    ['2m', 120],
    ['3h', 10800],
    ['1d', 86400],
  ])('convierte "%s" a %d segundos', async (duration, seconds) => {
    const { repo, findByCredentials } = mockUserRepo();
    findByCredentials.mockResolvedValue({ username: 'admin' });
    const service = new AuthServiceImpl(repo, { ...config, expiresIn: duration });

    const result = await service.login({ username: 'admin', password: 'x' });
    expect(result.expiresIn).toBe(seconds);
  });

  it('rechaza formatos de duración desconocidos (valida jsonwebtoken)', async () => {
    const { repo, findByCredentials } = mockUserRepo();
    findByCredentials.mockResolvedValue({ username: 'admin' });
    const service = new AuthServiceImpl(repo, { ...config, expiresIn: 'desconocido' });

    await expect(service.login({ username: 'admin', password: 'x' })).rejects.toThrow();
  });
});
