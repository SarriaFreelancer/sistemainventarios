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

    const payrolls = await prisma.payroll.findMany({
      where: {
        ...companyFilter,
        ...dateFilter
      },
      include: {
        details: {
          include: { employee: { include: { position: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const rows: any[] = [];

    payrolls.forEach(payroll => {
      const getStatus = (s: string) => {
        switch(s) {
          case 'DRAFT': return 'Borrador';
          case 'APPROVED': return 'Aprobada';
          case 'PAID': return 'Pagada';
          default: return s;
        }
      };

      payroll.details.forEach(detail => {
        rows.push({
          'Código Nómina': payroll.code,
          'Período Inicio': new Date(payroll.periodStart).toLocaleDateString(),
          'Período Fin': new Date(payroll.periodEnd).toLocaleDateString(),
          'Fecha Pago': payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'Pendiente',
          'Estado': getStatus(payroll.status),
          'Empleado': `${detail.employee.firstName} ${detail.employee.lastName}`,
          'Documento': detail.employee.documentId,
          'Cargo': detail.employee.position?.name || 'N/A',
          'Salario Base': Number(detail.baseSalary),
          'Adiciones': Number(detail.additions),
          'Deducciones': Number(detail.deductions),
          'Neto Pagado': Number(detail.netPay),
        });
      });
    });

    const fieldsParam = searchParams.get('fields');
    let finalRows = rows;
    if (fieldsParam) {
      const selectedFields = fieldsParam.split(',').map(f => f.trim()).filter(Boolean);
      if (selectedFields.length > 0) {
        finalRows = rows.map(r => {
          const filteredRow: any = {};
          selectedFields.forEach(fieldKey => {
            if (fieldKey in r) {
              filteredRow[fieldKey] = (r as any)[fieldKey];
            }
          });
          return filteredRow;
        });
      }
    }

    if (searchParams.get('format') === 'json') {
      return Response.json({ rows: finalRows, title: 'Reporte de Nómina' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Nómina Detallada');

    if (finalRows.length > 0) {
      const headers = Object.keys(finalRows[0]);
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

      finalRows.forEach(r => worksheet.addRow(Object.values(r)));

      worksheet.columns.forEach(col => {
        col.width = 18;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="reporte_nomina.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_PAYROLL]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
