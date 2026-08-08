import { Page, expect } from '@playwright/test';

export class ProductPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard/products');
    await this.page.waitForLoadState('networkidle');
  }

  async clickNewProduct() {
    await this.page.click('button:has-text("Nuevo Producto")');
    await this.page.waitForSelector('form:has-text("Tipo de Producto")');
  }

  async fillForm(data: {
    code: string;
    name: string;
    type?: string;
    groupId?: string;
    categoryId?: string;
    supplierId?: string;
    qty?: string;
    cost?: string;
    price?: string;
  }) {
    if (data.type) {
      await this.page.selectOption('select[name="type"]', data.type);
    }
    await this.page.fill('input[name="code"]', data.code);
    await this.page.fill('input[name="name"]', data.name);
    
    if (data.groupId) {
      await this.page.selectOption('select[name="productGroupId"]', data.groupId);
    }
    if (data.categoryId) {
      await this.page.selectOption('select[name="categoryId"]', data.categoryId);
    }
    if (data.supplierId) {
      await this.page.selectOption('select[name="supplierId"]', data.supplierId);
    }
    if (data.qty) {
      await this.page.fill('input[name="quantityAvailable"]', data.qty);
    }
    if (data.cost) {
      await this.page.fill('input[name="unitCost"]', data.cost);
    }
    if (data.price) {
      await this.page.fill('input[name="salePrice"]', data.price);
    }
  }

  async submitForm() {
    await this.page.click('button[type="submit"]:has-text("Guardar")');
    // Esperar a que se cierre el diálogo y se muestre la alerta de SweetAlert
    await this.page.waitForSelector('text=Producto Registrado');
    await this.page.click('.swal2-confirm'); // Confirmar SweetAlert
  }

  async searchProduct(nameOrCode: string) {
    await this.page.fill('input[placeholder="Buscar por nombre o código..."]', nameOrCode);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500); // Pequeña espera para que filtre la tabla
  }

  async expectProductInTable(code: string, name: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    await expect(row).toBeVisible();
    await expect(row).toContainText(name);
  }

  async clickEditProduct(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    await row.locator('button[aria-label="Editar producto"]').click();
    await this.page.waitForSelector('form:has-text("Editar Producto")');
  }

  async submitEditForm() {
    await this.page.click('button[type="submit"]:has-text("Guardar Cambios")');
    await this.page.waitForSelector('text=Producto Actualizado');
    await this.page.click('.swal2-confirm');
  }

  async deleteProduct(code: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    await row.locator('button[aria-label="Eliminar producto"]').click();
    await this.page.waitForSelector('text=¿Eliminar Producto?');
    await this.page.click('button:has-text("Sí, eliminar")');
    await this.page.waitForSelector('text=Producto Eliminado');
    await this.page.click('.swal2-confirm');
  }

  async quickSell(code: string, qty: string) {
    const row = this.page.locator(`tr:has-text("${code}")`);
    await row.locator('button:has-text("Vender")').click();
    await this.page.waitForSelector('text=Venta Rápida');
    await this.page.fill('#swal-qty', qty);
    await this.page.click('button:has-text("Confirmar Venta")');
    await this.page.waitForSelector('text=Venta Rápida Completada');
    await this.page.click('.swal2-confirm');
  }
}
