import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { SalePage } from '../pages/SalePage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Módulo de Notificaciones y Campanita', () => {
  let companyAId: number;
  let categoryAId: number;
  let supplierAId: number;

  test.beforeAll(async () => {
    await clearDatabase();
    const data = await seedDatabase();
    companyAId = data.companyA.id;
    categoryAId = data.defaultCategory.id;
    supplierAId = data.defaultSupplier.id;
  });

  test('Debe generar una notificación al registrar una venta PENDING y limpiarla al completarse', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    // 1. Crear producto para vender
    await prisma.product.create({
      data: {
        code: 'PROD-PEND-001',
        name: 'Producto Venta Pendiente',
        quantityAvailable: 10,
        unitCost: 1000,
        salePrice: 2000,
        status: 'AVAILABLE',
        type: 'SALE',
        companyId: companyAId,
        categoryId: categoryAId,
        supplierId: supplierAId
      }
    });

    // 2. Registrar venta PENDING
    const salePage = new SalePage(page);
    await salePage.goto();
    await salePage.clickNewSale();
    await salePage.addProductToCart('PROD-PEND-001', 'PROD-PEND-001');
    await salePage.fillSaleDetails({
      client: 'Cliente Pendiente E2E',
      status: 'PENDING',
      paymentMethod: 'TRANSFERENCIA',
      remarks: 'Reservado a crédito'
    });
    await salePage.submitSale();

    // Buscar el número de venta registrado para seguimiento
    const salesTable = page.locator('table tbody tr').first();
    const saleNumberText = await salesTable.locator('td').first().innerText();

    // 3. Comprobar que aparece una alerta en la campanita
    await page.waitForTimeout(6000); // Esperar polling de 5s
    const bellButton = page.locator('button[aria-label="Notificaciones"]');
    await expect(bellButton.locator('span.bg-destructive').first()).toBeVisible();

    await bellButton.click();
    await expect(page.locator(`text=${saleNumberText}`)).toBeVisible();
    await expect(page.locator('text=Cobro Pendiente')).toBeVisible();

    // Cerrar dropdown
    await page.click('h1');

    // 4. Completar el pago de la venta pendiente
    await salePage.completePendingSale(saleNumberText);

    // 5. Verificar que la notificación de cobro pendiente desaparece automáticamente
    await page.waitForTimeout(6000); // Esperar polling
    await expect(bellButton.locator('span.bg-destructive').first()).not.toBeVisible();
  });

  test('La opción de Limpiar Todo debe ocultar las alertas de la sesión actual sin volver a mostrarlas hasta nuevo login', async ({ page }) => {
    // 1. Crear otro producto con stock agotado para forzar una notificación
    await prisma.product.create({
      data: {
        code: 'PROD-OUT-888',
        name: 'Producto Agotado Test',
        quantityAvailable: 0,
        unitCost: 1500,
        salePrice: 3000,
        status: 'OUT_OF_STOCK',
        type: 'SALE',
        companyId: companyAId,
        categoryId: categoryAId,
        supplierId: supplierAId
      }
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    // Esperar a que la notificación de stock agotado sea detectada y mostrada
    await page.waitForTimeout(6000);
    const bellButton = page.locator('button[aria-label="Notificaciones"]');
    await expect(bellButton.locator('span.bg-destructive').first()).toBeVisible();

    // 2. Limpiar todo
    await bellButton.click();
    await page.click('button:has-text("Limpiar todo")');
    
    // La campana debe vaciarse inmediatamente y ocultar el badge rojo
    await expect(bellButton.locator('span.bg-destructive').first()).not.toBeVisible();

    // 3. Comprobar que en la sesión actual, tras refrescar, la notificación sigue sin aparecer
    await page.reload();
    await page.waitForTimeout(6000); // Polling adicional
    await expect(bellButton.locator('span.bg-destructive').first()).not.toBeVisible();

    // 4. Cerrar sesión e iniciar una nueva sesión (login). La alerta debe volver a aparecer porque es una nueva sesión
    await page.click('#tour-profile-menu');
    await page.click('button:has-text("Cerrar Sesión")');
    await page.click('button:has-text("Sí, salir")');
    
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.waitForTimeout(6000); // Polling inicial
    await expect(bellButton.locator('span.bg-destructive').first()).toBeVisible();
  });
});
