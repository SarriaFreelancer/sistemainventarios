import ExcelJS from 'exceljs';
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
    const productType = searchParams.get('productType');

    const whereClause = {
      ...companyFilter,
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(productGroupId ? { productGroupId: Number(productGroupId) } : {}),
      ...(productType ? { type: productType as any } : {}),
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
      'Tipo': p.type === 'SALE' ? 'Venta' : p.type === 'RAW_MATERIAL' ? 'Materia Prima' : p.type === 'FINISHED_GOOD' ? 'Producto Term.' : p.type === 'SUPPLY' ? 'Insumo' : p.type === 'SERVICE' ? 'Servicio' : 'Activo Fijo',
      'Grupo': p.productGroup?.name ?? '—',
      'Categoría': p.category?.name ?? '—',
      'Stock Actual': p.quantityAvailable,
      'Stock Mínimo': MIN_STOCK,
      'Estado Stock': getStockStatus(p.quantityAvailable),
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock');

    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      worksheet.addRow(headers);
      
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF334155" }
        };
      });
      
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length }
      };

      rows.forEach(r => worksheet.addRow(Object.values(r)));

      worksheet.columns.forEach(col => {
        col.width = 20;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

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
