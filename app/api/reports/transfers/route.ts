import ExcelJS from 'exceljs';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  IN_TRANSIT: 'En Tránsito',
  RECEIVED: 'Recibido',
  CANCELLED: 'Cancelado',
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

    const dateFilter = startDate || endDate ? {
      createdAt: {
        ...(startDate ? { gte: new Date(startDate + 'T00:00:00') } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
      }
    } : {};

    const whereClause = {
      ...companyFilter,
      ...dateFilter,
      ...(status ? { status } : {}),
    };

    const transfers = await prisma.warehouseTransfer.findMany({
      where: whereClause,
      include: {
        originWarehouse: true,
        destinationWarehouse: true,
        createdBy: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = transfers.map((t) => {
      const products = t.items
        .map((item) => `${item.product?.name ?? 'Producto #' + item.productId} (x${item.quantity})`)
        .join(', ');

      const totalQuantity = t.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        '# Traslado': t.transferNumber,
        'Fecha Creación': new Date(t.createdAt).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        'Bodega Origen': t.originWarehouse?.name ?? '—',
        'Bodega Destino': t.destinationWarehouse?.name ?? '—',
        'Productos Transferidos': products || 'Sin productos',
        'Total Unidades': totalQuantity,
        'Estado': TRANSFER_STATUS_LABELS[t.status] ?? t.status,
        'Solicitado Por': t.createdBy?.name ?? t.createdBy?.email ?? '—',
        'Notas / Motivo': t.notes ?? '—',
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
      return Response.json({ rows: finalRows, title: 'Reporte de Traslados de Bodegas' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Traslados');

    if (finalRows.length > 0) {
      const headers = Object.keys(finalRows[0]);
      worksheet.addRow(headers);

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF6366F1' }, // Indigo-500
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
        'Content-Disposition': 'attachment; filename="traslados_bodegas.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_TRANSFERS]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte de traslados' }), { status: 500 });
  }
}
