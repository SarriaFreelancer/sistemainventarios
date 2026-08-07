"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { resolveActionCompanyId } from "@/lib/session";
import { revalidatePath } from "next/cache";

const DEMO_PREFIX = "[DEMO]";

export async function generateDemoData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    if (!companyId) throw new Error("Compañía no encontrada");

    // 1. Create a Product Group
    const group = await prisma.productGroup.create({
      data: {
        name: `${DEMO_PREFIX} Electrónicos`,
        companyId,
      }
    });

    // 2. Create Categories
    const category = await prisma.category.create({
      data: {
        name: `${DEMO_PREFIX} Smartphones`,
        code: "DEMO-CAT-01",
        description: "Teléfonos inteligentes de prueba",
        productGroupId: group.id,
        companyId,
      }
    });

    // 3. Create a Supplier
    const supplier = await prisma.supplier.create({
      data: {
        companyName: `${DEMO_PREFIX} Tech Supplies S.A.`,
        contactName: "Juan Pérez",
        phone: "3000000000",
        email: "demo@techsupplies.com",
        address: "Calle Falsa 123",
        city: "Bogotá",
        companyId,
      }
    });

    // 4. Create Products
    const product1 = await prisma.product.create({
      data: {
        code: "DEMO-PROD-01",
        name: `${DEMO_PREFIX} Smartphone XYZ 128GB`,
        categoryId: category.id,
        supplierId: supplier.id,
        productGroupId: group.id,
        quantityAvailable: 50,
        unitCost: 800000,
        salePrice: 1200000,
        companyId,
      }
    });

    const product2 = await prisma.product.create({
      data: {
        code: "DEMO-PROD-02",
        name: `${DEMO_PREFIX} Auriculares Inalámbricos`,
        categoryId: category.id,
        supplierId: supplier.id,
        productGroupId: group.id,
        quantityAvailable: 120,
        unitCost: 150000,
        salePrice: 300000,
        companyId,
      }
    });

    // 5. Create a Sale
    await prisma.sale.create({
      data: {
        saleNumber: `DEMO-SALE-${Date.now()}`,
        userId: Number(session.user.id),
        client: `${DEMO_PREFIX} Cliente Genérico`,
        total: 1500000,
        status: "COMPLETED",
        companyId,
        details: {
          create: [
            {
              productId: product1.id,
              quantity: 1,
              unitPrice: 1200000,
              subtotal: 1200000,
              total: 1200000,
              companyId,
            },
            {
              productId: product2.id,
              quantity: 1,
              unitPrice: 300000,
              subtotal: 300000,
              total: 300000,
              companyId,
            }
          ]
        }
      }
    });

    // 6. Create HR Position and Employee
    const position = await prisma.position.create({
      data: {
        name: `${DEMO_PREFIX} Vendedor de Mostrador`,
        baseSalary: 1300000,
        companyId,
      }
    });

    await prisma.employee.create({
      data: {
        firstName: `${DEMO_PREFIX} Ana`,
        lastName: "Gómez",
        documentId: "1234567890",
        email: "ana.demo@empresa.com",
        phone: "3110000000",
        positionId: position.id,
        hireDate: new Date(),
        companyId,
      }
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

export async function clearDemoData(targetCompanyId?: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    
    const isSuperAdmin = session.user.role === 'SUPERADMIN';
    const companyId = targetCompanyId || (await resolveActionCompanyId());
    if (!companyId) throw new Error("Compañía no encontrada");

    // Limpieza completa por empresa conservando usuarios, licencias y la empresa misma
    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { companyId } });
      await tx.auditLog.deleteMany({ where: { companyId } });
      await tx.saleDetail.deleteMany({ where: { companyId } });
      await tx.sale.deleteMany({ where: { companyId } });
      await tx.opportunity.deleteMany({ where: { companyId } });
      await tx.customer.deleteMany({ where: { companyId } });
      await tx.product.deleteMany({ where: { companyId } });
      await tx.category.deleteMany({ where: { companyId } });
      await tx.productGroup.deleteMany({ where: { companyId } });
      await tx.supplier.deleteMany({ where: { companyId } });
      await tx.invoiceCounter.deleteMany({ where: { companyId } });
      
      // Borrar empleados y posiciones de demostración/RRHH de la empresa si existen
      await tx.employee?.deleteMany({ where: { companyId } }).catch(() => {});
      await tx.position?.deleteMany({ where: { companyId } }).catch(() => {});
    });

    revalidatePath("/", "layout");
    return { success: true, message: "Datos transaccionales y de catálogo limpiados correctamente. Las cuentas de usuario y licencias fueron conservadas." };
  } catch (error: any) {
    console.error('[CLEAR_DEMO_DATA_ERROR]', error);
    return { success: false, error: error.message };
  }
}

export async function clearGlobalSystemData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return { success: false, error: "Solo el SUPERADMIN puede ejecutar una limpieza global del sistema." };
    }

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.saleDetail.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.productGroup.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.invoiceCounter.deleteMany();
    await prisma.employee?.deleteMany().catch(() => {});
    await prisma.position?.deleteMany().catch(() => {});

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

    revalidatePath("/", "layout");
    return { success: true, message: "Se han eliminado todos los productos, ventas y registros de todas las empresas. Todas las cuentas de usuario y empresas se conservan activas para seguir iniciando sesión." };
  } catch (error: any) {
    console.error('[CLEAR_GLOBAL_DATA_ERROR]', error);
    return { success: false, error: error.message };
  }
}
