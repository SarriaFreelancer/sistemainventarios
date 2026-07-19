import * as XLSX from 'xlsx';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { companyId, role } = session.user as { companyId?: string; role?: string };
    const whereClause = role === 'SUPERADMIN' || !companyId ? {} : { companyId: Number(companyId) };

    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      include: {
        products: {
          select: { id: true },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    const rows = suppliers.map((s) => ({
      'Razón Social': s.companyName,
      'Contacto': s.contactName,
      'Teléfono': s.phone,
      'Email': s.email,
      'Dirección': s.address,
      'Ciudad': s.city,
      'País': s.country,
      '# Productos': s.products.length,
      'Estado': s.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { wch: 30 },  // Razón Social
      { wch: 24 },  // Contacto
      { wch: 16 },  // Teléfono
      { wch: 28 },  // Email
      { wch: 35 },  // Dirección
      { wch: 16 },  // Ciudad
      { wch: 14 },  // País
      { wch: 12 },  // # Productos
      { wch: 12 },  // Estado
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="proveedores.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_SUPPLIERS]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
