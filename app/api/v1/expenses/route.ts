import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyRequest } from "@/lib/api-key-auth";
import { getDatabaseClient } from "@/lib/db-manager";

// GET: Consultar Gastos de la Empresa
export async function GET(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "products", "read");
  if (errorResponse) return errorResponse;

  try {
    const db = await getDatabaseClient(context!.companyId);
    const expenses = await db.expense.findMany({
      where: { companyId: context!.companyId },
      orderBy: { date: "desc" }
    });
    return NextResponse.json({ success: true, count: expenses.length, data: expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Registrar Gasto
export async function POST(request: NextRequest) {
  const { errorResponse, context } = await validateApiKeyRequest(request, "products", "create");
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { concept, category, amount, paymentMethod, notes, date } = body;

    if (!concept || !amount) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios: concept, amount" }, { status: 400 });
    }

    const db = await getDatabaseClient(context!.companyId);
    const expense = await db.expense.create({
      data: {
        concept,
        category: category || "GASTOS GENERALES",
        amount: Number(amount),
        paymentMethod: paymentMethod || "EFECTIVO",
        notes: notes || null,
        date: date ? new Date(date) : new Date(),
        companyId: context!.companyId
      }
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
