import { describe, expect, it } from 'vitest';
import { EnvUserRepository } from './env-user-repository';

// Hash bcrypt de "password123" (generado con bcryptjs, cost 10).
const PASSWORD123_HASH = '$2b$10$TUTDxxdMlDFF/RWFarXTcuMceWFdtpIMvdwt3FNhJGopg0QZXC.Tu';

describe('EnvUserRepository', () => {
  it('devuelve el usuario si la contraseña coincide con el hash bcrypt', async () => {
    const repo = new EnvUserRepository({ username: 'admin', password: PASSWORD123_HASH });
    const user = await repo.findByCredentials({ username: 'admin', password: 'password123' });
    expect(user).toEqual({ username: 'admin' });
  });

  it('devuelve null si la contraseña no coincide con el hash', async () => {
    const repo = new EnvUserRepository({ username: 'admin', password: PASSWORD123_HASH });
    const user = await repo.findByCredentials({ username: 'admin', password: 'incorrecta' });
    expect(user).toBeNull();
  });

  it('devuelve null si el usuario es desconocido (incluso con password correcta)', async () => {
    const repo = new EnvUserRepository({ username: 'admin', password: PASSWORD123_HASH });
    const user = await repo.findByCredentials({ username: 'otro', password: 'password123' });
    expect(user).toBeNull();
  });

  it('soporta comparación directa para desarrollo (valor no-hash)', async () => {
    const repo = new EnvUserRepository({ username: 'admin', password: 'password123' });
    expect(await repo.findByCredentials({ username: 'admin', password: 'password123' })).toEqual({
      username: 'admin',
    });
    expect(await repo.findByCredentials({ username: 'admin', password: 'mala' })).toBeNull();
  });
});
