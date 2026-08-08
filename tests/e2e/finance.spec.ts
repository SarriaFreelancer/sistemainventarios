import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Módulo de Finanzas - Conciliación Matemática', () => {
  let companyAId: number;
  let categoryAId: number;
  let supplierAId: number;
  let adminAId: number;

  test.beforeAll(async () => {
    await clearDatabase();
    const data = await seedDatabase();
    companyAId = data.companyA.id;
    categoryAId = data.defaultCategory.id;
    supplierAId = data.defaultSupplier.id;
    adminAId = data.adminA.id;

    // 1. Crear Productos con costos fijos controlados
    const prodX = await prisma.product.create({
      data: {
        code: 'PROD-X',
        name: 'Producto X Test',
        quantityAvailable: 10,
        unitCost: 25000, // Costo unitario
        salePrice: 50000, // Precio venta
        companyId: companyAId,
        categoryId: categoryAId,
        supplierId: supplierAId
      }
    });

    const prodY = await prisma.product.create({
      data: {
        code: 'PROD-Y',
        name: 'Producto Y Test',
        quantityAvailable: 10,
        unitCost: 70000,
        salePrice: 150000,
        companyId: companyAId,
        categoryId: categoryAId,
        supplierId: supplierAId
      }
    });

    const prodZ = await prisma.product.create({
      data: {
        code: 'PROD-Z',
        name: 'Producto Z Test',
        quantityAvailable: 10,
        unitCost: 40000,
        salePrice: 80000,
        companyId: companyAId,
        categoryId: categoryAId,
        supplierId: supplierAId
      }
    });

    // 2. Registrar Ventas Completadas y Anuladas
    // Venta 1: Completada. 2 unidades de ProdX. Total = 100,000. Costo = 50,000.
    await prisma.sale.create({
      data: {
        saleNumber: 'VEN-TEST-001',
        userId: adminAId,
        client: 'Finanzas Client 1',
        total: 100000,
        paymentMethod: 'EFECTIVO',
        status: 'COMPLETED',
        companyId: companyAId,
        details: {
          create: [{
            productId: prodX.id,
            quantity: 2,
            unitPrice: 50000,
            subtotal: 100000,
            discount: 0,
            total: 100000,
            companyId: companyAId
          }]
        }
      }
    });

    // Venta 2: Completada. 1 unidad de ProdY. Total = 150,000. Costo = 70,000.
    await prisma.sale.create({
      data: {
        saleNumber: 'VEN-TEST-002',
        userId: adminAId,
        client: 'Finanzas Client 2',
        total: 150000,
        paymentMethod: 'TARJETA',
        status: 'COMPLETED',
        companyId: companyAId,
        details: {
          create: [{
            productId: prodY.id,
            quantity: 1,
            unitPrice: 150000,
            subtotal: 150000,
            discount: 0,
            total: 150000,
            companyId: companyAId
          }]
        }
      }
    });

    // Venta 3: Anulada. 1 unidad de ProdZ. Total = 80,000. Costo = 40,000.
    // Al estar VOIDED, no debe sumarse a ingresos ni costo de ventas.
    await prisma.sale.create({
      data: {
        saleNumber: 'VEN-TEST-003',
        userId: adminAId,
        client: 'Finanzas Client 3',
        total: 80000,
        paymentMethod: 'TRANSFERENCIA',
        status: 'VOIDED',
        companyId: companyAId,
        details: {
          create: [{
            productId: prodZ.id,
            quantity: 1,
            unitPrice: 80000,
            subtotal: 80000,
            discount: 0,
            total: 80000,
            companyId: companyAId
          }]
        }
      }
    });

    // 3. Registrar Gastos Operativos Directos
    // Gasto 1: Papelería = $30,000
    await prisma.expense.create({
      data: {
        description: 'Papeleria Oficina',
        amount: 30000,
        category: 'OTHER',
        companyId: companyAId
      }
    });

    // Gasto 2: Servicios = $20,000
    await prisma.expense.create({
      data: {
        description: 'Servicios Internet',
        amount: 20000,
        category: 'UTILITIES',
        companyId: companyAId
      }
    });
  });

  test('Debe calcular matemáticamente y mostrar los KPIs correctos en el panel de Finanzas', async ({ page }) => {
    // Fórmulas matemáticas:
    // Ingresos Totales = Venta1 (100.000) + Venta2 (150.000) = 250.000 COP
    // Costo de Ventas = (2 * 25.000) + (1 * 70.000) = 120.000 COP
    // Ganancia Bruta = 250.000 - 120.000 = 130.000 COP
    // Gastos Operativos = Papelería (30.000) + Servicios (20.000) = 50.000 COP
    // Ganancia Neta = 130.000 (Ganancia Bruta) - 50.000 (Gastos) = 80.000 COP

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/finanzas');
    await page.waitForLoadState('networkidle');

    // 1. Verificar Ingresos Totales = $250,000
    const ingresosCard = page.locator('div:has-text("Ingresos Totales")').first();
    await expect(ingresosCard).toContainText('250.000');

    // 2. Verificar Costo de Ventas = $120,000
    const costoCard = page.locator('div:has-text("Costo de Ventas")').first();
    await expect(costoCard).toContainText('120.000');

    // 3. Verificar Gastos Operativos = $50,000
    const gastosCard = page.locator('div:has-text("Gastos Operativos")').first();
    await expect(gastosCard).toContainText('50.000');

    // 4. Verificar Ganancia Neta = $80,000
    const netProfitCard = page.locator('div:has-text("Ganancia Neta")').first();
    await expect(netProfitCard).toContainText('80.000');
  });
});
