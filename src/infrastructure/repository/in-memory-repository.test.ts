import { describe, expect, it } from 'vitest';
import { InMemoryStatisticsRepository } from './in-memory-repository';
import { Statistics } from '../../domain/statistics';

describe('InMemoryStatisticsRepository', () => {
  const repo = new InMemoryStatisticsRepository();
  const stats: Statistics = {
    rotated: null,
    original: null,
    q: { rows: 1, cols: 1, sum: 1, mean: 1, max: 1, min: 1, isDiagonal: true, frobeniusNorm: 1 },
    r: { rows: 1, cols: 1, sum: 2, mean: 2, max: 2, min: 2, isDiagonal: true, frobeniusNorm: 2 },
    qr: { qRows: 1, qCols: 1, rRows: 1, rCols: 1, rFrobeniusNorm: 2, determinantOfR: 2, isSquare: true, isDiagonal: true },
    orthogonalityError: 0,
    global: { max: 2, min: 1, mean: 1.5, sum: 3, matricesCount: 2 },
    diagonal: { any: false, matrices: [] },
  };

  it('guarda y recupera una estadística por id', async () => {
    await repo.save('id-1', stats);
    const found = await repo.findById('id-1');
    expect(found).toBe(stats);
  });

  it('devuelve null si el id no existe', async () => {
    expect(await repo.findById('no-existe')).toBeNull();
  });

  it('no encuentra ids con coincidencia parcial', async () => {
    await repo.save('id-2', stats);
    expect(await repo.findById('id-')).toBeNull();
  });
});
