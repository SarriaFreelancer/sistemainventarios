import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyRequest } from "@/lib/api-key-auth";
import { getDatabaseClient } from "@/lib/db-manager";

// GET: Consultar Grupos (v2)
export async function GET(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "groups", "read");
  if (errorResponse) return errorResponse;

  try {
    const db = await getDatabaseClient(context!.companyId);
    const groups = await db.productGroup.findMany({
      where: { companyId: context!.companyId },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, apiVersion: "v2", data: groups });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear Grupo (v2)
export async function POST(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "groups", "create");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "El nombre del grupo es obligatorio" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const group = await db.productGroup.create({
      data: {
        name,
        description: description || null,
        companyId: context!.companyId
      }
    });

    return NextResponse.json({ success: true, apiVersion: "v2", data: group }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Editar Grupo (v2)
export async function PUT(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "groups", "update");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el 'id' del grupo" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const updated = await db.productGroup.updateMany({
      where: { id: Number(id), companyId: context!.companyId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description })
      }
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Grupo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, apiVersion: "v2", message: "Grupo actualizado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar Grupo (v2)
export async function DELETE(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "groups", "delete");
  if (errorResponse) return errorResponse;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el parámetro '?id='" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const deleted = await db.productGroup.deleteMany({
      where: { id: Number(id), companyId: context!.companyId }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: "Grupo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, apiVersion: "v2", message: "Grupo eliminado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
