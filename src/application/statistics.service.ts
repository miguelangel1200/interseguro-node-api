/**
 * Capa de aplicación: casos de uso.
 * Orquesta el dominio puro y los puertos de salida, sin depender de Express.
 */
import { randomUUID } from 'crypto';
import { computeStatistics, StatisticsPayload } from '../domain/statistics';
import { StatisticsService, StatisticsResult } from './ports/statistics-service';
import { StatisticsRepository } from './ports/statistics-repository';

/** Error de validación de la aplicación con código estable. */
export class ValidationError extends Error {
  code = 'VALIDATION_ERROR';
}

/**
 * Caso de uso (servicio de aplicación) de estadísticas.
 * Implementa el puerto de entrada StatisticsService.
 */
export class StatisticsServiceImpl implements StatisticsService {
  constructor(private readonly repository: StatisticsRepository) {}

  /**
   * Calcula las estadísticas de los datos recibidos y las persiste.
   */
  async getStatistics(payload: StatisticsPayload): Promise<StatisticsResult> {
    if (!payload.Q || !payload.R) {
      const error = new ValidationError('fields Q and R are required');
      throw error;
    }

    const statistics = computeStatistics(payload);
    const id = randomUUID();
    await this.repository.save(id, statistics);

    return { id, statistics };
  }
}
