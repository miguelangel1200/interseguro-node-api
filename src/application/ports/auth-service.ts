/**
 * Puerto de entrada (contrato) del caso de uso de autenticación.
 */
import { Credentials, AuthResult, TokenPayload } from '../../domain/auth';

export interface AuthService {
  /** Autentica con credenciales y devuelve un token JWT. */
  login(credentials: Credentials): Promise<AuthResult>;
  /** Verifica un token JWT y devuelve su payload si es válido. */
  verify(token: string): Promise<TokenPayload>;
}
