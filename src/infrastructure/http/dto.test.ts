import { describe, expect, it } from 'vitest';
import { toAuthResponse, toLoginRequest, toStatisticsRequest, toStatisticsResponse } from './dto';

describe('toLoginRequest', () => {
  it('devuelve strings vacíos ante un cuerpo ausente', () => {
    expect(toLoginRequest(undefined)).toEqual({ username: '', password: '' });
    expect(toLoginRequest(null)).toEqual({ username: '', password: '' });
  });

  it('devuelve las credenciales tal cual', () => {
    expect(toLoginRequest({ username: 'admin', password: 'secret' })).toEqual({
      username: 'admin',
      password: 'secret',
    });
  });

  it('ignora campos desconocidos', () => {
    expect(toLoginRequest({ username: 'admin', extra: 1 })).toEqual({ username: 'admin', password: '' });
  });
});

describe('toAuthResponse', () => {
  it('convierte el resultado de auth en el DTO de respuesta', () => {
    const result = { token: 'jwt.token.x', expiresIn: 7200 };
    expect(toAuthResponse(result)).toEqual({ token: 'jwt.token.x', expiresIn: 7200 });
  });
});

describe('toStatisticsRequest', () => {
  const Q = [[1, 0], [0, 1]];
  const R = [[2, 1], [0, 1]];

  it('incluye Q y R', () => {
    expect(toStatisticsRequest({ Q, R })).toEqual({ Q, R });
  });

  it('incluye rotated y original cuando vienen', () => {
    const rotated = [[1, 2], [3, 4]];
    const original = [[1, 2], [3, 4]];
    const result = toStatisticsRequest({ Q, R, rotated, original });
    expect(result.rotated).toEqual(rotated);
    expect(result.original).toEqual(original);
  });

  it('deja undefined los opcionales si faltan', () => {
    const result = toStatisticsRequest({ Q, R });
    expect(result.rotated).toBeUndefined();
    expect(result.original).toBeUndefined();
  });

  it('soporta cuerpo ausente', () => {
    const result = toStatisticsRequest(undefined);
    expect(result.Q).toBeUndefined();
  });
});

describe('toStatisticsResponse', () => {
  it('convierte el resultado en el DTO de respuesta', () => {
    const stats = { foo: 'bar' } as never;
    const result = { id: 'abc', statistics: stats };
    expect(toStatisticsResponse(result)).toEqual({ id: 'abc', statistics: stats });
  });
});
