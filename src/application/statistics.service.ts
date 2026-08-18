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

/** Límite de filas/columnas para prevenir cargas excesivas (DoS). */
export const MAX_MATRIX_DIMENSION = 100;

/** Valida que una matriz no supere las dimensiones máximas permitidas. */
function assertMatrixSize(name: string, matrix: StatisticsPayload['Q'] | undefined): void {
  if (!matrix) return;
  const rows = matrix.length;
  const cols = matrix[0] ? matrix[0].length : 0;
  if (rows > MAX_MATRIX_DIMENSION || cols > MAX_MATRIX_DIMENSION) {
    const error = new ValidationError(
      `matrix "${name}" exceeds the maximum allowed dimensions (${MAX_MATRIX_DIMENSION}x${MAX_MATRIX_DIMENSION})`,
    );
    throw error;
  }
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

    // Previene cargas excesivas: matrices más grandes de lo permitido se
    // rechazan antes de computar (el cálculo es O(n³) en el peor caso).
    assertMatrixSize('Q', payload.Q);
    assertMatrixSize('R', payload.R);
    assertMatrixSize('rotated', payload.rotated);
    assertMatrixSize('original', payload.original);

    const statistics = computeStatistics(payload);
    const id = randomUUID();
    await this.repository.save(id, statistics);

    return { id, statistics };
  }
}
