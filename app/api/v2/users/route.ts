import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyRequest } from "@/lib/api-key-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET: Consultar Usuarios (v2)
export async function GET(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "users", "read");
  if (errorResponse) return errorResponse;

  try {
    const users = await prisma.user.findMany({
      where: { companyId: context!.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        createdAt: true,
        lastLogin: true,
        role: { select: { id: true, name: true } }
      },
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, apiVersion: "v2", data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Crear Usuario (v2)
export async function POST(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "users", "create");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { name, email, password, position, roleId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Faltan campos obligatorios: name, email, password" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Ya existe un usuario registrado con ese correo" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        position: position || null,
        companyId: context!.companyId,
        roleId: roleId ? Number(roleId) : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        createdAt: true
      }
    });

    return NextResponse.json({ success: true, apiVersion: "v2", data: user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Editar Usuario (v2)
export async function PUT(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "users", "update");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, name, position, password, roleId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el 'id' del usuario" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (position !== undefined) updateData.position = position;
    if (roleId !== undefined) updateData.roleId = Number(roleId);
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updated = await prisma.user.updateMany({
      where: { id: Number(id), companyId: context!.companyId },
      data: updateData
    });

    if (updated.count === 0) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, apiVersion: "v2", message: "Usuario actualizado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Eliminar Usuario (v2)
export async function DELETE(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "users", "delete");
  if (errorResponse) return errorResponse;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Se requiere el parámetro '?id='" }, { status: 400 });
    }

    const deleted = await prisma.user.deleteMany({
      where: { id: Number(id), companyId: context!.companyId }
    });

    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, apiVersion: "v2", message: "Usuario eliminado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
