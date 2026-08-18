/**
 * Capa de infraestructura: manejo de errores HTTP normalizado.
 * Devuelve siempre una respuesta con la forma { error, code }.
 */
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ValidationError } from '../../application/statistics.service';
import { UnauthorizedError } from '../../application/auth.service';

/** Formato normalizado de error. */
export interface ErrorResponse {
  error: string;
  code: string;
}

/** Manejador de rutas no encontradas. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'not found', code: 'NOT_FOUND' } satisfies ErrorResponse);
}

/** Manejador de errores global de Express. */
export const errorHandler: ErrorRequestHandler = (
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message, code: err.code } satisfies ErrorResponse);
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message, code: err.code } satisfies ErrorResponse);
    return;
  }

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = status >= 500 ? 'internal server error' : err.message;

  // Evita exponer detalles internos en errores del servidor.
  res.status(status).json({ error: message, code } satisfies ErrorResponse);
};
