/**
 * Puerto de salida (contrato) del repositorio de usuarios.
 * Aísla el origen de los usuarios válidos (env, base de datos, LDAP, etc.)
 * de la lógica de autenticación.
 */
import { Credentials } from '../../domain/auth';

export interface UserRepository {
  /**
   * Valida las credenciales y devuelve el usuario si son correctas, o null.
   */
  findByCredentials(credentials: Credentials): Promise<import('../../domain/auth').User | null>;
}
