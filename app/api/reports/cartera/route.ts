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
    const status = searchParams.get('status');

    const dateFilter = startDate || endDate ? {
      startDate: {
        ...(startDate ? { gte: new Date(startDate + 'T00:00:00') } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
      }
    } : {};

    let statusCondition = {};
    const now = new Date();
    if (status === 'OVERDUE') {
      statusCondition = {
        balance: { gt: 0 },
        dueDate: { lt: now },
        status: { notIn: ['PAID', 'CANCELLED'] }
      };
    } else if (status) {
      statusCondition = { status };
    }

    const whereClause = {
      ...companyFilter,
      ...dateFilter,
      ...statusCondition,
    };

    const operations = await prisma.creditOperation.findMany({
      where: whereClause,
      include: {
        customer: true,
        user: true,
        branch: true,
        installments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = operations.map((op) => {
      const isOverdue = op.status !== 'PAID' && op.status !== 'CANCELLED' && op.balance > 0 && op.dueDate && new Date(op.dueDate) < now;
      const daysOverdue = isOverdue && op.dueDate
        ? Math.max(0, Math.floor((now.getTime() - new Date(op.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      let estadoCartera = 'Vigente';
      if (op.status === 'PAID') estadoCartera = 'Pagado';
      else if (op.status === 'CANCELLED') estadoCartera = 'Cancelado';
      else if (isOverdue) estadoCartera = 'En Mora';

      const deliveryLabels: Record<string, string> = {
        PENDING: 'Pendiente',
        PARTIAL: 'Parcial',
        DELIVERED: 'Entregado',
        CANCELLED: 'Cancelado',
      };

      return {
        '# Operación': op.code,
        'Fecha Apertura': new Date(op.startDate).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
        'Fecha Vencimiento': op.dueDate
          ? new Date(op.dueDate).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : '—',
        'Cliente': op.customer?.name ?? '—',
        'Documento': op.customer?.documentNumber ?? op.customer?.code ?? '—',
        'Teléfono': op.customer?.phone ?? '—',
        'Sede': op.branch?.name ?? 'Sede Principal',
        'Modalidad Entrega': op.deliveryMode === 'IMMEDIATE' ? 'Entrega Inmediata' : 'Contra Pago Total',
        'Monto Total': Number(op.totalAmount),
        'Cuota Inicial': Number(op.downPayment),
        'Total Pagado': Number(op.paidAmount),
        'Saldo Pendiente': Number(op.balance),
        'Estado Cartera': estadoCartera,
        'Días de Mora': daysOverdue,
        'Cuotas Totales': op.installments.length,
        'Cuotas Pagadas': op.installments.filter((i) => i.status === 'PAID').length,
        'Estado Entrega': deliveryLabels[op.deliveryStatus] ?? op.deliveryStatus,
        'Asesor / Vendedor': op.user?.name ?? op.user?.email ?? '—',
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
      return Response.json({ rows: finalRows, title: 'Reporte de Cartera y Crédito' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cartera');

    if (finalRows.length > 0) {
      const headers = Object.keys(finalRows[0]);
      worksheet.addRow(headers);

      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E293B' },
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
        'Content-Disposition': 'attachment; filename="reporte_cartera.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_CARTERA]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte de cartera' }), { status: 500 });
  }
}
