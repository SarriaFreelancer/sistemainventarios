import ExcelJS from 'exceljs';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

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
    const supplierId = searchParams.get('supplierId');
    const productGroupId = searchParams.get('productGroupId');
    const productType = searchParams.get('productType');

    const whereClause = {
      ...companyFilter,
      ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      ...(supplierId ? { supplierId: Number(supplierId) } : {}),
      ...(productGroupId ? { productGroupId: Number(productGroupId) } : {}),
      ...(productType ? { type: productType as any } : {}),
    };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });

    const rows = products.map((p) => {
      const cost = Number(p.unitCost);
      const price = Number(p.salePrice);
      const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(2) : '0.00';

      return {
        'Código': p.code,
        'Nombre': p.name,
        'Tipo': p.type === 'SALE' ? 'Venta' : p.type === 'RAW_MATERIAL' ? 'Materia Prima' : p.type === 'FINISHED_GOOD' ? 'Producto Term.' : p.type === 'SUPPLY' ? 'Insumo' : p.type === 'SERVICE' ? 'Servicio' : 'Activo Fijo',
        'Categoría': p.category?.name ?? '—',
        'Proveedor': p.supplier?.companyName ?? '—',
        'Stock Disponible': p.quantityAvailable,
        'Costo Unitario': cost,
        'Precio Venta': price,
        'Margen (%)': Number(margin),
        'Vendidos': p.soldQuantity,
        'Estado': p.status === 'AVAILABLE' ? 'Disponible' : 'Sin Stock',
      };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

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
        'Content-Disposition': 'attachment; filename="catalogo_productos.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_PRODUCTS]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
