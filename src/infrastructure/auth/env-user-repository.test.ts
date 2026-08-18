import { describe, expect, it } from 'vitest';
import { EnvUserRepository } from './env-user-repository';

describe('EnvUserRepository', () => {
  const repo = new EnvUserRepository({ username: 'admin', password: 'password123' });

  it('devuelve el usuario si las credenciales coinciden', async () => {
    const user = await repo.findByCredentials({ username: 'admin', password: 'password123' });
    expect(user).toEqual({ username: 'admin' });
  });

  it('devuelve null si la contraseña es incorrecta', async () => {
    const user = await repo.findByCredentials({ username: 'admin', password: 'incorrecta' });
    expect(user).toBeNull();
  });

  it('devuelve null si el usuario es desconocido', async () => {
    const user = await repo.findByCredentials({ username: 'otro', password: 'password123' });
    expect(user).toBeNull();
  });
});
