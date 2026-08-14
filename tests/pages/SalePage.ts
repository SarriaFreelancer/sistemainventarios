import { Page, expect } from '@playwright/test';

export class SalePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard/sales');
  }

  async clickNewSale() {
    await this.page.click('button:has-text("Nueva Venta")', { force: true });
    await this.page.waitForSelector('text=Registrar Nueva Venta', { timeout: 15000 });
    await this.page.waitForSelector('input[placeholder="Escribe código o nombre del producto..."]', { timeout: 15000 });
  }

  async addProductToCart(searchQuery: string, code: string) {
    const input = this.page.locator('input[placeholder="Escribe código o nombre del producto..."]');
    await input.fill(searchQuery);
    // Esperar a que se despliegue la lista y hacer clic en el botón del producto
    const productButton = this.page.locator(`button:has-text("${code}")`).first();
    await productButton.click({ force: true });
  }

  async fillSaleDetails(data: {
    client?: string;
    status?: 'COMPLETED' | 'PENDING';
    paymentMethod?: string;
    remarks?: string;
  }) {
    if (data.client) {
      await this.page.fill('input[placeholder="Nombre del cliente..."]', data.client);
    }
    if (data.status) {
      await this.page.selectOption('select:has-text("Completada")', data.status);
    }
    if (data.paymentMethod) {
      await this.page.selectOption('select:has-text("EFECTIVO")', data.paymentMethod);
    }
    if (data.remarks) {
      await this.page.fill('input[placeholder="Notas internas..."]', data.remarks);
    }
  }

  async submitSale() {
    const submitBtn = this.page.locator('button:has-text("✓ Crear Venta")');
    await expect(submitBtn).toBeEnabled({ timeout: 10000 });
    await submitBtn.click();
    
    // 1. Confirmar el modal SweetAlert de pre-venta si aparece
    const confirmModalBtn = this.page.locator('button:has-text("Confirmar Registro")');
    if (await confirmModalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmModalBtn.click();
    }

    // 2. Esperar a que se procese y muestre SweetAlert de éxito
    await this.page.waitForSelector('text=¡Venta Registrada!', { timeout: 10000 });
    await this.page.click('.swal2-confirm');
  }

  async expectSaleInTable(saleNumberSearch: string, clientName: string) {
    // Buscar la venta en el listado
    await this.page.fill('input[placeholder="Buscar por factura, cliente..."]', saleNumberSearch);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);

    const row = this.page.locator(`tr:has-text("${clientName}")`);
    await expect(row).toBeVisible();
  }

  async voidSale(saleNumberSearch: string) {
    await this.page.fill('input[placeholder="Buscar por N° venta o cliente..."]', saleNumberSearch);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);

    const row = this.page.locator(`tr:has-text("${saleNumberSearch}")`);
    await row.locator('button[title="Anular venta"]').click();

    await this.page.waitForSelector('text=¿Anular Venta?');
    await this.page.fill('.swal2-input', 'Test Void E2E');
    await this.page.click('button:has-text("Confirmar Anulación")');
    await this.page.waitForSelector('text=Venta Anulada');
    await this.page.click('.swal2-confirm');
  }

  async completePendingSale(saleNumberSearch: string) {
    await this.page.fill('input[placeholder="Buscar por N° venta o cliente..."]', saleNumberSearch);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);

    const row = this.page.locator(`tr:has-text("${saleNumberSearch}")`);
    await row.locator('button[title="Completar Venta"]').click();

    await this.page.waitForSelector('text=Completar Venta Pendiente');
    await this.page.click('button:has-text("✓ Completar Venta")');
    await this.page.waitForSelector('text=Venta Completada');
    await this.page.click('.swal2-confirm');
  }
}
