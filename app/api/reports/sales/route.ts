import * as XLSX from 'xlsx';
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
    };

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
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
        .map((d) => `${d.product?.name ?? '?'} (x${d.quantity})`)
        .join(', ');

      const totalQuantity = sale.details.reduce((sum, d) => sum + d.quantity, 0);

      return {
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
        'Total': Number(sale.total),
        'Método de Pago': sale.paymentMethod,
        'Estado': STATUS_LABELS[sale.status] ?? sale.status,
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { wch: 14 },  // # Venta
      { wch: 14 },  // Fecha
      { wch: 24 },  // Cliente
      { wch: 55 },  // Productos
      { wch: 16 },  // Cantidad Total
      { wch: 12 },  // Descuento
      { wch: 14 },  // Total
      { wch: 18 },  // Método de Pago
      { wch: 14 },  // Estado
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="historial_ventas.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_SALES]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
