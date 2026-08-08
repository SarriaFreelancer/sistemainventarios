# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Flujos Críticos de Negocio >> Flujo Crítico 1: Ciclo Completo de Inventario, Alertas de Stock y Compras
- Location: tests\e2e\critical-flows.spec.ts:25:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button:has-text("OK")')

```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e3]:
    - complementary [ref=f2e4]:
      - generic [ref=f2e5]:
        - img "GNS SarriaTech" [ref=f2e7]
        - generic [ref=f2e8]:
          - generic [ref=f2e9]: GNS SARRIATECH
          - generic [ref=f2e10]: GESTIÓN DE NEGOCIOS
      - navigation [ref=f2e11]:
        - link "Dashboard" [ref=f2e12] [cursor=pointer]:
          - /url: /dashboard
        - link "Productos" [ref=f2e19] [cursor=pointer]:
          - /url: /dashboard/products
        - link "Grupos" [ref=f2e31] [cursor=pointer]:
          - /url: /dashboard/groups
        - link "Categorías" [ref=f2e35] [cursor=pointer]:
          - /url: /dashboard/categories
        - link "Proveedores" [ref=f2e41] [cursor=pointer]:
          - /url: /dashboard/suppliers
        - link "Ventas" [ref=f2e45] [cursor=pointer]:
          - /url: /dashboard/sales
        - link "CRM" [ref=f2e51] [cursor=pointer]:
          - /url: /dashboard/crm
        - link "Compras" [ref=f2e58] [cursor=pointer]:
          - /url: /dashboard/compras
        - link "Finanzas" [ref=f2e65] [cursor=pointer]:
          - /url: /dashboard/finanzas
        - link "RRHH" [ref=f2e69] [cursor=pointer]:
          - /url: /dashboard/rrhh
        - link "Reportes" [ref=f2e76] [cursor=pointer]:
          - /url: /dashboard/reportes
        - link "Auditoría" [ref=f2e81] [cursor=pointer]:
          - /url: /dashboard/audit
        - link "Configuración" [ref=f2e85] [cursor=pointer]:
          - /url: /dashboard/settings
      - generic [ref=f2e90]:
        - generic [ref=f2e91]:
          - generic [ref=f2e92]:
            - img "Avatar" [ref=f2e94]
            - generic [ref=f2e95]:
              - paragraph [ref=f2e96]: Admin Empresa A
              - generic [ref=f2e97]: Administrador
          - button "Cerrar Sesión" [ref=f2e102] [cursor=pointer]
        - button "Colapsar Menú" [ref=f2e106] [cursor=pointer]
    - generic [ref=f2e111]:
      - banner [ref=f2e112]:
        - generic [ref=f2e120]:
          - paragraph [ref=f2e121]:
            - generic [ref=f2e122]: "EMPRESA:"
            - generic [ref=f2e123]: EMPRESA A TEST
          - heading "ERP Administrador" [level=2] [ref=f2e124]
        - generic [ref=f2e125]:
          - button "Notificaciones" [ref=f2e126] [cursor=pointer]
          - button "Cambiar Tema" [ref=f2e127] [cursor=pointer]
          - button "Avatar Admin Empresa A ADMIN" [ref=f2e131] [cursor=pointer]:
            - img "Avatar" [ref=f2e133]
            - generic [ref=f2e134]:
              - generic [ref=f2e135]: Admin Empresa A
              - generic [ref=f2e136]: ADMIN
      - main [ref=f2e139]:
        - generic [ref=f2e141]:
          - generic [ref=f2e142]:
            - generic [ref=f2e150]:
              - heading "Productos" [level=1] [ref=f2e151]
              - paragraph [ref=f2e152]: Gestiona el catálogo de productos de GNS SarriaTech.
            - button "Nuevo Producto" [ref=f2e154] [cursor=pointer]
          - generic [ref=f2e155]:
            - generic [ref=f2e156]:
              - paragraph [ref=f2e158]: Total Productos
              - paragraph [ref=f2e164]: "1"
              - paragraph [ref=f2e165]: en catálogo
            - generic [ref=f2e166]:
              - paragraph [ref=f2e168]: Stock Total
              - paragraph [ref=f2e173]: "12"
              - paragraph [ref=f2e174]: unidades disponibles
            - generic [ref=f2e175]:
              - paragraph [ref=f2e177]: Valor Inventario
              - paragraph [ref=f2e181]: $ 60.000
              - paragraph [ref=f2e182]: precio de venta
            - generic [ref=f2e183]:
              - paragraph [ref=f2e185]: Sin Stock
              - paragraph [ref=f2e190]: "0"
              - paragraph [ref=f2e191]: productos agotados
          - generic [ref=f2e192]:
            - button "Todos" [ref=f2e193] [cursor=pointer]
            - button "Para Venta" [ref=f2e194] [cursor=pointer]
            - button "Prod. Terminado" [ref=f2e195] [cursor=pointer]
            - button "Servicios" [ref=f2e196] [cursor=pointer]
            - button "Materia Prima" [ref=f2e197] [cursor=pointer]
            - button "Insumos" [ref=f2e198] [cursor=pointer]
            - button "Activos Fijos" [ref=f2e199] [cursor=pointer]
          - generic [ref=f2e200]:
            - generic [ref=f2e201]:
              - textbox "Buscar por nombre o código..." [ref=f2e206]
              - button "Filtros" [ref=f2e207] [cursor=pointer]
            - table [ref=f2e209]:
              - rowgroup [ref=f2e210]:
                - row [ref=f2e211]:
                  - columnheader "Código" [ref=f2e212] [cursor=pointer]
                  - columnheader "Producto" [ref=f2e216] [cursor=pointer]
                  - columnheader "Categoría / Grupo" [ref=f2e219] [cursor=pointer]
                  - columnheader "Proveedor" [ref=f2e220] [cursor=pointer]
                  - columnheader "Stock" [ref=f2e221] [cursor=pointer]
                  - columnheader "Costo" [ref=f2e225] [cursor=pointer]
                  - columnheader "Precio" [ref=f2e229] [cursor=pointer]
                  - columnheader "Estado" [ref=f2e233] [cursor=pointer]
                  - columnheader "Acciones" [ref=f2e234]
              - rowgroup [ref=f2e235]:
                - row [ref=f2e236]:
                  - cell "TST-INV-100" [ref=f2e237]
                  - cell [ref=f2e239]:
                    - paragraph [ref=f2e240]: Producto Test Inventario
                  - cell "Categoría Test Grupo Test" [ref=f2e241]:
                    - paragraph [ref=f2e242]: Categoría Test
                    - generic [ref=f2e243]: Grupo Test
                  - cell "Proveedor Test" [ref=f2e244]
                  - cell "12" [ref=f2e245]
                  - cell "$ 2.000" [ref=f2e246]
                  - cell "$ 5.000" [ref=f2e247]
                  - cell "Disponible" [ref=f2e248]
                  - cell [ref=f2e250]:
                    - generic [ref=f2e251]:
                      - button "Vender" [ref=f2e252] [cursor=pointer]
                      - button "Editar producto" [ref=f2e257] [cursor=pointer]
                      - button "Eliminar producto" [ref=f2e258] [cursor=pointer]
  - generic [ref=f2e260]:
    - generic [ref=f2e265]:
      - generic [ref=f2e266]:
        - text: Protección de Datos & Cookies
        - generic [ref=f2e267]: Seguro
      - paragraph [ref=f2e271]:
        - text: Utilizamos cookies de sesión esenciales para garantizar el correcto funcionamiento del sistema de inventarios, la seguridad de sus datos y cumplir con las políticas de privacidad de
        - strong [ref=f2e272]: GNS Gestión SarriaTech
        - text: .
    - generic [ref=f2e273]:
      - button [ref=f2e274] [cursor=pointer]: Leer Políticas de Privacidad
      - button [ref=f2e278] [cursor=pointer]: Aceptar y Continuar
  - alert [ref=f2e282]
  - dialog [ref=f2e284]:
    - heading "Producto Registrado" [level=2] [ref=f2e292]
    - generic [ref=f2e293]: El producto fue agregado al catálogo exitosamente.
    - text: "!"
    - button "Aceptar" [active] [ref=f2e295] [cursor=pointer]
```

# Test source

```ts
  1   | import { Page, expect } from '@playwright/test';
  2   | 
  3   | export class ProductPage {
  4   |   private readonly page: Page;
  5   | 
  6   |   constructor(page: Page) {
  7   |     this.page = page;
  8   |   }
  9   | 
  10  |   async goto() {
  11  |     await this.page.goto('/dashboard/products');
  12  |     await this.page.waitForLoadState('networkidle');
  13  |   }
  14  | 
  15  |   async clickNewProduct() {
  16  |     await this.page.click('button:has-text("Nuevo Producto")');
  17  |     await this.page.waitForSelector('form:has-text("Tipo de Producto")');
  18  |   }
  19  | 
  20  |   async fillForm(data: {
  21  |     code: string;
  22  |     name: string;
  23  |     type?: string;
  24  |     groupId?: string;
  25  |     categoryId?: string;
  26  |     supplierId?: string;
  27  |     qty?: string;
  28  |     cost?: string;
  29  |     price?: string;
  30  |   }) {
  31  |     if (data.type) {
  32  |       await this.page.selectOption('select[name="type"]', data.type);
  33  |     }
  34  |     await this.page.fill('input[name="code"]', data.code);
  35  |     await this.page.fill('input[name="name"]', data.name);
  36  |     
  37  |     if (data.groupId) {
  38  |       await this.page.selectOption('select[name="productGroupId"]', data.groupId);
  39  |     }
  40  |     if (data.categoryId) {
  41  |       await this.page.selectOption('select[name="categoryId"]', data.categoryId);
  42  |     }
  43  |     if (data.supplierId) {
  44  |       await this.page.selectOption('select[name="supplierId"]', data.supplierId);
  45  |     }
  46  |     if (data.qty) {
  47  |       await this.page.fill('input[name="quantityAvailable"]', data.qty);
  48  |     }
  49  |     if (data.cost) {
  50  |       await this.page.fill('input[name="unitCost"]', data.cost);
  51  |     }
  52  |     if (data.price) {
  53  |       await this.page.fill('input[name="salePrice"]', data.price);
  54  |     }
  55  |   }
  56  | 
  57  |   async submitForm() {
  58  |     await this.page.click('button[type="submit"]:has-text("Guardar")');
  59  |     // Esperar a que se cierre el diálogo y se muestre la alerta de SweetAlert
  60  |     await this.page.waitForSelector('text=Producto Registrado');
> 61  |     await this.page.click('button:has-text("OK")'); // Confirmar SweetAlert
      |                     ^ Error: page.click: Test timeout of 60000ms exceeded.
  62  |   }
  63  | 
  64  |   async searchProduct(nameOrCode: string) {
  65  |     await this.page.fill('input[placeholder="Buscar por nombre o código..."]', nameOrCode);
  66  |     await this.page.keyboard.press('Enter');
  67  |     await this.page.waitForTimeout(500); // Pequeña espera para que filtre la tabla
  68  |   }
  69  | 
  70  |   async expectProductInTable(code: string, name: string) {
  71  |     const row = this.page.locator(`tr:has-text("${code}")`);
  72  |     await expect(row).toBeVisible();
  73  |     await expect(row).toContainText(name);
  74  |   }
  75  | 
  76  |   async clickEditProduct(code: string) {
  77  |     const row = this.page.locator(`tr:has-text("${code}")`);
  78  |     await row.locator('button[aria-label="Editar producto"]').click();
  79  |     await this.page.waitForSelector('form:has-text("Editar Producto")');
  80  |   }
  81  | 
  82  |   async submitEditForm() {
  83  |     await this.page.click('button[type="submit"]:has-text("Guardar Cambios")');
  84  |     await this.page.waitForSelector('text=Producto Actualizado');
  85  |     await this.page.click('button:has-text("OK")');
  86  |   }
  87  | 
  88  |   async deleteProduct(code: string) {
  89  |     const row = this.page.locator(`tr:has-text("${code}")`);
  90  |     await row.locator('button[aria-label="Eliminar producto"]').click();
  91  |     await this.page.waitForSelector('text=¿Eliminar Producto?');
  92  |     await this.page.click('button:has-text("Sí, eliminar")');
  93  |     await this.page.waitForSelector('text=Producto Eliminado');
  94  |     await this.page.click('button:has-text("OK")');
  95  |   }
  96  | 
  97  |   async quickSell(code: string, qty: string) {
  98  |     const row = this.page.locator(`tr:has-text("${code}")`);
  99  |     await row.locator('button:has-text("Vender")').click();
  100 |     await this.page.waitForSelector('text=Venta Rápida');
  101 |     await this.page.fill('#swal-qty', qty);
  102 |     await this.page.click('button:has-text("Confirmar Venta")');
  103 |     await this.page.waitForSelector('text=Venta Rápida Completada');
  104 |     await this.page.click('button:has-text("OK")');
  105 |   }
  106 | }
  107 | 
```