import * as XLSX from 'xlsx';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

const MIN_STOCK = 10;

function getStockStatus(qty: number): string {
  if (qty === 0) return 'AGOTADO';
  if (qty < MIN_STOCK) return 'BAJO';
  return 'OK';
}

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { companyId, role } = session.user as { companyId?: string; role?: string };
    const companyFilter = role === 'SUPERADMIN' || !companyId ? {} : { companyId: Number(companyId) };

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const productGroupId = searchParams.get('productGroupId');

    const whereClause = {
      ...companyFilter,
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(productGroupId ? { productGroupId: Number(productGroupId) } : {}),
    };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        productGroup: true,
      },
      orderBy: [
        { quantityAvailable: 'asc' },
        { name: 'asc' },
      ],
    });

    const rows = products.map((p) => ({
      'Código': p.code,
      'Nombre': p.name,
      'Grupo': p.productGroup?.name ?? '—',
      'Categoría': p.category?.name ?? '—',
      'Stock Actual': p.quantityAvailable,
      'Stock Mínimo': MIN_STOCK,
      'Estado Stock': getStockStatus(p.quantityAvailable),
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { wch: 14 },  // Código
      { wch: 35 },  // Nombre
      { wch: 20 },  // Grupo
      { wch: 20 },  // Categoría
      { wch: 14 },  // Stock Actual
      { wch: 14 },  // Stock Mínimo
      { wch: 14 },  // Estado Stock
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="reporte_stock.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_STOCK]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
