import ExcelJS from 'exceljs';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  REVIEWED: 'Revisado',
  PAID: 'Pagado',
  COMPLETED: 'Completado',
  VOIDED: 'Anulado',
  RETURNED: 'Devuelto',
};

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
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const dateFilter = startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate + 'T00:00:00') } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
      }
    } : {};

    const whereClause = {
      ...companyFilter,
      ...dateFilter,
      ...(status ? { status: status as any } : {}),
      ...(branchId ? { branchId: Number(branchId) } : {}),
    };

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        branch: true,
        user: true,
        details: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = sales.map((sale) => {
      const products = sale.details
        .map((d) => {
          const priceStr = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(d.unitPrice));
          return `${d.product?.name ?? '?'} (x${d.quantity} a ${priceStr})`;
        })
        .join(', ');

      const totalQuantity = sale.details.reduce((sum, d) => sum + d.quantity, 0);

      const totalCost = sale.details.reduce((sum, d) => {
        const cost = Number(d.product?.unitCost || 0);
        return sum + (cost * d.quantity);
      }, 0);

      const totalSales = Number(sale.total);
      const profit = totalSales - totalCost;
      const marginPct = totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) + '%' : '0.00%';

      return {
        'Sede': sale.branch?.name ?? 'Sede Principal',
        'Código Sede': sale.branch?.code ?? '—',
        'Ciudad Sede': sale.branch?.city ?? '—',
        '# Venta': sale.saleNumber,
        'Fecha': new Date(sale.createdAt).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        'Cliente': sale.client ?? 'Consumidor Final',
        'Productos': products,
        'Cantidad Total': totalQuantity,
        'Descuento': Number(sale.discount),
        'Costo Total': totalCost,
        'Venta Total': totalSales,
        'Utilidad Bruta': profit,
        'Margen (%)': marginPct,
        'Método de Pago': sale.paymentMethod ?? '—',
        'Vendedor': sale.user?.name ?? sale.user?.email ?? '—',
        'Estado': STATUS_LABELS[sale.status] ?? sale.status ?? 'Completada',
      };
    });

    const fieldsParam = searchParams.get('fields');
    let finalRows = rows;
    if (fieldsParam) {
      const selectedFields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
      if (selectedFields.length > 0) {
        finalRows = rows.map((r) => {
          const filteredRow: any = {};
          selectedFields.forEach((fieldKey) => {
            if (fieldKey in r) {
              filteredRow[fieldKey] = (r as any)[fieldKey];
            }
          });
          return filteredRow;
        });
      }
    }

    if (searchParams.get('format') === 'json') {
      return Response.json({ rows: finalRows, title: 'Consolidado de Ventas Enterprise (Multi-Sedes)' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas Enterprise');

    if (finalRows.length > 0) {
      const headers = Object.keys(finalRows[0]);
      worksheet.addRow(headers);

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F766E' }, // Teal-700
        };
      });

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length },
      };

      finalRows.forEach((r) => worksheet.addRow(Object.values(r)));

      worksheet.columns.forEach((col) => {
        col.width = 20;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ventas_enterprise.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_ENTERPRISE]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte de ventas enterprise' }), { status: 500 });
  }
}
