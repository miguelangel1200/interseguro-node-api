/**
 * Puerto de salida (contrato) del repositorio de estadísticas.
 *
 * Define la persistencia/lectura de los cálculos. El caso de uso depende de
 * esta interfaz y no de una tecnología concreta (memoria, base de datos,
 * etc.), permitiendo cambiar la implementación sin afectar la lógica.
 */
export interface StatisticsRepository {
  save(id: string, statistics: import('../../domain/statistics').Statistics): Promise<void>;
  findById(id: string): Promise<import('../../domain/statistics').Statistics | null>;
}
