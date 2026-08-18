import { describe, expect, it, vi } from 'vitest';
import { MAX_MATRIX_DIMENSION, StatisticsServiceImpl, ValidationError } from './statistics.service';
import { StatisticsRepository } from './ports/statistics-repository';
import { Statistics } from '../domain/statistics';

class FakeRepository implements StatisticsRepository {
  saved: { id: string; statistics: Statistics } | null = null;
  async save(id: string, statistics: Statistics): Promise<void> {
    this.saved = { id, statistics };
  }
  async findById(id: string): Promise<Statistics | null> {
    return this.saved?.id === id ? this.saved.statistics : null;
  }
}

describe('StatisticsServiceImpl', () => {
  it('calcula y persiste las estadísticas con un id', async () => {
    const repo = new FakeRepository();
    const service = new StatisticsServiceImpl(repo);

    const Q = [[1, 0], [0, 1]];
    const R = [[2, 1], [0, 1]];

    const result = await service.getStatistics({ Q, R });

    expect(result.id).toBeTruthy();
    expect(repo.saved?.id).toBe(result.id);
    expect(result.statistics.qr.isSquare).toBe(true);
  });

  it('lanza ValidationError cuando faltan Q o R', async () => {
    const service = new StatisticsServiceImpl(new FakeRepository());
    await expect(service.getStatistics({} as never)).rejects.toBeInstanceOf(ValidationError);
  });

  it('lanza ValidationError con código estable', async () => {
    const service = new StatisticsServiceImpl(new FakeRepository());
    try {
      await service.getStatistics({ Q: undefined, R: undefined } as never);
    } catch (err) {
      expect((err as ValidationError).code).toBe('VALIDATION_ERROR');
    }
  });

  it('persiste mediante el repositorio inyectado', async () => {
    const save = vi.fn();
    const repo = { save, findById: vi.fn() };
    const service = new StatisticsServiceImpl(repo);

    await service.getStatistics({ Q: [[1]], R: [[2]] });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('rechaza matrices que superan las dimensiones máximas', async () => {
    const service = new StatisticsServiceImpl(new FakeRepository());

    // Matriz (MAX+1) x 1 en Q.
    const tooLarge = Array.from({ length: MAX_MATRIX_DIMENSION + 1 }, () => [1]);
    await expect(
      service.getStatistics({ Q: tooLarge, R: [[2]] }),
    ).rejects.toBeInstanceOf(ValidationError);

    // Matriz 1 x (MAX+1) en R.
    const tooWide = [Array.from({ length: MAX_MATRIX_DIMENSION + 1 }, () => 1)];
    await expect(
      service.getStatistics({ Q: [[1]], R: tooWide }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('acepta matrices en el límite máximo', async () => {
    const service = new StatisticsServiceImpl(new FakeRepository());
    const atLimit = Array.from({ length: MAX_MATRIX_DIMENSION }, () =>
      Array.from({ length: MAX_MATRIX_DIMENSION }, () => 1),
    );
    const result = await service.getStatistics({ Q: atLimit, R: atLimit });
    expect(result.id).toBeTruthy();
  });
});
