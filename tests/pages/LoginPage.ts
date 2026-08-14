import { Page, expect } from '@playwright/test';

export class LoginPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password = 'Admin123', expectSuccess = true) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    
    if (expectSuccess) {
      // Esperar a que la URL cambie al dashboard (lo cual indica login exitoso)
      await this.page.waitForURL(/.*\/dashboard.*/, { waitUntil: 'domcontentloaded' });
    }
  }

  async expectErrorMessage(message?: string) {
    const errorBanner = this.page.locator('p.leading-snug').first();
    await expect(errorBanner).toBeVisible({ timeout: 10000 });
    if (message) {
      await expect(errorBanner).toContainText(/Contraseña incorrecta|Correo electrónico o contraseña incorrectos|Credenciales/i);
    }
  }
}
