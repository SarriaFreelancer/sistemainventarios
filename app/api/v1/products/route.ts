import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyRequest } from "@/lib/api-key-auth";
import { getDatabaseClient } from "@/lib/db-manager";

// GET: Consultar Productos
export async function GET(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "products", "read");
  if (errorResponse) return errorResponse;

  try {
    const db = await getDatabaseClient(context!.companyId);
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get("limit") || 50);

    const products = await db.product.findMany({
      where: { companyId: context!.companyId },
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true, contactName: true } },
        productGroup: { select: { id: true, name: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear Producto
export async function POST(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "products", "create");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { code, name, categoryId, supplierId, quantityAvailable, unitCost, salePrice, productGroupId, type } = body;

    if (!code || !name || !categoryId || !supplierId) {
      return NextResponse.json(
        { success: false, error: "Faltan campos obligatorios: code, name, categoryId, supplierId" },
        { status: 400 }
      );
    }

    const db = await getDatabaseClient(context!.companyId);

    // Validar que la categoría y proveedor pertenezcan a esta empresa
    const validCategory = await db.category.findFirst({
      where: { id: Number(categoryId), companyId: context!.companyId }
    });
    if (!validCategory) {
      return NextResponse.json({ success: false, error: "La categoría especificada no existe o no pertenece a tu empresa" }, { status: 400 });
    }

    const validSupplier = await db.supplier.findFirst({
      where: { id: Number(supplierId), companyId: context!.companyId }
    });
    if (!validSupplier) {
      return NextResponse.json({ success: false, error: "El proveedor especificado no existe o no pertenece a tu empresa" }, { status: 400 });
    }

    if (productGroupId) {
      const validGroup = await db.productGroup.findFirst({
        where: { id: Number(productGroupId), companyId: context!.companyId }
      });
      if (!validGroup) {
        return NextResponse.json({ success: false, error: "El grupo de productos especificado no existe o no pertenece a tu empresa" }, { status: 400 });
      }
    }

    // Verificar si el código existe en esta empresa
    const existing = await db.product.findFirst({
      where: { code, companyId: context!.companyId }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existe un producto con el código ${code} en tu empresa` },
        { status: 409 }
      );
    }

    const newProduct = await db.product.create({
      data: {
        code,
        name,
        categoryId: Number(categoryId),
        supplierId: Number(supplierId),
        quantityAvailable: Number(quantityAvailable || 0),
        unitCost: Number(unitCost || 0),
        salePrice: Number(salePrice || 0),
        type: type || "SALE",
        productGroupId: productGroupId ? Number(productGroupId) : null,
        companyId: context!.companyId
      }
    });

    // Auto-vincular stock en Bodega Principal por defecto
    try {
      let defaultWarehouse = await db.warehouse.findFirst({
        where: { companyId: context!.companyId, isDefault: true }
      });
      if (!defaultWarehouse) {
        defaultWarehouse = await db.warehouse.create({
          data: {
            code: "BOD-MAIN",
            name: "Bodega Principal",
            isDefault: true,
            companyId: context!.companyId
          }
        });
      }
      if (defaultWarehouse) {
        await db.warehouseStock.create({
          data: {
            productId: newProduct.id,
            warehouseId: defaultWarehouse.id,
            physical: Number(quantityAvailable || 0),
            companyId: context!.companyId
          }
        });
      }
    } catch (whErr) {
      console.error("[AUTO_WAREHOUSE_STOCK_ERROR]", whErr);
    }

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT / PATCH: Editar Producto
export async function PUT(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "products", "update");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, code, name, categoryId, supplierId, quantityAvailable, unitCost, salePrice, productGroupId, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el 'id' del producto" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);

    // Validar que el producto pertenezca a la empresa
    const targetProduct = await db.product.findFirst({
      where: { id: Number(id), companyId: context!.companyId }
    });
    if (!targetProduct) {
      return NextResponse.json({ success: false, error: "Producto no encontrado en tu empresa" }, { status: 404 });
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    
    if (categoryId !== undefined) {
      const validCategory = await db.category.findFirst({
        where: { id: Number(categoryId), companyId: context!.companyId }
      });
      if (!validCategory) {
        return NextResponse.json({ success: false, error: "La categoría especificada no pertenece a tu empresa" }, { status: 400 });
      }
      updateData.categoryId = Number(categoryId);
    }

    if (supplierId !== undefined) {
      const validSupplier = await db.supplier.findFirst({
        where: { id: Number(supplierId), companyId: context!.companyId }
      });
      if (!validSupplier) {
        return NextResponse.json({ success: false, error: "El proveedor especificado no pertenece a tu empresa" }, { status: 400 });
      }
      updateData.supplierId = Number(supplierId);
    }

    if (productGroupId !== undefined) {
      if (productGroupId !== null) {
        const validGroup = await db.productGroup.findFirst({
          where: { id: Number(productGroupId), companyId: context!.companyId }
        });
        if (!validGroup) {
          return NextResponse.json({ success: false, error: "El grupo especificado no pertenece a tu empresa" }, { status: 400 });
        }
      }
      updateData.productGroupId = productGroupId ? Number(productGroupId) : null;
    }

    if (quantityAvailable !== undefined) updateData.quantityAvailable = Number(quantityAvailable);
    if (unitCost !== undefined) updateData.unitCost = Number(unitCost);
    if (salePrice !== undefined) updateData.salePrice = Number(salePrice);
    if (status !== undefined) updateData.status = status;

    const updated = await db.product.updateMany({
      where: { id: Number(id), companyId: context!.companyId },
      data: updateData
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Producto no encontrado o sin permisos" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Producto actualizado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar Producto
export async function DELETE(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "products", "delete");
  if (errorResponse) return errorResponse;

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el parámetro '?id='" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);

    const deleted = await db.product.deleteMany({
      where: { id: Number(id), companyId: context!.companyId }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Producto eliminado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
