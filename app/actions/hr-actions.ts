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
        positionId: Number(data.positionId),
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
        positionId: Number(data.positionId),
      },
    });

    revalidatePath("/dashboard/rrhh/empleados");
    return { success: true, employee };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// PAYROLL

export async function updateEmployeeStatus(id: number, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED') {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    const employee = await prisma.employee.update({
      where: { id, companyId: companyId! },
      data: { status },
    });

    revalidatePath("/dashboard/rrhh/empleados");
    return { success: true, employee };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generatePayroll(periodStart: Date, periodEnd: Date) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    if (!companyId) throw new Error("Compañía no encontrada");

    // Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { companyId, status: "ACTIVE" },
      include: { 
        position: true,
        novelties: {
          where: {
            OR: [
              { isRecurring: true },
              { isRecurring: false, appliedPayrollId: null }
            ]
          }
        }
      }
    });

    if (employees.length === 0) {
      throw new Error("No hay empleados activos para generar nómina.");
    }

    const code = `PAY-${Date.now().toString().slice(-6)}`;

    // Calculate details
    let totalAmount = 0;
    
    // We will save applied novelty IDs to update them later
    const appliedOneOffNoveltyIds: number[] = [];

    const detailsData = employees.map(emp => {
      const baseSalary = emp.position?.baseSalary || 0;
      let additions = 0;
      let deductions = baseSalary * 0.08; // 8% generic deduction (health/pension)

      // Add novelties
      emp.novelties.forEach(nov => {
        if (nov.type === 'BONUS') {
          additions += nov.amount;
        } else if (nov.type === 'DEDUCTION') {
          deductions += nov.amount;
        }

        if (!nov.isRecurring) {
          appliedOneOffNoveltyIds.push(nov.id);
        }
      });

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

    // Mark one-off novelties as applied
    if (appliedOneOffNoveltyIds.length > 0) {
      await prisma.employeeNovelty.updateMany({
        where: { id: { in: appliedOneOffNoveltyIds } },
        data: { appliedPayrollId: payroll.id }
      });
    }

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

export async function payPayroll(id: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    
    const payroll = await prisma.payroll.findUnique({
      where: { id, companyId: companyId! }
    });

    if (!payroll) throw new Error("Nómina no encontrada");
    if (payroll.status !== "APPROVED") throw new Error("La nómina debe estar aprobada para ser pagada");

    await prisma.payroll.update({
      where: { id },
      data: { 
        status: "PAID",
        paymentDate: new Date(),
      }
    });

    revalidatePath("/dashboard/rrhh/nomina");
    revalidatePath(`/dashboard/rrhh/nomina/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePayroll(id: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    
    const payroll = await prisma.payroll.findUnique({
      where: { id, companyId: companyId! }
    });

    if (!payroll) throw new Error("Nómina no encontrada");
    if (payroll.status !== "DRAFT") throw new Error("Solo se pueden eliminar nóminas en estado borrador");

    // 1. Release applied novelties
    await prisma.employeeNovelty.updateMany({
      where: { appliedPayrollId: id },
      data: { appliedPayrollId: null }
    });

    // 2. Delete payroll details
    await prisma.payrollDetail.deleteMany({
      where: { payrollId: id }
    });

    // 3. Delete payroll
    await prisma.payroll.delete({
      where: { id }
    });

    revalidatePath("/dashboard/rrhh/nomina");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// NOVELTIES

export async function createEmployeeNovelty(data: any) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    if (!companyId) throw new Error("Compañía no encontrada");

    const novelty = await prisma.employeeNovelty.create({
      data: {
        employeeId: Number(data.employeeId),
        type: data.type,
        amount: Number(data.amount),
        description: data.description,
        isRecurring: data.isRecurring,
        companyId,
      },
    });

    revalidatePath("/dashboard/rrhh/novedades");
    return { success: true, novelty };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteEmployeeNovelty(id: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();

    // Check if applied
    const existing = await prisma.employeeNovelty.findUnique({
      where: { id, companyId: companyId! }
    });

    if (existing?.appliedPayrollId) {
      throw new Error("No se puede eliminar una novedad que ya fue aplicada a una nómina.");
    }

    await prisma.employeeNovelty.delete({
      where: { id, companyId: companyId! },
    });

    revalidatePath("/dashboard/rrhh/novedades");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
