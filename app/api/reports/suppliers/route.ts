import ExcelJS from 'exceljs';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { companyId, role } = session.user as { companyId?: string; role?: string };
    const whereClause = role === 'SUPERADMIN' || !companyId ? {} : { companyId: Number(companyId) };

    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      include: {
        products: {
          select: { id: true },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    const rows = suppliers.map((s) => ({
      'Razón Social': s.companyName,
      'Contacto': s.contactName,
      'Teléfono': s.phone,
      'Email': s.email,
      'Dirección': s.address,
      'Ciudad': s.city,
      'País': s.country,
      '# Productos': s.products.length,
      'Estado': s.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
    }));

    const { searchParams } = new URL(request.url);
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
      return Response.json({ rows: finalRows, title: 'Directorio de Proveedores' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Proveedores');

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
        col.width = 20;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="proveedores.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_SUPPLIERS]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
