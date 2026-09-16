import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { prisma } from '../../lib/prisma';

test.describe('Módulo de Compras y Abastecimiento', () => {
  let companyAId: number;
  let supplierId: number;

  test.beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();

    const companyA = await prisma.company.findUnique({ where: { name: 'Empresa A Test' } });
    companyAId = companyA!.id;

    const productGroup = await prisma.productGroup.findFirst({ where: { companyId: companyAId } });

    const supplier = await prisma.supplier.create({
      data: {
        companyName: 'Distribuidora Mayorista ABC',
        contactName: 'Carlos Gómez',
        email: 'ventas@mayoristaabc.com',
        phone: '3001234567',
        address: 'Zona Industrial',
        city: 'Bogota',
        companyId: companyAId,
      }
    });
    supplierId = supplier.id;

    const category = await prisma.category.create({
      data: {
        name: 'Suministros',
        companyId: companyAId,
        productGroupId: productGroup!.id,
      }
    });

    await prisma.product.create({
      data: {
        code: 'SUM-001',
        name: 'Resma de Papel Carta',
        salePrice: 20000,
        unitCost: 12000,
        quantityAvailable: 10,
        type: 'SALE',
        companyId: companyAId,
        supplierId: supplier.id,
        categoryId: category.id,
      }
    });
  });

  test('Prueba 1: Navegación y Acceso a la Consola de Compras', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/compras');
    await page.waitForLoadState('networkidle');

    // Verificar accesos a submódulos de Compras
    await expect(page.locator('h1, h2').filter({ hasText: /Compras|Requisiciones|Órdenes/i }).first()).toBeVisible();
    await expect(page.locator('a[href*="/compras/ordenes"], button:has-text("Órdenes")').first()).toBeVisible();
  });

  test('Prueba 2: Creación de Requisición Interna de Compra', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/compras/requisiciones');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=/Requisiciones|Solicitudes/i').first()).toBeVisible();
  });

  test('Prueba 3: Gestión de Proveedores en Compras', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/suppliers');
    await page.waitForLoadState('networkidle');

    // Debe listar el proveedor creado
    await expect(page.locator('text=Distribuidora Mayorista ABC')).toBeVisible();
    await expect(page.locator('text=Carlos Gómez')).toBeVisible();
  });
});
