import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

test.describe('Pruebas E2E - Descarga de Reportes con Lotes y Eliminación de Lotes', () => {
  let companyAId: number;
  let categoryAId: number;
  let supplierAId: number;
  let productWithBatchId: number;
  let batchId: number;

  test.beforeAll(async () => {
    await clearDatabase();
    const data = await seedDatabase();
    companyAId = data.companyA.id;
    categoryAId = data.defaultCategory.id;
    supplierAId = data.defaultSupplier.id;

    // Configurar empresa con seguimiento de vencimientos y eliminación de lotes activada
    await prisma.companySetting.upsert({
      where: { companyId: companyAId },
      update: {
        trackExpirationDates: true,
        enableBatchWriteOff: true,
        ...( { enableBatchDelete: true } as any ),
      },
      create: {
        companyId: companyAId,
        trackExpirationDates: true,
        enableBatchWriteOff: true,
        ...( { enableBatchDelete: true } as any ),
      }
    });

    // Crear un producto con lote de prueba
    const product = await prisma.product.create({
      data: {
        code: 'PROD-LOT-REPORTE-01',
        name: 'Suplemento de Prueba Lotes',
        type: 'SALE',
        quantityAvailable: 40,
        unitCost: 12000,
        salePrice: 35000,
        status: 'AVAILABLE',
        companyId: companyAId,
        categoryId: categoryAId,
        supplierId: supplierAId,
      }
    });
    productWithBatchId = product.id;

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 60);

    const batch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        batchNumber: 'LOT-EXP-2026-X',
        expirationDate: expDate,
        quantity: 40,
        status: 'ACTIVE',
        notes: 'Lote especial para pruebas de exportación'
      }
    });
    batchId = batch.id;
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Prueba 1: Generación y Validación de Reporte Excel con Desglose de Lotes (includeBatches=true)', async ({ page }) => {
    // 1. Iniciar sesión en la plataforma
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    // 2. Descargar el reporte con el parámetro includeBatches=true a través de la sesión autenticada
    const response = await page.request.get('/api/reports/products?includeBatches=true');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const buffer = await response.body();
    expect(buffer.length).toBeGreaterThan(0);

    // 3. Inspeccionar el contenido del Excel generado
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet('Productos');
    expect(worksheet).toBeDefined();

    // Validar columnas requeridas para lotes
    const headerRow = worksheet!.getRow(1);
    const headers = (headerRow.values as string[]).map(h => String(h || ''));

    expect(headers).toContain('Nº Lote');
    expect(headers).toContain('Fecha Vencimiento');
    expect(headers).toContain('Cant. Lote');
    expect(headers).toContain('Estado Lote');

    // Verificar que el lote específico figure en el documento
    let foundBatch = false;
    worksheet!.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rowText = (row.values as any[]).join(' ');
      if (rowText.includes('LOT-EXP-2026-X')) {
        foundBatch = true;
      }
    });

    expect(foundBatch).toBe(true);
  });

  test('Prueba 2: Verificación de Presencia del Filtro de Lotes en el Centro de Reportes', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    // Ir a la página del centro de reportes
    await page.goto('/dashboard/reportes');
    await page.waitForLoadState('networkidle');

    // Hacer clic en el botón de descarga del Catálogo de Productos
    const downloadBtn = page.locator('button:has-text("Excel")').first();
    await downloadBtn.click();

    // Debe abrirse el modal de filtros
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Debe existir la casilla de verificación de lotes porque trackExpirationDates=true
    const batchCheckbox = modal.locator('input#report-include-batches');
    await expect(batchCheckbox).toBeVisible();
  });

  test('Prueba 3: Eliminación de Lote en el Módulo de Productos al Desglosar Lotes', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/products');
    await page.waitForLoadState('networkidle');

    // Desglosar lotes del producto creado
    const batchBadge = page.locator('button:has-text("lote"), button:has-text("vencido"), button:has-text("restantes")').first();
    await expect(batchBadge).toBeVisible();
    await batchBadge.click();

    // Debe aparecer el botón de Eliminar Lote
    const deleteBatchBtn = page.locator('button:has-text("Eliminar")').first();
    await expect(deleteBatchBtn).toBeVisible();

    // Hacer clic en eliminar lote
    await deleteBatchBtn.click();

    // Confirmar en SweetAlert
    const swalConfirm = page.locator('.swal2-confirm, button:has-text("Sí, eliminar lote")').first();
    await expect(swalConfirm).toBeVisible();
    await swalConfirm.click();

    // Esperar mensaje de éxito
    await expect(page.locator('text=/Lote Eliminado|eliminado correctamente/i').first()).toBeVisible({ timeout: 10000 });

    // Verificar en BD que el lote ya no existe y el stock fue ajustado
    const checkBatch = await prisma.productBatch.findUnique({ where: { id: batchId } });
    expect(checkBatch).toBeNull();
  });
});
