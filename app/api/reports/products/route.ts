import ExcelJS from 'exceljs';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

import { getSessionCompanyId } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const companyId = await getSessionCompanyId();
    const companyFilter = companyId ? { companyId } : {};

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const supplierId = searchParams.get('supplierId');
    const productGroupId = searchParams.get('productGroupId');
    const productType = searchParams.get('productType');
    const includeBatches = searchParams.get('includeBatches') === 'true' || searchParams.get('withBatches') === 'true';

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
        productGroup: true,
        ...(includeBatches ? { batches: { orderBy: { expirationDate: 'asc' as const } } } : {}),
      },
      orderBy: { name: 'asc' },
    });

    const rows: Record<string, any>[] = [];

    products.forEach((p: any) => {
      const cost = Number(p.unitCost);
      const price = Number(p.salePrice);
      const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(2) : '0.00';

      const baseInfo = {
        'Código': p.code,
        'Nombre': p.name,
        'Tipo': p.type === 'SALE' ? 'Venta' : p.type === 'RAW_MATERIAL' ? 'Materia Prima' : p.type === 'FINISHED_GOOD' ? 'Producto Term.' : p.type === 'SUPPLY' ? 'Insumo' : p.type === 'SERVICE' ? 'Servicio' : 'Activo Fijo',
        'Cód. Grupo': p.productGroup?.code ?? '—',
        'Grupo': p.productGroup?.name ?? '—',
        'Cód. Categoría': p.category?.code ?? '—',
        'Categoría': p.category?.name ?? '—',
        'Cód. Proveedor': p.supplier?.code ?? '—',
        'Proveedor': p.supplier?.companyName ?? '—',
        'Stock Total Disponible': p.quantityAvailable,
        'Costo Unitario': cost,
        'Precio Venta': price,
        'Margen (%)': Number(margin),
        'Vendidos': p.soldQuantity,
        'Estado Producto': p.status === 'AVAILABLE' ? 'Disponible' : 'Sin Stock',
      };

      if (includeBatches) {
        const batches = p.batches || [];
        if (batches.length > 0) {
          batches.forEach((b: any) => {
            const expStr = b.expirationDate ? new Date(b.expirationDate).toISOString().split('T')[0] : '—';
            const batchStatus = b.status === 'EXPIRED' ? 'Vencido' : b.status === 'DEPLETED' ? 'Agotado' : 'Activo';
            rows.push({
              ...baseInfo,
              'Nº Lote': b.batchNumber,
              'Fecha Vencimiento': expStr,
              'Cant. Lote': b.quantity,
              'Estado Lote': batchStatus,
              'Notas Lote': b.notes ?? '—',
            });
          });
        } else {
          rows.push({
            ...baseInfo,
            'Nº Lote': '—',
            'Fecha Vencimiento': '—',
            'Cant. Lote': '—',
            'Estado Lote': '—',
            'Notas Lote': '—',
          });
        }
      } else {
        rows.push(baseInfo);
      }
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
      return Response.json({ rows: finalRows, title: 'Catálogo de Productos' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

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
        'Content-Disposition': 'attachment; filename="catalogo_productos.xlsx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[REPORT_PRODUCTS]', error);
    return new Response(JSON.stringify({ error: 'Error al generar el reporte' }), { status: 500 });
  }
}
