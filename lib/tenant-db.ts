import { getSessionCompanyId } from './session';

/**
 * Agrega automáticamente el filtro de companyId a la cláusula where
 * si el usuario no es SUPERADMIN.
 */
export async function withTenantWhere<T extends Record<string, any>>(
  whereClause: T = {} as T
): Promise<T & { companyId?: number }> {
  const companyId = await getSessionCompanyId();
  if (companyId === null) {
    throw new Error('No autorizado: Sesión inválida o expirada.');
  }
  // Si no es superadmin (tiene companyId), aplicamos el filtro de tenant
  if (companyId !== undefined) {
    return {
      ...whereClause,
      companyId,
    };
  }
  return whereClause;
}

/**
 * Agrega automáticamente el companyId de la sesión a los datos de creación
 * si el usuario no es SUPERADMIN y no se especificó un companyId previamente.
 */
export async function withTenantData<T extends Record<string, any>>(
  dataClause: T
): Promise<T & { companyId?: number }> {
  const companyId = await getSessionCompanyId();
  if (companyId === null) {
    throw new Error('No autorizado: Sesión inválida o expirada.');
  }
  // Si el usuario pertenece a una empresa y no se definió explícitamente en dataClause
  if (companyId !== undefined && dataClause.companyId === undefined) {
    return {
      ...dataClause,
      companyId,
    };
  }
  return dataClause;
}
