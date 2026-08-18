/**
 * Puerto de entrada (contrato) del caso de uso de estadísticas.
 *
 * En arquitectura hexagonal, el adaptador HTTP depende de esta interfaz y no
 * de la implementación concreta, lo que permite cambiar el servicio sin tocar
 * el controller.
 */
export interface StatisticsResult {
  id: string;
  statistics: import('../../domain/statistics').Statistics;
}

export interface StatisticsService {
  getStatistics(payload: import('../../domain/statistics').StatisticsPayload): Promise<StatisticsResult>;
}
