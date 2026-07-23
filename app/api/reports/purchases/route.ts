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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const dateFilter = startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate + 'T00:00:00') } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
      }
    } : {};

    const purchases = await prisma.purchaseOrder.findMany({
      where: {
        ...companyFilter,
        ...dateFilter
      },
      include: {
        supplier: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const rows = purchases.map(po => {
      const getStatus = (s: string) => {
        switch(s) {
          case 'DRAFT': return 'Borrador';
          case 'SENT': return 'Enviada';
          case 'PARTIAL': return 'Parcial';
          case 'RECEIVED': return 'Recibida (Cerrada)';
          case 'CANCELLED': return 'Cancelada';
          default: return s;
        }
      };

      return {
        'Número Orden': po.orderNumber,
        'Fecha Creación': new Date(po.createdAt).toLocaleDateString(),
        'Fecha Esperada': (po as any).expectedDate ? new Date((po as any).expectedDate).toLocaleDateString() : 'N/A',
        'Proveedor': po.supplier.companyName,
        'Subtotal': Number((po as any).subtotal),
        'Impuestos': Number((po as any).tax),
        'Total': Number((po as any).total),
        'Estado': getStatus((po as any).status),
        'Notas': (po as any).notes || 'N/A'
      };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Órdenes de Compra');

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
        col.width = 18;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="historial_compras.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_PURCHASES]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
