import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { prisma } from '../../lib/prisma';

test.describe('Módulo de Recursos Humanos (RRHH) y Nómina', () => {
  let companyAId: number;

  test.beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();

    const companyA = await prisma.company.findUnique({ where: { name: 'Empresa A Test' } });
    companyAId = companyA!.id;

    // Crear un cargo
    const position = await prisma.position.create({
      data: {
        name: 'Desarrollador Senior',
        baseSalary: 4500000,
        companyId: companyAId,
      }
    });

    // Crear un empleado
    await prisma.employee.create({
      data: {
        documentId: '1098765432',
        documentType: 'CC',
        firstName: 'Juan David',
        lastName: 'Pérez',
        email: 'juan.perez@empresa.com',
        phone: '3109876543',
        baseSalary: 4500000,
        positionId: position.id,
        status: 'ACTIVE',
        companyId: companyAId,
      }
    });
  });

  test('Prueba 1: Visualización del Listado de Empleados', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/rrhh/empleados');
    await page.waitForLoadState('networkidle');

    // Debe mostrar al empleado registrado
    await expect(page.locator('text=Juan David Pérez')).toBeVisible();
    await expect(page.locator('text=1098765432')).toBeVisible();
    await expect(page.locator('text=Desarrollador Senior')).toBeVisible();
  });

  test('Prueba 2: Módulo de Novedades de Personal', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/rrhh/novedades');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').filter({ hasText: /Novedades|Incidencias/i }).first()).toBeVisible();
  });

  test('Prueba 3: Centro de Liquidación de Nómina', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/rrhh/nomina');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').filter({ hasText: /Nómina|Liquidación/i }).first()).toBeVisible();
  });
});
