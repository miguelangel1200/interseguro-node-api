/**
 * Capa de aplicación: caso de uso de autenticación.
 * Implementa el puerto de entrada AuthService usando jsonwebtoken (HS256).
 * No depende de Express.
 */
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { Credentials, AuthResult, TokenPayload, User } from '../domain/auth';
import { AuthService } from './ports/auth-service';
import { UserRepository } from './ports/user-repository';

/** Error de autenticación (credenciales inválidas o token no válido). */
export class UnauthorizedError extends Error {
  code = 'UNAUTHORIZED';
  constructor(message = 'unauthorized') {
    super(message);
  }
}

/** Configuración del servicio JWT. */
export interface AuthConfig {
  secret: string;
  issuer: string;
  audience: string;
  expiresIn: string | number;
}

export class AuthServiceImpl implements AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly config: AuthConfig,
  ) {}

  async login(credentials: Credentials): Promise<AuthResult> {
    const user = await this.users.findByCredentials(credentials);
    if (!user) {
      throw new UnauthorizedError('invalid credentials');
    }
    return this.sign(user);
  }

  async verify(token: string): Promise<TokenPayload> {
    try {
      const options: VerifyOptions = {
        issuer: this.config.issuer,
        audience: this.config.audience,
      };
      const payload = jwt.verify(token, this.config.secret, options) as jwt.JwtPayload;
      return { sub: String(payload.sub), username: String(payload.username) };
    } catch {
      throw new UnauthorizedError('invalid or expired token');
    }
  }

  private sign(user: User): AuthResult {
    const payload: TokenPayload = { sub: user.username, username: user.username };
    const options: SignOptions = {
      issuer: this.config.issuer,
      audience: this.config.audience,
      expiresIn: this.config.expiresIn as SignOptions['expiresIn'],
    };
    const token = jwt.sign(payload, this.config.secret, options);
    const expiresIn = typeof this.config.expiresIn === 'number'
      ? this.config.expiresIn
      : secondsFromDuration(this.config.expiresIn);
    return { token, expiresIn };
  }
}

/** Convierte una duración tipo "2h" a segundos. */
function secondsFromDuration(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 3600;
  const value = Number(match[1]);
  switch (match[2]) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 3600;
  }
}
