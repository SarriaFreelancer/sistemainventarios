# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notifications.spec.ts >> Módulo de Notificaciones y Campanita >> Debe generar una notificación al registrar una venta PENDING y limpiarla al completarse
- Location: tests\e2e\notifications.spec.ts:22:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('text=¡Venta Registrada!') to be visible

```

# Page snapshot

```yaml
- generic [ref=f2e1]:
  - generic [ref=f2e3]:
    - complementary [ref=f2e4]:
      - generic [ref=f2e8]:
        - generic [ref=f2e9]: GNS SARRIATECH
        - generic [ref=f2e10]: GESTIÓN DE NEGOCIOS
      - navigation [ref=f2e11]:
        - link [ref=f2e12] [cursor=pointer]:
          - /url: /dashboard
          - generic [ref=f2e18]: Dashboard
        - link [ref=f2e19] [cursor=pointer]:
          - /url: /dashboard/products
          - generic [ref=f2e30]: Productos
        - link [ref=f2e31] [cursor=pointer]:
          - /url: /dashboard/groups
          - generic [ref=f2e34]: Grupos
        - link [ref=f2e35] [cursor=pointer]:
          - /url: /dashboard/categories
          - generic [ref=f2e40]: Categorías
        - link [ref=f2e41] [cursor=pointer]:
          - /url: /dashboard/suppliers
          - generic [ref=f2e44]: Proveedores
        - link [ref=f2e45] [cursor=pointer]:
          - /url: /dashboard/sales
          - generic [ref=f2e50]: Ventas
        - link [ref=f2e51] [cursor=pointer]:
          - /url: /dashboard/crm
          - generic [ref=f2e57]: CRM
        - link [ref=f2e58] [cursor=pointer]:
          - /url: /dashboard/compras
          - generic [ref=f2e64]: Compras
        - link [ref=f2e65] [cursor=pointer]:
          - /url: /dashboard/finanzas
          - generic [ref=f2e68]: Finanzas
        - link [ref=f2e69] [cursor=pointer]:
          - /url: /dashboard/rrhh
          - generic [ref=f2e75]: RRHH
        - link [ref=f2e76] [cursor=pointer]:
          - /url: /dashboard/reportes
          - generic [ref=f2e80]: Reportes
        - link [ref=f2e81] [cursor=pointer]:
          - /url: /dashboard/audit
          - generic [ref=f2e84]: Auditoría
        - link [ref=f2e85] [cursor=pointer]:
          - /url: /dashboard/settings
          - generic [ref=f2e89]: Configuración
      - generic [ref=f2e90]:
        - generic [ref=f2e91]:
          - generic [ref=f2e95]:
            - paragraph [ref=f2e96]: Admin Empresa A
            - generic [ref=f2e97]: Administrador
          - button [ref=f2e102] [cursor=pointer]
        - button [ref=f2e106] [cursor=pointer]:
          - generic [ref=f2e110]: Colapsar Menú
    - generic [ref=f2e111]:
      - banner [ref=f2e112]:
        - generic [ref=f2e120]:
          - paragraph [ref=f2e121]:
            - generic [ref=f2e122]: "EMPRESA:"
            - generic [ref=f2e123]: EMPRESA A TEST
          - heading [level=2] [ref=f2e124]: ERP Administrador
        - generic [ref=f2e125]:
          - button [ref=f2e126] [cursor=pointer]:
            - generic [ref=f2e127]: "1"
          - button [ref=f2e130] [cursor=pointer]
          - button [ref=f2e134] [cursor=pointer]:
            - generic [ref=f2e137]:
              - generic [ref=f2e138]: Admin Empresa A
              - generic [ref=f2e139]: ADMIN
      - main [ref=f2e142]:
        - generic [ref=f2e144]:
          - generic [ref=f2e145]:
            - generic [ref=f2e152]:
              - heading [level=1] [ref=f2e153]: Ventas
              - paragraph [ref=f2e154]: Registra y monitorea todas las ventas de tu negocio.
            - generic [ref=f2e155]:
              - button [disabled]: Exportar Excel
              - button [ref=f2e156] [cursor=pointer]: Nueva Venta
          - generic [ref=f2e157]:
            - generic [ref=f2e158]:
              - paragraph [ref=f2e160]: Total Registros
              - paragraph [ref=f2e165]: "0"
              - paragraph [ref=f2e166]: transacciones
            - generic [ref=f2e167]:
              - paragraph [ref=f2e169]: Ingresos Netos
              - paragraph [ref=f2e173]: $ 0
              - paragraph [ref=f2e174]: Ventas Completadas
            - generic [ref=f2e175]:
              - paragraph [ref=f2e177]: Ventas Pendientes
              - paragraph [ref=f2e181]: "0"
              - paragraph [ref=f2e182]: reservas de stock
            - generic [ref=f2e183]:
              - paragraph [ref=f2e185]: Hoy
              - paragraph [ref=f2e190]: "0"
              - paragraph [ref=f2e191]: ventas hoy
          - generic [ref=f2e192]:
            - generic [ref=f2e193]:
              - textbox [ref=f2e198]:
                - /placeholder: Buscar por N° venta o cliente...
              - generic [ref=f2e199]:
                - combobox [ref=f2e200]
                - combobox [ref=f2e201]
            - paragraph [ref=f2e208]: No hay ventas registradas
  - generic [ref=f2e210]:
    - generic [ref=f2e215]:
      - generic [ref=f2e216]:
        - text: Protección de Datos & Cookies
        - generic [ref=f2e217]: Seguro
      - paragraph [ref=f2e221]:
        - text: Utilizamos cookies de sesión esenciales para garantizar el correcto funcionamiento del sistema de inventarios, la seguridad de sus datos y cumplir con las políticas de privacidad de
        - strong [ref=f2e222]: GNS Gestión SarriaTech
        - text: .
    - generic [ref=f2e223]:
      - button [ref=f2e224] [cursor=pointer]: Leer Políticas de Privacidad
      - button [ref=f2e228] [cursor=pointer]: Aceptar y Continuar
  - alert [ref=f2e232]
  - dialog [ref=f2e236]:
    - generic [ref=f2e237]:
      - heading [level=2] [ref=f2e238]: Registrar Nueva Venta
      - paragraph [ref=f2e240]: Busca productos, ajusta cantidades y descuentos, luego confirma la venta.
    - generic [ref=f2e241]:
      - generic [ref=f2e242]:
        - generic [ref=f2e243]:
          - text: Buscar y Agregar Productos
          - textbox [ref=f2e248]:
            - /placeholder: Escribe código o nombre del producto...
        - generic [ref=f2e249]:
          - generic [ref=f2e251]: Producto
          - generic [ref=f2e252]: Cantidad
          - generic [ref=f2e253]: Descuento
          - generic [ref=f2e254]: Subtotal
        - generic [ref=f2e258]:
          - checkbox [ref=f2e259]
          - generic [ref=f2e260]:
            - paragraph [ref=f2e261]: Producto Venta Pendiente
            - paragraph [ref=f2e262]: $ 2.000 c/u
          - generic [ref=f2e263]:
            - button [ref=f2e264] [cursor=pointer]: −
            - spinbutton [ref=f2e265]: "1"
            - button [ref=f2e266] [cursor=pointer]: +
          - spinbutton [ref=f2e267]
          - paragraph [ref=f2e268]: $ 2.000
          - button [ref=f2e269] [cursor=pointer]
      - generic [ref=f2e273]:
        - generic [ref=f2e274]:
          - generic [ref=f2e275]:
            - generic [ref=f2e276]:
              - text: Asociar Cliente CRM (Opcional)
              - combobox [ref=f2e277]
            - generic [ref=f2e278]:
              - text: Cliente (Nombre / Venta Rápida)
              - textbox [ref=f2e279]:
                - /placeholder: Nombre del cliente...
                - text: Cliente Pendiente E2E
          - generic [ref=f2e280]:
            - generic [ref=f2e281]:
              - text: Estado de Venta
              - combobox [ref=f2e282]
            - generic [ref=f2e283]:
              - text: Método de Pago
              - combobox [ref=f2e284]
          - generic [ref=f2e285]:
            - generic [ref=f2e286]:
              - text: Descuento Global ($)
              - spinbutton [ref=f2e287]
            - generic [ref=f2e288]:
              - text: Observaciones
              - textbox [ref=f2e289]:
                - /placeholder: Notas internas...
                - text: Reservado a crédito
          - paragraph [ref=f2e290]: 💡 Selecciona ítems del carrito con el checkbox para aplicar descuentos por selección.
        - generic [ref=f2e291]:
          - generic [ref=f2e292]:
            - generic [ref=f2e293]:
              - generic [ref=f2e294]: Subtotal
              - generic [ref=f2e295]: $ 2.000
            - generic [ref=f2e296]:
              - generic [ref=f2e297]: Total
              - generic [ref=f2e298]: $ 2.000
          - button [disabled]: Aplicar Descuento a Selección (0)
          - generic [ref=f2e299]:
            - button [ref=f2e300] [cursor=pointer]: Cancelar
            - button [ref=f2e301] [cursor=pointer]: ✓ Crear Venta
    - button [ref=f2e302] [cursor=pointer]:
      - generic [ref=f2e303]: Close
  - dialog [ref=f2e306]:
    - heading "Confirmar Venta" [level=2] [ref=f2e307]
    - generic [ref=f2e309]:
      - generic [ref=f2e310]:
        - paragraph [ref=f2e311]:
          - text: "Cliente:"
          - strong [ref=f2e312]: Cliente Pendiente E2E
        - paragraph [ref=f2e313]:
          - text: "Pago:"
          - strong [ref=f2e314]: EFECTIVO
        - paragraph [ref=f2e315]:
          - text: "Estado:"
          - strong [ref=f2e316]: Completada
      - generic [ref=f2e318]:
        - generic [ref=f2e319]:
          - paragraph [ref=f2e320]: Producto Venta Pendiente
          - paragraph [ref=f2e321]: 1 u. x $ 2.000
        - paragraph [ref=f2e323]: $ 2.000
      - generic [ref=f2e324]:
        - generic [ref=f2e325]:
          - generic [ref=f2e326]: Subtotal Productos
          - generic [ref=f2e327]: $ 2.000
        - generic [ref=f2e328]:
          - generic [ref=f2e329]: Total Facturado
          - generic [ref=f2e330]: $ 2.000
    - text: "!"
    - generic [ref=f2e331]:
      - button "Confirmar Registro" [active] [ref=f2e332] [cursor=pointer]
      - button "Revisar" [ref=f2e333] [cursor=pointer]
```

# Test source

```ts
  1  | import { Page, expect } from '@playwright/test';
  2  | 
  3  | export class SalePage {
  4  |   private readonly page: Page;
  5  | 
  6  |   constructor(page: Page) {
  7  |     this.page = page;
  8  |   }
  9  | 
  10 |   async goto() {
  11 |     await this.page.goto('/dashboard/sales');
  12 |     await this.page.waitForLoadState('networkidle');
  13 |   }
  14 | 
  15 |   async clickNewSale() {
  16 |     await this.page.click('button:has-text("Nueva Venta")');
  17 |     await this.page.waitForSelector('text=Registrar Nueva Venta');
  18 |   }
  19 | 
  20 |   async addProductToCart(searchQuery: string, code: string) {
  21 |     await this.page.fill('input[placeholder="Escribe código o nombre del producto..."]', searchQuery);
  22 |     // Esperar a que se despliegue la lista y hacer clic en el botón del producto
  23 |     const productButton = this.page.locator(`button:has-text("${code}")`);
  24 |     await productButton.click();
  25 |   }
  26 | 
  27 |   async fillSaleDetails(data: {
  28 |     client?: string;
  29 |     status?: 'COMPLETED' | 'PENDING';
  30 |     paymentMethod?: string;
  31 |     remarks?: string;
  32 |   }) {
  33 |     if (data.client) {
  34 |       await this.page.fill('input[placeholder="Nombre del cliente..."]', data.client);
  35 |     }
  36 |     if (data.status) {
  37 |       await this.page.selectOption('select:has-text("Completada")', data.status);
  38 |     }
  39 |     if (data.paymentMethod) {
  40 |       await this.page.selectOption('select:has-text("EFECTIVO")', data.paymentMethod);
  41 |     }
  42 |     if (data.remarks) {
  43 |       await this.page.fill('input[placeholder="Notas internas..."]', data.remarks);
  44 |     }
  45 |   }
  46 | 
  47 |   async submitSale() {
  48 |     await this.page.click('button:has-text("✓ Crear Venta")');
  49 |     // Esperar a que se procese y muestre SweetAlert de éxito
> 50 |     await this.page.waitForSelector('text=¡Venta Registrada!');
     |                     ^ Error: page.waitForSelector: Test timeout of 60000ms exceeded.
  51 |     await this.page.click('button:has-text("OK")');
  52 |   }
  53 | 
  54 |   async expectSaleInTable(saleNumberSearch: string, clientName: string) {
  55 |     // Buscar la venta en el listado
  56 |     await this.page.fill('input[placeholder="Buscar por factura, cliente..."]', saleNumberSearch);
  57 |     await this.page.keyboard.press('Enter');
  58 |     await this.page.waitForTimeout(500);
  59 | 
  60 |     const row = this.page.locator(`tr:has-text("${clientName}")`);
  61 |     await expect(row).toBeVisible();
  62 |   }
  63 | 
  64 |   async voidSale(saleNumberSearch: string) {
  65 |     await this.page.fill('input[placeholder="Buscar por N° venta o cliente..."]', saleNumberSearch);
  66 |     await this.page.keyboard.press('Enter');
  67 |     await this.page.waitForTimeout(500);
  68 | 
  69 |     const row = this.page.locator(`tr:has-text("${saleNumberSearch}")`);
  70 |     await row.locator('button[title="Anular venta"]').click();
  71 | 
  72 |     await this.page.waitForSelector('text=¿Anular Venta?');
  73 |     await this.page.fill('.swal2-input', 'Test Void E2E');
  74 |     await this.page.click('button:has-text("Confirmar Anulación")');
  75 |     await this.page.waitForSelector('text=Venta Anulada');
  76 |     await this.page.click('button:has-text("OK")');
  77 |   }
  78 | 
  79 |   async completePendingSale(saleNumberSearch: string) {
  80 |     await this.page.fill('input[placeholder="Buscar por N° venta o cliente..."]', saleNumberSearch);
  81 |     await this.page.keyboard.press('Enter');
  82 |     await this.page.waitForTimeout(500);
  83 | 
  84 |     const row = this.page.locator(`tr:has-text("${saleNumberSearch}")`);
  85 |     await row.locator('button[title="Completar Venta"]').click();
  86 | 
  87 |     await this.page.waitForSelector('text=Completar Venta Pendiente');
  88 |     await this.page.click('button:has-text("✓ Completar Venta")');
  89 |     await this.page.waitForSelector('text=Venta Completada');
  90 |     await this.page.click('button:has-text("OK")');
  91 |   }
  92 | }
  93 | 
```