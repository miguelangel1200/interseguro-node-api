/**
 * Capa de infraestructura (adaptador de salida): repositorio de usuarios
 * basado en variables de entorno. Implementa el puerto UserRepository.
 *
 * La contraseña se compara contra un hash bcrypt (AUTH_PASSWORD debe contener
 * el hash, no el texto plano). Para desarrollo/local se permite comparación
 * directa si el valor no es un hash bcrypt, pero en producción debe usarse
 * siempre un hash.
 */
import bcrypt from 'bcryptjs';
import { Credentials, User } from '../../domain/auth';
import { UserRepository } from '../../application/ports/user-repository';

export interface EnvUserConfig {
  username: string;
  password: string;
}

export class EnvUserRepository implements UserRepository {
  constructor(private readonly config: EnvUserConfig) {}

  async findByCredentials(credentials: Credentials): Promise<User | null> {
    const usernameOk = credentials.username === this.config.username;
    const passwordOk = await this.verifyPassword(credentials.password, this.config.password);
    if (usernameOk && passwordOk) {
      return { username: credentials.username };
    }
    return null;
  }

  /** Compara la contraseña: bcrypt si el almacenado es un hash, directo en dev. */
  private async verifyPassword(input: string, stored: string): Promise<boolean> {
    if (stored.startsWith('$2')) {
      return bcrypt.compare(input, stored);
    }
    return input === stored;
  }
}
