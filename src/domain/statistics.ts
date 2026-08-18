/**
 * Capa de dominio de la API Node.js (TypeScript).
 * Contiene las entidades y operaciones puras de cálculo de estadísticas,
 * sin depender de Express ni de ningún framework externo.
 */

/** Matriz de números de punto flotante: Matriz[fila][columna]. */
export type Matrix = number[][];

/** Datos de entrada para el cálculo de estadísticas. */
export interface StatisticsPayload {
  Q: Matrix;
  R: Matrix;
  rotated?: Matrix;
  original?: Matrix;
}

/** Estadísticas sobre una matriz individual. */
export interface MatrixStatistics {
  rows: number;
  cols: number;
  sum: number;
  mean: number | null;
  max: number | null;
  min: number | null;
  isDiagonal: boolean;
  frobeniusNorm: number;
}

/** Estadísticas sobre la factorización QR. */
export interface QRStatistics {
  qRows: number;
  qCols: number;
  rRows: number;
  rCols: number;
  rFrobeniusNorm: number;
  determinantOfR: number | null;
  isSquare: boolean;
  isDiagonal: boolean;
}

/** Estadísticas globales sobre todas las matrices recibidas. */
export interface GlobalStatistics {
  max: number | null;
  min: number | null;
  mean: number | null;
  sum: number;
  matricesCount: number;
}

/** Estadísticas completas calculadas por el dominio. */
export interface Statistics {
  rotated: MatrixStatistics | null;
  original: MatrixStatistics | null;
  q: MatrixStatistics;
  r: MatrixStatistics;
  qr: QRStatistics;
  orthogonalityError: number;
  global: GlobalStatistics;
  diagonal: {
    any: boolean;
    matrices: string[];
  };
}

/**
 * Suma todos los elementos de una matriz.
 */
function sumMatrix(matrix: Matrix): number {
  let sum = 0;
  for (const row of matrix) {
    for (const value of row) {
      sum += value;
    }
  }
  return sum;
}

/**
 * Calcula la media aritmética de todos los elementos de una matriz.
 * @returns Media o null si la matriz está vacía.
 */
function mean(matrix: Matrix): number | null {
  const count = matrix.reduce((acc, row) => acc + row.length, 0);
  if (count === 0) return null;
  return sumMatrix(matrix) / count;
}

/**
 * Calcula el determinante de una matriz cuadrada mediante eliminación gaussiana.
 */
export function determinant(matrix: Matrix): number {
  const n = matrix.length;
  const M = matrix.map((row) => [...row]);
  let det = 1;

  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(M[j][i]) > Math.abs(M[pivot][i])) {
        pivot = j;
      }
    }

    if (Math.abs(M[pivot][i]) < 1e-12) {
      return 0;
    }

    if (pivot !== i) {
      [M[i], M[pivot]] = [M[pivot], M[i]];
      det = -det;
    }

    det *= M[i][i];

    for (let j = i + 1; j < n; j++) {
      const factor = M[j][i] / M[i][i];
      for (let k = i; k < n; k++) {
        M[j][k] -= factor * M[i][k];
      }
    }
  }

  return det;
}

/**
 * Calcula la norma de Frobenius de una matriz (raíz de la suma de cuadrados).
 */
export function frobeniusNorm(matrix: Matrix): number {
  let sumSquares = 0;
  for (const row of matrix) {
    for (const value of row) {
      sumSquares += value * value;
    }
  }
  return Math.sqrt(sumSquares);
}

/**
 * Devuelve el valor máximo de una matriz, o null si está vacía.
 */
export function maxValue(matrix: Matrix): number | null {
  let max: number | null = null;
  for (const row of matrix) {
    for (const value of row) {
      if (max === null || value > max) max = value;
    }
  }
  return max;
}

/**
 * Devuelve el valor mínimo de una matriz, o null si está vacía.
 */
export function minValue(matrix: Matrix): number | null {
  let min: number | null = null;
  for (const row of matrix) {
    for (const value of row) {
      if (min === null || value < min) min = value;
    }
  }
  return min;
}

/**
 * Verifica si una matriz es diagonal: debe ser cuadrada y todos sus elementos
 * fuera de la diagonal principal deben ser (aproximadamente) cero.
 */
export function isDiagonalMatrix(matrix: Matrix): boolean {
  const rows = matrix.length;
  if (rows === 0) return false;
  const cols = matrix[0].length;
  if (rows !== cols) return false;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (i !== j && Math.abs(matrix[i][j]) > 1e-9) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Calcula el error de ortogonalidad de Q: la desviación máxima de Qᵀ·Q
 * respecto a la matriz identidad.
 */
function orthogonalityError(Q: Matrix): number {
  const cols = Q[0].length;
  let maxError = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      let dot = 0;
      for (let k = 0; k < Q.length; k++) {
        dot += Q[k][i] * Q[k][j];
      }
      const expected = i === j ? 1 : 0;
      maxError = Math.max(maxError, Math.abs(dot - expected));
    }
  }
  return maxError;
}

/**
 * Redondea un valor a seis decimales para evitar imprecisiones de punto flotante.
 */
function round(value: number): number {
  return Number(value.toFixed(6));
}

/** Estadísticas sobre una matriz (helper interno). */
function matrixStatistics(matrix: Matrix): MatrixStatistics {
  return {
    rows: matrix.length,
    cols: matrix[0] ? matrix[0].length : 0,
    sum: round(sumMatrix(matrix)),
    mean: mean(matrix) === null ? null : round(mean(matrix) as number),
    max: maxValue(matrix) === null ? null : round(maxValue(matrix) as number),
    min: minValue(matrix) === null ? null : round(minValue(matrix) as number),
    isDiagonal: isDiagonalMatrix(matrix),
    frobeniusNorm: round(frobeniusNorm(matrix)),
  };
}

/** Estadísticas globales sobre un conjunto de matrices (helper interno). */
function globalStatistics(matrices: Matrix[]): GlobalStatistics {
  const allValues: number[] = [];
  for (const matrix of matrices) {
    for (const row of matrix) {
      for (const value of row) {
        allValues.push(value);
      }
    }
  }

  if (allValues.length === 0) {
    return { max: null, min: null, mean: null, sum: 0, matricesCount: matrices.length };
  }

  const sum = allValues.reduce((acc, v) => acc + v, 0);
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  return {
    max: round(max),
    min: round(min),
    mean: round(sum / allValues.length),
    sum: round(sum),
    matricesCount: matrices.length,
  };
}

/**
 * Calcula las estadísticas a partir de los datos de entrada (operación de dominio).
 */
export function computeStatistics(payload: StatisticsPayload): Statistics {
  const { Q, R, rotated, original } = payload;
  const isSquare = R.length === R[0].length;
  const namedMatrices: Array<[string, Matrix]> = [
    ['Q', Q],
    ['R', R],
  ];
  if (original) namedMatrices.push(['original', original]);
  if (rotated) namedMatrices.push(['rotated', rotated]);
  const matrices = namedMatrices.map(([, matrix]) => matrix);
  const diagonalMatrices = namedMatrices
    .filter(([, matrix]) => isDiagonalMatrix(matrix))
    .map(([name]) => name);

  return {
    rotated: rotated ? matrixStatistics(rotated) : null,
    original: original ? matrixStatistics(original) : null,
    q: matrixStatistics(Q),
    r: matrixStatistics(R),
    qr: {
      qRows: Q.length,
      qCols: Q[0] ? Q[0].length : 0,
      rRows: R.length,
      rCols: R[0] ? R[0].length : 0,
      rFrobeniusNorm: round(frobeniusNorm(R)),
      determinantOfR: isSquare ? round(determinant(R)) : null,
      isSquare,
      isDiagonal: isDiagonalMatrix(R),
    },
    orthogonalityError: round(orthogonalityError(Q)),
    global: globalStatistics(matrices),
    diagonal: {
      any: diagonalMatrices.length > 0,
      matrices: diagonalMatrices,
    },
  };
}
