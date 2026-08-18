/**
 * Capa de infraestructura (adaptador de entrada): controller Express para
 * POST /auth/login. Depende únicamente del puerto de entrada AuthService.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/ports/auth-service';
import { toLoginRequest, toAuthResponse } from './dto';

export class AuthController {
  readonly router: Router;

  constructor(private readonly service: AuthService) {
    this.router = Router();
    this.router.post('/login', this.handleLogin.bind(this));
  }

  private async handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = toLoginRequest(req.body);
      const result = await this.service.login(credentials);
      res.json(toAuthResponse(result));
    } catch (err) {
      next(err);
    }
  }
}
