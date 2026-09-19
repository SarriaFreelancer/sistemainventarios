import { NextRequest, NextResponse } from 'next/server';
import { validateApiKeyRequest } from '@/lib/api-key-auth';
import { getDatabaseClient } from '@/lib/db-manager';

// GET: Consultar Órdenes de Compra de la Empresa
export async function GET(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, 'purchases', 'read');
  if (errorResponse) return errorResponse;

  try {
    const db = await getDatabaseClient(context!.companyId);
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit') || 50);

    const purchaseOrders = await db.purchaseOrder.findMany({
      where: { companyId: context!.companyId },
      take: limit,
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            nit: true
          }
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Registrar Nueva Orden de Compra
export async function POST(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, 'purchases', 'create');
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { supplierId, expectedDelivery, notes, terms, lines } = body;

    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: 'El campo supplierId (ID del proveedor) es obligatorio' },
        { status: 400 }
      );
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debes incluir al menos un item en la orden (lines: [{ productId?, description?, itemType?, quantity, unitPrice, taxRate? }])'
        },
        { status: 400 }
      );
    }

    const db = await getDatabaseClient(context!.companyId);

    // Validar que el proveedor exista y pertenezca a la empresa
    const supplier = await db.supplier.findFirst({
      where: { id: Number(supplierId), companyId: context!.companyId }
    });

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: `El proveedor con ID ${supplierId} no existe o no pertenece a tu empresa` },
        { status: 400 }
      );
    }

    let subtotal = 0;
    let taxAmount = 0;
    const linesData = [];

    for (const line of lines) {
      const qty = Math.max(1, Number(line.quantity || 1));
      const price = Number(line.unitPrice || 0);
      const taxRate = Number(line.taxRate || 0);
      const lineTotal = qty * price;
      const lineTax = (lineTotal * taxRate) / 100;

      subtotal += lineTotal;
      taxAmount += lineTax;

      // Si viene productId, validar pertenencia
      let prodId: number | null = null;
      if (line.productId) {
        const prod = await db.product.findFirst({
          where: { id: Number(line.productId), companyId: context!.companyId }
        });
        if (prod) {
          prodId = prod.id;
        }
      }

      linesData.push({
        productId: prodId,
        description: line.description || null,
        itemType: line.itemType || 'PRODUCTO_VENTA',
        quantity: qty,
        unitPrice: price,
        total: lineTotal,
        companyId: context!.companyId
      });
    }

    const total = subtotal + taxAmount;
    const orderNumber = `OC-${Date.now().toString().slice(-6)}`;

    const newPurchaseOrder = await db.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: supplier.id,
        status: 'DRAFT',
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        subtotal,
        taxAmount,
        total,
        notes: notes || null,
        terms: terms || null,
        companyId: context!.companyId,
        lines: {
          create: linesData
        }
      },
      include: {
        supplier: true,
        lines: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: newPurchaseOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
