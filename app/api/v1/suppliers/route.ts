import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyRequest } from "@/lib/api-key-auth";
import { getDatabaseClient } from "@/lib/db-manager";

// GET: Consultar Proveedores
export async function GET(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "suppliers", "read");
  if (errorResponse) return errorResponse;

  try {
    const db = await getDatabaseClient(context!.companyId);
    const suppliers = await db.supplier.findMany({
      where: { companyId: context!.companyId },
      orderBy: { companyName: "asc" }
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear Proveedor
export async function POST(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "suppliers", "create");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { code, companyName, nit, name, email, phone, address, city, contactName } = body;

    const finalCompanyName = companyName || name;
    if (!finalCompanyName) {
      return NextResponse.json({ success: false, error: "El nombre de la empresa proveedora (companyName) es obligatorio" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const supplier = await db.supplier.create({
      data: {
        code: code || null,
        companyName: finalCompanyName,
        nit: nit || null,
        contactName: contactName || "Contacto Principal",
        email: email || `proveedor_${Date.now()}@temp.com`,
        phone: phone || "0000000000",
        address: address || "Sin dirección",
        city: city || "Principal",
        companyId: context!.companyId
      }
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Editar Proveedor
export async function PUT(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "suppliers", "update");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, code, companyName, nit, name, email, phone, address, city, contactName } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el 'id' del proveedor" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (nit !== undefined) updateData.nit = nit;
    if (companyName || name) updateData.companyName = companyName || name;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;

    const updated = await db.supplier.updateMany({
      where: { id: Number(id), companyId: context!.companyId },
      data: updateData
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Proveedor actualizado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar Proveedor
export async function DELETE(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "suppliers", "delete");
  if (errorResponse) return errorResponse;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el parámetro '?id='" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const deleted = await db.supplier.deleteMany({
      where: { id: Number(id), companyId: context!.companyId }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Proveedor eliminado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
