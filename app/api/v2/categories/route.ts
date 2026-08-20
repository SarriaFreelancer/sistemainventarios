import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyRequest } from "@/lib/api-key-auth";
import { getDatabaseClient } from "@/lib/db-manager";

// GET: Consultar Categorías (v2)
export async function GET(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "categories", "read");
  if (errorResponse) return errorResponse;

  try {
    const db = await getDatabaseClient(context!.companyId);
    const categories = await db.category.findMany({
      where: { companyId: context!.companyId },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, apiVersion: "v2", data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear Categoría (v2)
export async function POST(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "categories", "create");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "El nombre de la categoría es obligatorio" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const category = await db.category.create({
      data: {
        name,
        description: description || null,
        companyId: context!.companyId
      }
    });

    return NextResponse.json({ success: true, apiVersion: "v2", data: category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Editar Categoría (v2)
export async function PUT(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "categories", "update");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el 'id' de la categoría" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const updated = await db.category.updateMany({
      where: { id: Number(id), companyId: context!.companyId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description })
      }
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Categoría no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, apiVersion: "v2", message: "Categoría actualizada correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar Categoría (v2)
export async function DELETE(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "categories", "delete");
  if (errorResponse) return errorResponse;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el parámetro '?id='" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const deleted = await db.category.deleteMany({
      where: { id: Number(id), companyId: context!.companyId }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: "Categoría no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, apiVersion: "v2", message: "Categoría eliminada correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
