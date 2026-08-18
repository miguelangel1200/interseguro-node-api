/**
 * Capa de dominio: autenticación.
 * Define los tipos y reglas puras de autenticación, sin dependencias externas.
 */

/** Credenciales de un usuario. */
export interface Credentials {
  username: string;
  password: string;
}

/** Usuario autenticado. */
export interface User {
  username: string;
}

/** Payload que viaja dentro del token JWT. */
export interface TokenPayload {
  sub: string;
  username: string;
}

/** Resultado de la autenticación. */
export interface AuthResult {
  token: string;
  expiresIn: number;
}
