import { test, expect } from '@playwright/test';
import { clearDatabase, seedDatabase } from '../helpers/db-helper';
import { LoginPage } from '../pages/LoginPage';

test.describe('Autenticación y Seguridad de Sesión', () => {
  test.beforeAll(async () => {
    await clearDatabase();
    await seedDatabase();
  });

  test('Debe redirigir a /auth/login si el usuario intenta acceder al dashboard sin sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/.*\/auth\/login.*/);
    await expect(page.locator('h1')).toContainText('Bienvenido');
  });

  test('Debe mostrar error si se intenta iniciar sesión con credenciales incorrectas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'ClaveIncorrecta', false);
    await loginPage.expectErrorMessage('Correo electrónico o contraseña incorrectos. Verifica tus credenciales.');
  });

  test('Debe iniciar sesión correctamente con credenciales válidas y acceder al dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');
    
    // Verificar que estamos en el dashboard y se muestra el menú
    await expect(page.locator('text=Empresa A Test').first()).toBeVisible();
    await expect(page.locator('#tour-profile-menu')).toBeVisible();
  });

  test('Debe permitir cerrar la sesión correctamente', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('adminA@gns-test.com', 'Admin123');

    // 1. Abrir dropdown del perfil
    await page.click('#tour-profile-menu');
    
    // 2. Hacer clic en "Cerrar Sesión"
    await page.click('button:has-text("Cerrar Sesión")');

    // 3. Confirmar en el modal SweetAlert
    await page.click('button:has-text("Sí, salir")');

    await page.waitForURL(/.*\/auth\/login.*/);
    await expect(page.locator('h1')).toContainText('Bienvenido');
  });
});
