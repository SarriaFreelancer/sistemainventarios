import { NextResponse } from 'next/server';
import { getDatabaseClient } from '@/lib/db-manager';
import { getSessionCompanyId } from '@/lib/session';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    // Usar la función puente para obtener el cliente Prisma (Monolito o Tenant)
    const db = await getDatabaseClient(companyId);

    // Ejecutar una consulta básica de prueba
    const productsCount = await db.product.count({
      where: { companyId }
    });

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa al cliente de base de datos puente',
      companyId,
      productsCount,
      // Si db tiene $transaction, es un PrismaClient válido.
      hasTransactionSupport: typeof db.$transaction === 'function'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
