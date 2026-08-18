/**
 * Capa de infraestructura (adaptador de entrada): controller Express para
 * POST /statistics. Depende únicamente del puerto de entrada StatisticsService.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { StatisticsService } from '../../application/ports/statistics-service';
import { toStatisticsRequest, toStatisticsResponse } from './dto';

export class StatisticsController {
  readonly router: Router;

  constructor(private readonly service: StatisticsService) {
    this.router = Router();
    this.router.post('/', this.handlePost.bind(this));
  }

  private async handlePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = toStatisticsRequest(req.body);
      const result = await this.service.getStatistics(request);
      res.json(toStatisticsResponse(result));
    } catch (err) {
      next(err);
    }
  }
}
