# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: notifications.spec.ts >> Módulo de Notificaciones y Campanita >> La opción de Limpiar Todo debe ocultar las alertas de la sesión actual sin volver a mostrarlas hasta nuevo login
- Location: tests\e2e\notifications.spec.ts:80:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Limpiar todo")')
    - locator resolved to <button tabindex="0" type="button" data-slot="button" class="group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all duration-300 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px active:scale-[0.98] hover:scale-[1.01] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-de…>…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <path d="M1280,0L0,0L0,720L1280,720L1280,0Z↵    M283,-10 h1002 a5,5 0 0 1 5,5 v89 a5,5 0 0 1 -5,5 h-1002 a5,5 0 0 1 -5,-5 v-89 a5,5 0 0 1 5,-5 z"></path> from <svg version="1.1" aria-hidden="true" xmlSpace="preserve" viewBox="0 0 1280 720" data-aria-hidden="true" preserveAspectRatio="xMinYMin slice" xmlnsXlink="http://www.w3.org/1999/xlink" class="driver-overlay driver-overlay-animated">…</svg> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <path d="M1280,0L0,0L0,720L1280,720L1280,0Z↵    M283,-10 h1002 a5,5 0 0 1 5,5 v89 a5,5 0 0 1 -5,5 h-1002 a5,5 0 0 1 -5,-5 v-89 a5,5 0 0 1 5,-5 z"></path> from <svg version="1.1" aria-hidden="true" xmlSpace="preserve" viewBox="0 0 1280 720" data-aria-hidden="true" preserveAspectRatio="xMinYMin slice" xmlnsXlink="http://www.w3.org/1999/xlink" class="driver-overlay driver-overlay-animated">…</svg> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    90 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <path d="M1280,0L0,0L0,720L1280,720L1280,0Z↵    M283,-10 h1002 a5,5 0 0 1 5,5 v89 a5,5 0 0 1 -5,5 h-1002 a5,5 0 0 1 -5,-5 v-89 a5,5 0 0 1 5,-5 z"></path> from <svg version="1.1" aria-hidden="true" xmlSpace="preserve" viewBox="0 0 1280 720" data-aria-hidden="true" preserveAspectRatio="xMinYMin slice" xmlnsXlink="http://www.w3.org/1999/xlink" class="driver-overlay driver-overlay-animated">…</svg> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - complementary:
        - generic:
          - generic:
            - generic: GNS SARRIATECH
            - generic: GESTIÓN DE NEGOCIOS
        - navigation:
          - link:
            - /url: /dashboard
            - generic: Dashboard
          - link:
            - /url: /dashboard/products
            - generic: Productos
          - link:
            - /url: /dashboard/groups
            - generic: Grupos
          - link:
            - /url: /dashboard/categories
            - generic: Categorías
          - link:
            - /url: /dashboard/suppliers
            - generic: Proveedores
          - link:
            - /url: /dashboard/sales
            - generic: Ventas
          - link:
            - /url: /dashboard/crm
            - generic: CRM
          - link:
            - /url: /dashboard/compras
            - generic: Compras
          - link:
            - /url: /dashboard/finanzas
            - generic: Finanzas
          - link:
            - /url: /dashboard/rrhh
            - generic: RRHH
          - link:
            - /url: /dashboard/reportes
            - generic: Reportes
          - link:
            - /url: /dashboard/audit
            - generic: Auditoría
          - link:
            - /url: /dashboard/settings
            - generic: Configuración
        - generic:
          - generic:
            - generic:
              - generic:
                - paragraph: Admin Empresa A
                - generic: Administrador
            - button
          - button:
            - generic: Colapsar Menú
      - generic:
        - banner [ref=f1e1]:
          - generic [ref=f1e9]:
            - paragraph [ref=f1e10]:
              - generic [ref=f1e11]: "EMPRESA:"
              - generic [ref=f1e12]: EMPRESA A TEST
            - heading [level=2] [ref=f1e13]: ERP Administrador
          - generic [ref=f1e14]:
            - button [expanded] [ref=f1e15] [cursor=pointer]:
              - generic [ref=f1e19]: "1"
            - button [ref=f1e22] [cursor=pointer]
            - button [ref=f1e26] [cursor=pointer]:
              - generic [ref=f1e29]:
                - generic [ref=f1e30]: Admin Empresa A
                - generic [ref=f1e31]: ADMIN
        - main:
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic: GNS Gestión de Negocios
                  - heading [level=1]: Bienvenido al Sistema de Gestión
                  - paragraph: Supervisa las ventas, existencias e inventario filtrando por cualquier fecha o período.
                - generic:
                  - generic:
                    - generic:
                      - paragraph: Período Seleccionado
                      - paragraph: Histórico General (Todo el tiempo)
                  - button:
                    - generic: Restablecer
              - generic:
                - generic:
                  - paragraph: "Filtrar Gráficos e Información por Fecha:"
                - generic:
                  - button: Todo el Histórico
                  - button: Hoy
                  - button: Ayer
                  - button: Últimos 7 Días
                  - button: Últimos 30 Días
                  - button: Este Mes
                  - button: Mes Anterior
                  - button: Rango / Fecha Específica
            - generic:
              - generic:
                - generic:
                  - paragraph: Productos Catálogo
                - generic:
                  - paragraph: "1"
                  - paragraph:
                    - text: Organizados en
                    - generic: 1 categorías
              - generic:
                - generic:
                  - paragraph: Proveedores
                - generic:
                  - paragraph: "1"
                  - paragraph: Contactos comerciales registrados
              - generic:
                - generic:
                  - paragraph: Ventas en el Período
                - generic:
                  - paragraph: $ 0
                  - paragraph:
                    - text: En
                    - generic: 0 facturaciones
                    - text: (Histórico)
              - generic:
                - generic:
                  - paragraph: Productos sin Existencias
                - generic:
                  - paragraph: "1"
                  - paragraph: Requieren reabastecimiento urgente
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - heading [level=3]: Tendencia de Ventas (Últimos Meses)
                      - paragraph: Ingresos vs. Costos de ventas en pesos colombianos
                    - generic: "Margen Promedio: 0.0%"
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - list:
                              - listitem: Costos
                              - listitem: Ingresos
                          - application:
                            - generic:
                              - generic:
                                - generic: Mar 26
                                - generic: Abr 26
                                - generic: May 26
                                - generic: Jun 26
                                - generic: Jul 26
                                - generic: Ago 26
                              - generic:
                                - generic: "0"
                                - generic: "1"
                                - generic: "2"
                                - generic: "3"
                                - generic: "4"
                - generic:
                  - generic:
                    - heading [level=3]: Grupos de Productos
                    - paragraph: Distribución del catálogo actual por línea de producto
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - application
                    - generic: Grupo Test (0)
                - generic:
                  - generic:
                    - heading [level=3]: Top 5 Productos más Vendidos
                    - paragraph: Productos de mayor rotación según volumen vendido
                  - generic: Aún no hay registros de ventas.
            - generic:
              - generic:
                - generic:
                  - heading [level=3]: Alertas de Stock
                  - generic: Estado Crítico
                - generic:
                  - generic:
                    - paragraph: Agotados (1)
                    - generic:
                      - generic:
                        - generic:
                          - generic: PROD-OUT-888
                          - generic: Producto Agotado Test
                        - generic: 0 unidades
                  - generic:
                    - paragraph: Existencias Bajas (1 a 10 u.)
                    - paragraph: No hay productos con existencias críticamente bajas.
              - generic:
                - generic:
                  - heading [level=3]: Ventas Registradas en el Período
                  - link:
                    - /url: /dashboard/sales
                    - text: Ver Todas
                - generic:
                  - paragraph: No se registraron ventas en la fecha/período seleccionado.
  - generic:
    - generic:
      - generic:
        - generic:
          - generic:
            - text: Protección de Datos & Cookies
            - generic: Seguro
          - paragraph:
            - text: Utilizamos cookies de sesión esenciales para garantizar el correcto funcionamiento del sistema de inventarios, la seguridad de sus datos y cumplir con las políticas de privacidad de
            - strong: GNS Gestión SarriaTech
            - text: .
      - generic:
        - button: Leer Políticas de Privacidad
        - button: Aceptar y Continuar
  - region "Notifications alt+T"
  - alert
  - generic: "0"
  - dialog [ref=f1e34]:
    - button [ref=f1e35] [cursor=pointer]: ×
    - banner [ref=f1e37]: ¡Bienvenido a tu ERP!
    - generic [ref=f1e38]: Este es el panel principal de control. Desde aquí tendrás acceso rápido a toda la plataforma.
    - contentinfo [ref=f1e39]:
      - generic [ref=f1e40]: 1 of 9
      - generic [ref=f1e41]:
        - button [disabled]: ← Atrás
        - button [ref=f1e42] [cursor=pointer]: Siguiente →
  - menu "Notificaciones" [active] [ref=f1e44]:
    - generic:
      - generic:
        - heading "Notificaciones" [level=3]
        - paragraph: 1 recientes
      - button "Limpiar todo"
    - generic:
      - generic:
        - generic:
          - paragraph: ⚠️ Stock Agotado
          - paragraph: "El producto \"Producto Agotado Test\" no tiene unidades disponibles (Stock: 0)."
          - generic:
            - paragraph: hace 1 minuto
            - generic: Ir al módulo
        - button "Eliminar notificación"
```

# Test source

```ts
  8   | 
  9   | test.describe('Módulo de Notificaciones y Campanita', () => {
  10  |   let companyAId: number;
  11  |   let categoryAId: number;
  12  |   let supplierAId: number;
  13  | 
  14  |   test.beforeAll(async () => {
  15  |     await clearDatabase();
  16  |     const data = await seedDatabase();
  17  |     companyAId = data.companyA.id;
  18  |     categoryAId = data.defaultCategory.id;
  19  |     supplierAId = data.defaultSupplier.id;
  20  |   });
  21  | 
  22  |   test('Debe generar una notificación al registrar una venta PENDING y limpiarla al completarse', async ({ page }) => {
  23  |     const loginPage = new LoginPage(page);
  24  |     await loginPage.goto();
  25  |     await loginPage.login('adminA@gns-test.com', 'Admin123');
  26  | 
  27  |     // 1. Crear producto para vender
  28  |     await prisma.product.create({
  29  |       data: {
  30  |         code: 'PROD-PEND-001',
  31  |         name: 'Producto Venta Pendiente',
  32  |         quantityAvailable: 10,
  33  |         unitCost: 1000,
  34  |         salePrice: 2000,
  35  |         status: 'AVAILABLE',
  36  |         type: 'SALE',
  37  |         companyId: companyAId,
  38  |         categoryId: categoryAId,
  39  |         supplierId: supplierAId
  40  |       }
  41  |     });
  42  | 
  43  |     // 2. Registrar venta PENDING
  44  |     const salePage = new SalePage(page);
  45  |     await salePage.goto();
  46  |     await salePage.clickNewSale();
  47  |     await salePage.addProductToCart('PROD-PEND-001', 'PROD-PEND-001');
  48  |     await salePage.fillSaleDetails({
  49  |       client: 'Cliente Pendiente E2E',
  50  |       status: 'PENDING',
  51  |       paymentMethod: 'TRANSFERENCIA',
  52  |       remarks: 'Reservado a crédito'
  53  |     });
  54  |     await salePage.submitSale();
  55  | 
  56  |     // Buscar el número de venta registrado para seguimiento
  57  |     const salesTable = page.locator('table tbody tr').first();
  58  |     const saleNumberText = await salesTable.locator('td').first().innerText();
  59  | 
  60  |     // 3. Comprobar que aparece una alerta en la campanita
  61  |     await page.waitForTimeout(6000); // Esperar polling de 5s
  62  |     const bellButton = page.locator('button[aria-label="Notificaciones"]');
  63  |     await expect(bellButton.locator('span.bg-destructive').first()).toBeVisible();
  64  | 
  65  |     await bellButton.click();
  66  |     await expect(page.locator(`text=${saleNumberText}`)).toBeVisible();
  67  |     await expect(page.locator('text=Cobro Pendiente')).toBeVisible();
  68  | 
  69  |     // Cerrar dropdown
  70  |     await page.click('h1');
  71  | 
  72  |     // 4. Completar el pago de la venta pendiente
  73  |     await salePage.completePendingSale(saleNumberText);
  74  | 
  75  |     // 5. Verificar que la notificación de cobro pendiente desaparece automáticamente
  76  |     await page.waitForTimeout(6000); // Esperar polling
  77  |     await expect(bellButton.locator('span.bg-destructive').first()).not.toBeVisible();
  78  |   });
  79  | 
  80  |   test('La opción de Limpiar Todo debe ocultar las alertas de la sesión actual sin volver a mostrarlas hasta nuevo login', async ({ page }) => {
  81  |     // 1. Crear otro producto con stock agotado para forzar una notificación
  82  |     await prisma.product.create({
  83  |       data: {
  84  |         code: 'PROD-OUT-888',
  85  |         name: 'Producto Agotado Test',
  86  |         quantityAvailable: 0,
  87  |         unitCost: 1500,
  88  |         salePrice: 3000,
  89  |         status: 'OUT_OF_STOCK',
  90  |         type: 'SALE',
  91  |         companyId: companyAId,
  92  |         categoryId: categoryAId,
  93  |         supplierId: supplierAId
  94  |       }
  95  |     });
  96  | 
  97  |     const loginPage = new LoginPage(page);
  98  |     await loginPage.goto();
  99  |     await loginPage.login('adminA@gns-test.com', 'Admin123');
  100 | 
  101 |     // Esperar a que la notificación de stock agotado sea detectada y mostrada
  102 |     await page.waitForTimeout(6000);
  103 |     const bellButton = page.locator('button[aria-label="Notificaciones"]');
  104 |     await expect(bellButton.locator('span.bg-destructive').first()).toBeVisible();
  105 | 
  106 |     // 2. Limpiar todo
  107 |     await bellButton.click();
> 108 |     await page.click('button:has-text("Limpiar todo")');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  109 |     
  110 |     // La campana debe vaciarse inmediatamente y ocultar el badge rojo
  111 |     await expect(bellButton.locator('span.bg-destructive').first()).not.toBeVisible();
  112 | 
  113 |     // 3. Comprobar que en la sesión actual, tras refrescar, la notificación sigue sin aparecer
  114 |     await page.reload();
  115 |     await page.waitForTimeout(6000); // Polling adicional
  116 |     await expect(bellButton.locator('span.bg-destructive').first()).not.toBeVisible();
  117 | 
  118 |     // 4. Cerrar sesión e iniciar una nueva sesión (login). La alerta debe volver a aparecer porque es una nueva sesión
  119 |     await page.click('#tour-profile-menu');
  120 |     await page.click('button:has-text("Cerrar Sesión")');
  121 |     await page.click('button:has-text("Sí, salir")');
  122 |     
  123 |     await loginPage.goto();
  124 |     await loginPage.login('adminA@gns-test.com', 'Admin123');
  125 | 
  126 |     await page.waitForTimeout(6000); // Polling inicial
  127 |     await expect(bellButton.locator('span.bg-destructive').first()).toBeVisible();
  128 |   });
  129 | });
  130 | 
```