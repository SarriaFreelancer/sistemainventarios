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
      hireDate: {
        ...(startDate ? { gte: new Date(startDate + 'T00:00:00') } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
      }
    } : {};

    const whereClause = {
      ...companyFilter,
      ...dateFilter,
      ...(status ? { status: status as any } : {}),
    };

    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        position: true,
      },
      orderBy: { firstName: 'asc' }
    });

    const rows = employees.map(emp => {
      const getStatus = (s: string) => {
        switch(s) {
          case 'ACTIVE': return 'Activo';
          case 'INACTIVE': return 'Inactivo';
          case 'SUSPENDED': return 'Suspendido';
          case 'TERMINATED': return 'Liquidado';
          default: return s;
        }
      };

      return {
        'Nombres': emp.firstName,
        'Apellidos': emp.lastName,
        'Documento': emp.documentId,
        'Correo Electrónico': emp.email,
        'Teléfono': emp.phone || 'N/A',
        'Cargo': emp.position?.name || 'Sin cargo',
        'Salario Base': Number(emp.position?.baseSalary || 0),
        'Fecha de Contratación': emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : 'N/A',
        'Estado': getStatus(emp.status),
      };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Directorio Empleados');

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
        'Content-Disposition': 'attachment; filename="directorio_empleados.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_EMPLOYEES]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
