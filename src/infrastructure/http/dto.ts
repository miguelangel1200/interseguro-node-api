/**
 * DTOs de entrada y salida del adaptador HTTP (capa de infraestructura).
 * Separan la forma de los datos en la frontera HTTP de la lógica de dominio.
 */
import { Matrix, StatisticsPayload } from '../../domain/statistics';
import { StatisticsResult } from '../../application/ports/statistics-service';

/** DTO de petición que la API Go envía a /statistics. */
export interface StatisticsRequestDTO {
  Q: Matrix;
  R: Matrix;
  rotated?: Matrix;
  original?: Matrix;
}

/** Convierte el cuerpo HTTP en el DTO de petición del caso de uso. */
export function toStatisticsRequest(body: unknown): StatisticsPayload {
  const { Q, R, rotated, original } = (body ?? {}) as Partial<StatisticsRequestDTO>;
  return { Q: Q as Matrix, R: R as Matrix, rotated, original };
}

/** Convierte el resultado del caso de uso en el DTO de respuesta HTTP. */
export function toStatisticsResponse(result: StatisticsResult): StatisticsResponseDTO {
  return { id: result.id, statistics: result.statistics };
}

/** DTO de respuesta de POST /statistics. */
export interface StatisticsResponseDTO {
  id: string;
  statistics: import('../../domain/statistics').Statistics;
}

/** DTO de petición de POST /auth/login. */
export interface LoginRequestDTO {
  username?: string;
  password?: string;
}

/** Convierte el cuerpo HTTP de login en credenciales del caso de uso. */
export function toLoginRequest(body: unknown): { username: string; password: string } {
  const { username, password } = (body ?? {}) as LoginRequestDTO;
  return { username: username ?? '', password: password ?? '' };
}

/** DTO de respuesta de POST /auth/login. */
export interface AuthResponseDTO {
  token: string;
  expiresIn: number;
}

/** Convierte el resultado de autenticación en el DTO de respuesta HTTP. */
export function toAuthResponse(result: import('../../domain/auth').AuthResult): AuthResponseDTO {
  return { token: result.token, expiresIn: result.expiresIn };
}
