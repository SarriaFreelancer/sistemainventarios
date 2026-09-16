import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { prisma } from '../../lib/prisma';

test.describe('Ventas Pendientes — Edición Dinámica del Carrito y Cierre de Cobro', () => {
  let companyAId: number;
  let prod1Id: number;
  let prod2Id: number;

  test.beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();

    const companyA = await prisma.company.findUnique({ where: { name: 'Empresa A Test' } });
    companyAId = companyA!.id;

    const productGroup = await prisma.productGroup.findFirst({ where: { companyId: companyAId } });

    const supplier = await prisma.supplier.create({
      data: {
        companyName: 'Proveedor Central S.A.',
        contactName: 'Contacto Central',
        phone: '123456789',
        email: 'proveedor.central@test.com',
        address: 'Calle 100',
        city: 'Bogota',
        companyId: companyAId,
      }
    });

    const category = await prisma.category.create({
      data: {
        name: 'Electrónica y Hogar',
        companyId: companyAId,
        productGroupId: productGroup!.id,
      }
    });

    // Producto 1
    const p1 = await prisma.product.create({
      data: {
        code: 'PROD-A01',
        name: 'Teclado Mecánico RGB',
        salePrice: 150000,
        unitCost: 80000,
        quantityAvailable: 25,
        type: 'SALE',
        companyId: companyAId,
        supplierId: supplier.id,
        categoryId: category.id,
      }
    });
    prod1Id = p1.id;

    // Producto 2
    const p2 = await prisma.product.create({
      data: {
        code: 'PROD-A02',
        name: 'Mouse Inalámbrico Pro',
        salePrice: 80000,
        unitCost: 40000,
        quantityAvailable: 30,
        type: 'SALE',
        companyId: companyAId,
        supplierId: supplier.id,
        categoryId: category.id,
      }
    });
    prod2Id = p2.id;
  });

  test('Debe registrar una venta PENDING, permitir agregar más productos al completar y descontar stock final', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    // 1. Ir al módulo de ventas
    await page.goto('/dashboard/sales');
    await page.waitForLoadState('networkidle');

    // 2. Abrir diálogo de Nueva Venta
    await page.click('button:has-text("Nueva Venta")');
    await expect(page.locator('text=Registrar Nueva Venta')).toBeVisible();

    // 3. Buscar y agregar Producto 1
    await page.click('input[placeholder*="Buscar producto"]');
    await page.fill('input[placeholder*="Buscar producto"]', 'Teclado');
    await page.click('button:has-text("Teclado Mecánico RGB")');

    // 4. Seleccionar estado PENDIENTE
    await page.selectOption('select:has-text("Completada")', { label: 'Pendiente de Cobro' });

    // 5. Confirmar registro de la venta pendiente
    await page.click('button:has-text("Confirmar Venta")');
    await page.waitForTimeout(2000);

    // 6. Verificar que la venta aparece en la tabla con estado Pendiente
    await expect(page.locator('text=/PENDIENTE/i').first()).toBeVisible();

    // 7. Abrir el modal "Completar Venta"
    const completeButton = page.locator('button[title*="Completar"], button:has-text("Completar")').first();
    await completeButton.click();
    await expect(page.locator('text=Completar Venta')).toBeVisible();

    // 8. Buscar y agregar Producto 2 dentro del modal de completar venta
    await page.click('input[placeholder*="Buscar y agregar más productos"]');
    await page.fill('input[placeholder*="Buscar y agregar más productos"]', 'Mouse');
    await page.click('button:has-text("Mouse Inalámbrico Pro")');

    // 9. Incrementar cantidad del Mouse a 2
    const plusButtons = page.locator('button:has(.lucide-plus)');
    if (await plusButtons.count() > 0) {
      await plusButtons.last().click();
    }

    // 10. Seleccionar método de pago final
    const paymentSelect = page.locator('select').filter({ hasText: /Efectivo|Transferencia|Tarjeta/ }).first();
    if (await paymentSelect.isVisible()) {
      await paymentSelect.selectOption({ label: 'Transferencia Bancaria' });
    }

    // 11. Confirmar cobro final
    await page.click('button:has-text("Confirmar Cobro y Facturar")');
    await page.waitForTimeout(3000);

    // 12. Verificar en base de datos que el stock de ambos productos se redujo correctamente
    const updatedP1 = await prisma.product.findUnique({ where: { id: prod1Id } });
    const updatedP2 = await prisma.product.findUnique({ where: { id: prod2Id } });

    expect(updatedP1?.quantityAvailable).toBe(24); // 25 - 1
    expect(updatedP2?.quantityAvailable).toBe(28); // 30 - 2
  });
});
