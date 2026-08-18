/**
 * Capa de infraestructura (adaptador de salida): repositorio de estadísticas
 * en memoria. Implementa el puerto StatisticsRepository.
 *
 * Se usa un Map como almacenamiento simple. En producción podría sustituirse
 * por una implementación sobre base de datos (Postgres, DynamoDB, etc.) sin
 * modificar el caso de uso.
 */
import { Statistics } from '../../domain/statistics';
import { StatisticsRepository } from '../../application/ports/statistics-repository';

export class InMemoryStatisticsRepository implements StatisticsRepository {
  private readonly store: Map<string, Statistics> = new Map();

  async save(id: string, statistics: Statistics): Promise<void> {
    this.store.set(id, statistics);
  }

  async findById(id: string): Promise<Statistics | null> {
    return this.store.has(id) ? this.store.get(id)! : null;
  }
}
