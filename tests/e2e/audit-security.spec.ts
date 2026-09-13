import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';
import { prisma } from '../../lib/prisma';

test.describe('Módulo de Auditoría y Seguridad Multi-Tenant', () => {
  let companyAId: number;
  let companyBId: number;
  let adminAId: number;
  let adminBId: number;
  let superadminId: number;

  test.beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();

    const companyA = await prisma.company.findUnique({ where: { name: 'Empresa A Test' } });
    const companyB = await prisma.company.findUnique({ where: { name: 'Empresa B Test' } });
    const adminA = await prisma.user.findUnique({ where: { email: 'adminA@gns-test.com' } });
    const adminB = await prisma.user.findUnique({ where: { email: 'adminB@gns-test.com' } });
    const superadmin = await prisma.user.findUnique({ where: { email: 'superadmin@gns-test.com' } });

    companyAId = companyA!.id;
    companyBId = companyB!.id;
    adminAId = adminA!.id;
    adminBId = adminB!.id;
    superadminId = superadmin!.id;

    // Crear logs de auditoría para Empresa A
    await prisma.auditLog.create({
      data: {
        companyId: companyAId,
        userId: adminAId,
        module: 'PRODUCTS',
        action: 'CREATE',
        entity: 'Product',
        description: 'Creó el producto "Laptop Lenovo ThinkPad A"',
        oldValues: null,
        newValues: { name: 'Laptop Lenovo ThinkPad A', price: 3500000 },
        browser: 'Chrome',
        operatingSystem: 'Windows',
        device: 'Desktop',
        ip: '127.0.0.1',
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId: companyAId,
        userId: adminAId,
        module: 'SEGURIDAD',
        action: 'LOGIN',
        entity: 'User',
        description: 'Inicio de sesión exitoso (adminA@gns-test.com)',
        browser: 'Chrome',
        operatingSystem: 'Windows',
        device: 'Desktop',
        ip: '127.0.0.1',
      }
    });

    // Crear log de auditoría para Empresa B
    await prisma.auditLog.create({
      data: {
        companyId: companyBId,
        userId: adminBId,
        module: 'SALES',
        action: 'CREATE',
        entity: 'Sale',
        description: 'Registró la venta "VEN-20260822-0099" en Empresa B',
        oldValues: null,
        newValues: { total: 850000 },
        browser: 'Firefox',
        operatingSystem: 'Linux',
        device: 'Desktop',
        ip: '192.168.1.50',
      }
    });

    // Crear LoginHistory para métricas
    await prisma.loginHistory.create({
      data: {
        userId: adminAId,
        companyId: companyAId,
        email: 'adminA@gns-test.com',
        status: 'SUCCESS',
        ip: '127.0.0.1',
        browser: 'Chrome',
        operatingSystem: 'Windows',
        device: 'Desktop',
      }
    });

    await prisma.loginHistory.create({
      data: {
        userId: adminAId,
        companyId: companyAId,
        email: 'adminA@gns-test.com',
        status: 'FAILED',
        reason: 'WRONG_PASSWORD',
        ip: '127.0.0.1',
        browser: 'Chrome',
        operatingSystem: 'Windows',
        device: 'Desktop',
      }
    });
  });

  test('Prueba 1: Aislamiento Multi-Tenant — ADMIN A solo visualiza la actividad de Empresa A', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle');

    // Debe mostrar la cabecera y el badge de aislamiento
    await expect(page.locator('h1')).toContainText('Bitácora de Auditoría');
    await expect(page.locator('text=/Auditoría aislada de empresa/i')).toBeVisible();

    // Debe ver el log de Empresa A
    await expect(page.locator('text=/Laptop Lenovo ThinkPad A/i')).toBeVisible();
    await expect(page.locator('text=/Inicio de sesión exitoso/i')).toBeVisible();

    // NO debe ver el log de Empresa B
    await expect(page.locator('text=/VEN-20260822-0099/i')).not.toBeVisible();
    await expect(page.locator('text=/Empresa B/i')).not.toBeVisible();
  });

  test('Prueba 2: Vista Global Multi-Empresa — SUPERADMIN visualiza todas las empresas con columna Empresa', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('superadmin@gns-test.com', 'Admin123');

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle');

    // Debe mostrar el badge global
    await expect(page.locator('text=/Vista Global Multi-Empresa/i')).toBeVisible();

    // Debe mostrar columna "Empresa" en la tabla
    await expect(page.locator('th:has-text("Empresa")')).toBeVisible();

    // Debe ver tanto los logs de Empresa A como de Empresa B
    await expect(page.locator('text=/Laptop Lenovo ThinkPad A/i')).toBeVisible();
    await expect(page.locator('text=/VEN-20260822-0099/i')).toBeVisible();
  });

  test('Prueba 3: Tarjetas de Métricas (KPIs) de Inicios de Sesión y Actividades', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle');

    // Verificar tarjetas de métricas en la cabecera
    await expect(page.locator('text=Logins Exitosos Hoy')).toBeVisible();
    await expect(page.locator('text=Intentos Fallidos Hoy')).toBeVisible();
    await expect(page.locator('text=Acciones Registradas Hoy')).toBeVisible();
  });

  test('Prueba 4: Filtros Rápidos por Módulo y Búsqueda por Texto', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle');

    // Filtrar por módulo Seguridad
    await page.click('button:has-text("Seguridad & Logins")');
    await page.waitForTimeout(1000);

    // Debe mostrar solo logs de seguridad
    await expect(page.locator('text=/Inicio de sesión exitoso/i')).toBeVisible();
    await expect(page.locator('text=/Laptop Lenovo/i')).not.toBeVisible();

    // Volver a todos los módulos
    await page.click('button:has-text("Todos los módulos")');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/Laptop Lenovo ThinkPad A/i')).toBeVisible();
  });

  test('Prueba 5: Modal de Comparación de Cambios (JSON Diff)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    await page.goto('/dashboard/audit');
    await page.waitForLoadState('networkidle');

    // Abrir modal de detalles haciendo clic en "Ver Cambios"
    const viewButton = page.locator('button:has-text("Ver Cambios")').first();
    await expect(viewButton).toBeVisible();
    await viewButton.click();

    // Validar modal de cambios
    await expect(page.locator('text=/VALOR NUEVO/i')).toBeVisible();
    await expect(page.locator('button:has-text("Cerrar Panel")')).toBeVisible();

    // Cerrar modal
    await page.click('button:has-text("Cerrar Panel")');
    await expect(page.locator('text=/VALOR NUEVO/i')).not.toBeVisible();
  });
});
