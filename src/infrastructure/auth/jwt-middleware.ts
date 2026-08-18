/**
 * Capa de infraestructura: middleware de autenticación JWT para Express.
 * Extrae el token de `Authorization: Bearer <token>`, lo verifica y adjunta
 * el usuario autenticado a res.locals.authUser.
 */
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/ports/auth-service';
import { TokenPayload } from '../../domain/auth';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      authUser?: TokenPayload;
    }
  }
}

/** Crea un middleware que protege rutas exigiendo un JWT válido. */
export function jwtAuth(auth: AuthService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'missing bearer token', code: 'UNAUTHORIZED' });
      return;
    }

    const token = header.slice('Bearer '.length).trim();
    try {
      const payload = await auth.verify(token);
      res.locals.authUser = payload;
      next();
    } catch {
      res.status(401).json({ error: 'invalid or expired token', code: 'UNAUTHORIZED' });
    }
  };
}
