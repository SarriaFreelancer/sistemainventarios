"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { getSessionCompanyId } from "@/lib/session";
import { revalidatePath } from "next/cache";

async function resolveActionCompanyId() {
  const companyId = await getSessionCompanyId();
  if (!companyId) {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true, role: { select: { name: true } } },
    });
    if (user?.role?.name === "SUPERADMIN") {
      const globalCompany = await prisma.company.findFirst({
        where: { name: "Global" },
      });
      return globalCompany?.id || null;
    }
    return user?.companyId;
  }
  return companyId;
}

// EMPLOYEES

export async function createEmployee(data: any) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    if (!companyId) throw new Error("Compañía no encontrada");

    const employee = await prisma.employee.create({
      data: {
        ...data,
        baseSalary: Number(data.baseSalary),
        companyId,
      },
    });

    revalidatePath("/dashboard/rrhh/empleados");
    return { success: true, employee };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEmployee(id: number, data: any) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const employee = await prisma.employee.update({
      where: { id, companyId: companyId! },
      data: {
        ...data,
        baseSalary: Number(data.baseSalary),
      },
    });

    revalidatePath("/dashboard/rrhh/empleados");
    return { success: true, employee };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// PAYROLL

export async function generatePayroll(periodStart: Date, periodEnd: Date) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    if (!companyId) throw new Error("Compañía no encontrada");

    // Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
    });

    if (employees.length === 0) {
      throw new Error("No hay empleados activos para generar nómina.");
    }

    const code = `PAY-${Date.now().toString().slice(-6)}`;

    // Calculate details
    let totalAmount = 0;
    const detailsData = employees.map(emp => {
      // Assuming a simplistic monthly payroll for demo purposes
      // In a real system, you'd calculate days worked based on periodStart and periodEnd
      const baseSalary = emp.baseSalary;
      const deductions = baseSalary * 0.08; // 8% generic deduction (health/pension)
      const additions = 0;
      const netPay = baseSalary + additions - deductions;
      
      totalAmount += netPay;

      return {
        employeeId: emp.id,
        baseSalary,
        additions,
        deductions,
        netPay,
        companyId,
      };
    });

    const payroll = await prisma.payroll.create({
      data: {
        code,
        periodStart,
        periodEnd,
        totalAmount,
        companyId,
        details: {
          create: detailsData
        }
      },
    });

    revalidatePath("/dashboard/rrhh/nomina");
    return { success: true, payroll };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function processPayroll(payrollId: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const payroll = await prisma.payroll.update({
      where: { id: payrollId, companyId: companyId! },
      data: { status: "APPROVED" },
    });

    revalidatePath(`/dashboard/rrhh/nomina/${payrollId}`);
    revalidatePath("/dashboard/rrhh/nomina");
    return { success: true, payroll };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function payPayroll(payrollId: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const payroll = await prisma.payroll.update({
      where: { id: payrollId, companyId: companyId! },
      data: { 
        status: "PAID",
        paymentDate: new Date()
      },
    });

    revalidatePath(`/dashboard/rrhh/nomina/${payrollId}`);
    revalidatePath("/dashboard/rrhh/nomina");
    return { success: true, payroll };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
