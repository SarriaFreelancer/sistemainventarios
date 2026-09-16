import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { prisma } from '../../lib/prisma';

test.describe('Módulo de CRM y Gestión de Clientes', () => {
  let companyAId: number;

  test.beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();

    const companyA = await prisma.company.findUnique({ where: { name: 'Empresa A Test' } });
    companyAId = companyA!.id;

    // Crear cliente de prueba
    await prisma.customer.create({
      data: {
        name: 'Inversiones y Soluciones SAS',
        email: 'contacto@inversiones.com',
        phone: '3007654321',
        code: '901234567-8',
        companyId: companyAId,
      }
    });

    // Crear lead / prospecto
    await prisma.lead.create({
      data: {
        name: 'Carlos Mendoza',
        companyName: 'Tecnología Plus',
        email: 'carlos.m@tecplus.com',
        phone: '3151234567',
        status: 'NEW',
        companyId: companyAId,
      }
    });
  });

  test('Prueba 1: Visualización de Clientes en el CRM', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/crm');
    await page.waitForLoadState('networkidle');

    // Debe mostrar la cabecera del CRM
    await expect(page.locator('h1, h2').filter({ hasText: /CRM|Clientes|Oportunidades/i }).first()).toBeVisible();
    await expect(page.locator('text=Inversiones y Soluciones SAS')).toBeVisible();
  });

  test('Prueba 2: Vista de Prospectos (Leads)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/crm');
    await page.waitForLoadState('networkidle');

    // Cambiar a pestaña o sección de Prospectos/Leads si existe
    const leadsTab = page.locator('button, a').filter({ hasText: /Prospectos|Leads/i }).first();
    if (await leadsTab.isVisible()) {
      await leadsTab.click();
      await expect(page.locator('text=Carlos Mendoza')).toBeVisible();
    }
  });
});
