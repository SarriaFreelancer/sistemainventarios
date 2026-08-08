import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Aislamiento Multi-Tenant (Seguridad)', () => {
  let companyAId: number;
  let companyBId: number;
  let categoryAId: number;
  let supplierAId: number;

  test.beforeAll(async () => {
    await clearDatabase();
    const data = await seedDatabase();
    companyAId = data.companyA.id;
    companyBId = data.companyB.id;
    categoryAId = data.defaultCategory.id;
    supplierAId = data.defaultSupplier.id;

    // Crear un producto secreto exclusivo de Empresa B directamente en la base de datos
    await prisma.product.create({
      data: {
        code: 'SEC-B-999',
        name: 'Producto Secreto Empresa B',
        quantityAvailable: 15,
        unitCost: 5000,
        salePrice: 10000,
        status: 'AVAILABLE',
        type: 'SALE',
        companyId: companyBId,
        categoryId: data.defaultCategoryB.id,
        supplierId: data.defaultSupplierB.id,
      }
    });

    // Crear un producto de Empresa A para validar colisión
    await prisma.product.create({
      data: {
        code: 'PROD-COMUN',
        name: 'Producto Comun Empresa A',
        quantityAvailable: 20,
        unitCost: 3000,
        salePrice: 6000,
        status: 'AVAILABLE',
        type: 'SALE',
        companyId: companyAId,
        categoryId: categoryAId,
        supplierId: supplierAId,
      }
    });
  });

  test.beforeEach(async () => {
    // Asegurar limpieza de sesión antes de cada prueba
  });

  test('ADMIN A no debe ver productos pertenecientes a la Empresa B', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    const productPage = new ProductPage(page);
    await productPage.goto();

    // Intentar buscar el producto secreto de Empresa B
    await productPage.searchProduct('SEC-B-999');

    // Comprobar que no aparece en la tabla
    const row = page.locator('tr:has-text("SEC-B-999")');
    await expect(row).not.toBeVisible();
  });

  test('ADMIN A debe poder crear un producto con el mismo código que uno de Empresa B (Aislamiento de Restricciones)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    const productPage = new ProductPage(page);
    await productPage.goto();

    // Intentar crear un producto en Empresa A con el código 'SEC-B-999'
    await productPage.clickNewProduct();
    await productPage.fillForm({
      code: 'SEC-B-999', // Código que pertenece a Empresa B
      name: 'Mi version de SEC-B-999',
      categoryId: String(categoryAId),
      supplierId: String(supplierAId),
      qty: '10',
      cost: '4000',
      price: '8000',
    });
    await productPage.submitForm();

    // Verificar que se creó correctamente en Empresa A sin error de código duplicado
    await productPage.searchProduct('SEC-B-999');
    await productPage.expectProductInTable('SEC-B-999', 'Mi version de SEC-B-999');
  });

  test('ADMIN A no debe poder duplicar un código de producto dentro de su misma Empresa A', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    const productPage = new ProductPage(page);
    await productPage.goto();

    // Intentar crear un producto con código ya existente en Empresa A ('PROD-COMUN')
    await productPage.clickNewProduct();
    await productPage.fillForm({
      code: 'PROD-COMUN', // Código duplicado en Empresa A
      name: 'Duplicado de Comun',
      categoryId: String(categoryAId),
      supplierId: String(supplierAId),
      qty: '5',
      cost: '2000',
      price: '4000',
    });
    
    // Guardar formulario
    await page.click('button[type="submit"]:has-text("Guardar")');
    // Esperar mensaje de error
    await expect(page.locator('text=Ya existe un producto con el mismo código')).toBeVisible();
    await page.click('.swal2-confirm');
  });
});
