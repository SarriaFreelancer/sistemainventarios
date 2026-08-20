import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyRequest } from "@/lib/api-key-auth";
import { getDatabaseClient } from "@/lib/db-manager";

// GET: Consultar Ventas de la Empresa
export async function GET(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "products", "read");
  if (errorResponse) return errorResponse;

  try {
    const db = await getDatabaseClient(context!.companyId);
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit") || 50);

    const sales = await db.sale.findMany({
      where: { companyId: context!.companyId },
      take: limit,
      include: {
        saleDetails: {
          include: {
            product: { select: { id: true, code: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, count: sales.length, data: sales });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Registrar Nueva Venta
export async function POST(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "products", "create");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { client, paymentMethod, remarks, discount, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Debes incluir al menos un item en la venta (items: [{ productId, quantity, unitPrice }])" },
        { status: 400 }
      );
    }

    const db = await getDatabaseClient(context!.companyId);

    // Validar productos y calcular total
    let computedTotal = 0;
    const saleDetailsData = [];

    for (const item of items) {
      const product = await db.product.findFirst({
        where: { id: Number(item.productId), companyId: context!.companyId }
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: `El producto ID ${item.productId} no existe o no pertenece a tu empresa` },
          { status: 400 }
        );
      }

      const qty = Number(item.quantity || 1);
      const price = item.unitPrice !== undefined ? Number(item.unitPrice) : product.salePrice;
      const subtotal = qty * price;
      computedTotal += subtotal;

      saleDetailsData.push({
        productId: product.id,
        quantity: qty,
        unitPrice: price,
        subtotal
      });

      // Descontar inventario
      await db.product.update({
        where: { id: product.id },
        data: {
          quantityAvailable: { decrement: qty },
          soldQuantity: { increment: qty }
        }
      });
    }

    const finalTotal = computedTotal - Number(discount || 0);
    const saleNumber = `VEN-${Date.now().toString().slice(-6)}`;

    const newSale = await db.sale.create({
      data: {
        saleNumber,
        userId: 1, // Usuario API por defecto
        client: client || "Cliente General",
        paymentMethod: paymentMethod || "EFECTIVO",
        remarks: remarks || "Venta registrada por API",
        discount: Number(discount || 0),
        total: Math.max(0, finalTotal),
        status: "COMPLETED",
        companyId: context!.companyId,
        saleDetails: {
          create: saleDetailsData
        }
      },
      include: {
        saleDetails: true
      }
    });

    return NextResponse.json({ success: true, data: newSale }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
