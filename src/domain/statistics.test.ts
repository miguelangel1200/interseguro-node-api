import { describe, expect, it } from 'vitest';
import {
  computeStatistics,
  determinant,
  frobeniusNorm,
  isDiagonalMatrix,
  Matrix,
  maxValue,
  minValue,
} from './statistics';

describe('maxValue', () => {
  it('devuelve el valor máximo de una matriz', () => {
    expect(maxValue([[1, 5], [3, 2]])).toBe(5);
  });

  it('devuelve null para una matriz vacía', () => {
    expect(maxValue([])).toBeNull();
  });
});

describe('minValue', () => {
  it('devuelve el valor mínimo de una matriz', () => {
    expect(minValue([[1, 5], [3, -2]])).toBe(-2);
  });

  it('devuelve null para una matriz vacía', () => {
    expect(minValue([])).toBeNull();
  });
});

describe('isDiagonalMatrix', () => {
  it('devuelve true para una matriz diagonal', () => {
    expect(isDiagonalMatrix([[2, 0], [0, 3]])).toBe(true);
  });

  it('devuelve false si hay elementos fuera de la diagonal', () => {
    expect(isDiagonalMatrix([[1, 2], [3, 4]])).toBe(false);
  });

  it('devuelve false para una matriz no cuadrada', () => {
    expect(isDiagonalMatrix([[1, 0, 0], [0, 2, 0]])).toBe(false);
  });
});

describe('determinant', () => {
  it('calcula el determinante de una matriz 2x2', () => {
    expect(determinant([[1, 2], [3, 4]])).toBeCloseTo(-2, 6);
  });

  it('devuelve 0 para una matriz singular', () => {
    expect(determinant([[1, 2], [2, 4]])).toBeCloseTo(0, 6);
  });

  it('calcula el determinante de una matriz 3x3', () => {
    const m: Matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 10]];
    expect(determinant(m)).toBeCloseTo(-3, 6);
  });
});

describe('frobeniusNorm', () => {
  it('calcula la norma de Frobenius de una matriz', () => {
    // √(1+4+9+16) = √30
    expect(frobeniusNorm([[1, 2], [3, 4]])).toBeCloseTo(Math.sqrt(30), 6);
  });
});

describe('computeStatistics', () => {
  // Factorización QR verificada de A = [[1,2],[3,4]].
  const Q: Matrix = [
    [0.316227766, 0.948683298],
    [0.948683298, -0.316227766],
  ];
  const R: Matrix = [
    [3.16227766, 4.427188724],
    [0, 0.632455532],
  ];
  const original: Matrix = [[1, 2], [3, 4]];

  it('calcula el error de ortogonalidad de Q (~0)', () => {
    const stats = computeStatistics({ Q, R });
    expect(stats.orthogonalityError).toBeCloseTo(0, 6);
  });

  it('calcula el determinante de R (|det A| = 2)', () => {
    const stats = computeStatistics({ Q, R });
    expect(stats.qr.determinantOfR).toBeCloseTo(2, 6);
  });

  it('la norma de Frobenius de R coincide con la de A', () => {
    const stats = computeStatistics({ Q, R, original });
    expect(stats.qr.rFrobeniusNorm).toBeCloseTo(stats.original!.frobeniusNorm, 6);
  });

  it('calcula la suma y media de la matriz original', () => {
    const stats = computeStatistics({ Q, R, original });
    expect(stats.original!.sum).toBe(10);
    expect(stats.original!.mean).toBe(2.5);
  });

  it('calcula máximo, mínimo y diagonalidad por matriz', () => {
    const stats = computeStatistics({ Q, R, original });
    expect(stats.original!.max).toBe(4);
    expect(stats.original!.min).toBe(1);
    expect(stats.original!.isDiagonal).toBe(false);
    expect(stats.qr.isDiagonal).toBe(false);
  });

  it('calcula máximo, mínimo, promedio y suma global', () => {
    const rotated: Matrix = [[3, 1], [4, 2]];
    const stats = computeStatistics({ Q, R, original, rotated });
    expect(stats.global.matricesCount).toBe(4);
    expect(stats.global.max).toBeCloseTo(4.427189, 6);
    expect(stats.global.min).toBeCloseTo(-0.316228, 6);
    expect(stats.global.mean).toBeCloseTo(1.882456, 6);
    expect(stats.global.sum).toBeCloseTo(30.119289, 6);
    expect(stats.diagonal.any).toBe(false);
  });

  it('marca rotated y original como null si no se envían', () => {
    const stats = computeStatistics({ Q, R });
    expect(stats.rotated).toBeNull();
    expect(stats.original).toBeNull();
    expect(stats.global.matricesCount).toBe(2);
    expect(stats.diagonal.any).toBe(false);
  });

  it('maneja matrices sin elementos (estadísticas globales nulas)', () => {
    const stats = computeStatistics({ Q: [[]], R: [[]] });
    expect(stats.global.matricesCount).toBe(2);
    expect(stats.global.max).toBeNull();
    expect(stats.global.min).toBeNull();
    expect(stats.global.mean).toBeNull();
    expect(stats.global.sum).toBe(0);
    expect(stats.qr.isSquare).toBe(false);
    expect(stats.qr.determinantOfR).toBeNull();
  });

  it('detecta matrices diagonales en el resumen diagonal', () => {
    const diag = computeStatistics({ Q: [[1, 0], [0, 1]], R: [[2, 0], [0, 3]] });
    expect(diag.diagonal.any).toBe(true);
    expect(diag.diagonal.matrices).toContain('Q');
    expect(diag.diagonal.matrices).toContain('R');
  });
});
