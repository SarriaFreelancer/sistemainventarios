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

export async function clearDemoData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    if (!companyId) throw new Error("Compañía no encontrada");

    // The order of deletion matters due to foreign keys.
    // Sale -> SaleDetails
    const sales = await prisma.sale.findMany({
      where: { companyId, client: { startsWith: DEMO_PREFIX } }
    });
    const saleIds = sales.map(s => s.id);
    await prisma.saleDetail.deleteMany({ where: { saleId: { in: saleIds } } });
    await prisma.sale.deleteMany({ where: { id: { in: saleIds } } });

    // HR
    await prisma.employee.deleteMany({
      where: { companyId, firstName: { startsWith: DEMO_PREFIX } }
    });
    await prisma.position.deleteMany({
      where: { companyId, name: { startsWith: DEMO_PREFIX } }
    });

    // Products
    await prisma.product.deleteMany({
      where: { companyId, name: { startsWith: DEMO_PREFIX } }
    });

    // Supplier
    await prisma.supplier.deleteMany({
      where: { companyId, companyName: { startsWith: DEMO_PREFIX } }
    });

    // Category
    await prisma.category.deleteMany({
      where: { companyId, name: { startsWith: DEMO_PREFIX } }
    });

    // Product Group
    await prisma.productGroup.deleteMany({
      where: { companyId, name: { startsWith: DEMO_PREFIX } }
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message };
  }
}
