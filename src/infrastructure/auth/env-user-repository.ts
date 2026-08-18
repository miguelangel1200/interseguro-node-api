/**
 * Capa de infraestructura (adaptador de salida): repositorio de usuarios
 * basado en variables de entorno. Implementa el puerto UserRepository.
 *
 * Nota: para esta prueba técnica las credenciales se leen de AUTH_USER /
 * AUTH_PASSWORD. En producción deberían almacenarse en un gestor de secretos
 * y la contraseña compararse contra un hash (bcrypt/argon2), nunca en claro.
 */
import { Credentials, User } from '../../domain/auth';
import { UserRepository } from '../../application/ports/user-repository';

export interface EnvUserConfig {
  username: string;
  password: string;
}

export class EnvUserRepository implements UserRepository {
  constructor(private readonly config: EnvUserConfig) {}

  async findByCredentials(credentials: Credentials): Promise<User | null> {
    if (
      credentials.username === this.config.username &&
      credentials.password === this.config.password
    ) {
      return { username: credentials.username };
    }
    return null;
  }
}
