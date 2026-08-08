# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tenant-isolation.spec.ts >> Aislamiento Multi-Tenant (Seguridad) >> ADMIN A no debe poder duplicar un código de producto dentro de su misma Empresa A
- Location: tests\e2e\tenant-isolation.spec.ts:102:3

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
          - button [ref=f2e126] [cursor=pointer]
          - button [ref=f2e127] [cursor=pointer]
          - button [ref=f2e131] [cursor=pointer]:
            - generic [ref=f2e134]:
              - generic [ref=f2e135]: Admin Empresa A
              - generic [ref=f2e136]: ADMIN
      - main [ref=f2e139]:
        - generic [ref=f2e141]:
          - generic [ref=f2e142]:
            - generic [ref=f2e150]:
              - heading [level=1] [ref=f2e151]: Productos
              - paragraph [ref=f2e152]: Gestiona el catálogo de productos de GNS SarriaTech.
            - button [ref=f2e154] [cursor=pointer]: Nuevo Producto
          - generic [ref=f2e155]:
            - generic [ref=f2e156]:
              - paragraph [ref=f2e158]: Total Productos
              - paragraph [ref=f2e164]: "1"
              - paragraph [ref=f2e165]: en catálogo
            - generic [ref=f2e166]:
              - paragraph [ref=f2e168]: Stock Total
              - paragraph [ref=f2e173]: "20"
              - paragraph [ref=f2e174]: unidades disponibles
            - generic [ref=f2e175]:
              - paragraph [ref=f2e177]: Valor Inventario
              - paragraph [ref=f2e181]: $ 120.000
              - paragraph [ref=f2e182]: precio de venta
            - generic [ref=f2e183]:
              - paragraph [ref=f2e185]: Sin Stock
              - paragraph [ref=f2e190]: "0"
              - paragraph [ref=f2e191]: productos agotados
          - generic [ref=f2e192]:
            - button [ref=f2e193] [cursor=pointer]: Todos
            - button [ref=f2e194] [cursor=pointer]: Para Venta
            - button [ref=f2e195] [cursor=pointer]: Prod. Terminado
            - button [ref=f2e196] [cursor=pointer]: Servicios
            - button [ref=f2e197] [cursor=pointer]: Materia Prima
            - button [ref=f2e198] [cursor=pointer]: Insumos
            - button [ref=f2e199] [cursor=pointer]: Activos Fijos
          - generic [ref=f2e200]:
            - generic [ref=f2e201]:
              - textbox [ref=f2e206]:
                - /placeholder: Buscar por nombre o código...
              - button [ref=f2e207] [cursor=pointer]: Filtros
            - table [ref=f2e209]:
              - rowgroup [ref=f2e210]:
                - row [ref=f2e211]:
                  - columnheader [ref=f2e212] [cursor=pointer]: Código
                  - columnheader [ref=f2e216] [cursor=pointer]: Producto
                  - columnheader [ref=f2e219] [cursor=pointer]: Categoría / Grupo
                  - columnheader [ref=f2e220] [cursor=pointer]: Proveedor
                  - columnheader [ref=f2e221] [cursor=pointer]: Stock
                  - columnheader [ref=f2e225] [cursor=pointer]: Costo
                  - columnheader [ref=f2e229] [cursor=pointer]: Precio
                  - columnheader [ref=f2e233] [cursor=pointer]: Estado
                  - columnheader [ref=f2e234]: Acciones
              - rowgroup [ref=f2e235]:
                - row [ref=f2e236]:
                  - cell [ref=f2e237]:
                    - generic [ref=f2e238]: PROD-COMUN
                  - cell [ref=f2e239]:
                    - paragraph [ref=f2e240]: Producto Comun Empresa A
                  - cell [ref=f2e241]:
                    - paragraph [ref=f2e242]: Categoría Test
                  - cell [ref=f2e243]: Proveedor Test
                  - cell [ref=f2e244]: "20"
                  - cell [ref=f2e245]: $ 3.000
                  - cell [ref=f2e246]: $ 6.000
                  - cell [ref=f2e247]:
                    - generic [ref=f2e248]: Disponible
                  - cell [ref=f2e249]:
                    - generic [ref=f2e250]:
                      - button [ref=f2e251] [cursor=pointer]: Vender
                      - button [ref=f2e256] [cursor=pointer]
                      - button [ref=f2e257] [cursor=pointer]
  - generic [ref=f2e259]:
    - generic [ref=f2e264]:
      - generic [ref=f2e265]:
        - text: Protección de Datos & Cookies
        - generic [ref=f2e266]: Seguro
      - paragraph [ref=f2e270]:
        - text: Utilizamos cookies de sesión esenciales para garantizar el correcto funcionamiento del sistema de inventarios, la seguridad de sus datos y cumplir con las políticas de privacidad de
        - strong [ref=f2e271]: GNS Gestión SarriaTech
        - text: .
    - generic [ref=f2e272]:
      - button [ref=f2e273] [cursor=pointer]: Leer Políticas de Privacidad
      - button [ref=f2e277] [cursor=pointer]: Aceptar y Continuar
  - alert [ref=f2e281]
  - dialog [ref=f2e285]:
    - heading [level=2] [ref=f2e287]: Registrar Producto
    - generic [ref=f2e289]:
      - generic [ref=f2e290]:
        - generic [ref=f2e291]:
          - text: Tipo de Producto
          - combobox [ref=f2e292]
        - generic [ref=f2e293]:
          - text: Código
          - textbox [ref=f2e294]:
            - /placeholder: Ej. LIP-001
            - text: PROD-COMUN
        - generic [ref=f2e295]:
          - text: Nombre
          - textbox [ref=f2e296]:
            - /placeholder: Nombre del producto
            - text: Duplicado de Comun
        - generic [ref=f2e297]:
          - text: Grupo de Producto
          - combobox [ref=f2e298]
        - generic [ref=f2e299]:
          - text: Categoría
          - combobox [ref=f2e300]
        - generic [ref=f2e301]:
          - text: Proveedor
          - combobox [ref=f2e302]
        - generic [ref=f2e303]:
          - text: Cantidad Disponible
          - spinbutton [ref=f2e304]: "5"
        - generic [ref=f2e305]:
          - text: Costo Unitario (COP)
          - spinbutton [ref=f2e306]: "2000"
        - generic [ref=f2e307]:
          - text: Precio de Venta (COP)
          - spinbutton [ref=f2e308]: "4000"
      - generic [ref=f2e309]:
        - button [ref=f2e310] [cursor=pointer]: Cancelar
        - button [ref=f2e311] [cursor=pointer]: Guardar Producto
    - button [ref=f2e312] [cursor=pointer]:
      - generic [ref=f2e313]: Close
  - dialog [ref=f2e316]:
    - heading "Error al Registrar" [level=2] [ref=f2e321]
    - generic [ref=f2e322]: Ya existe un producto con el mismo código
    - text: "!"
    - button "Entendido" [active] [ref=f2e324] [cursor=pointer]
```

# Test source

```ts
  26  |         code: 'SEC-B-999',
  27  |         name: 'Producto Secreto Empresa B',
  28  |         quantityAvailable: 15,
  29  |         unitCost: 5000,
  30  |         salePrice: 10000,
  31  |         status: 'AVAILABLE',
  32  |         type: 'SALE',
  33  |         companyId: companyBId,
  34  |         categoryId: data.defaultCategoryB.id,
  35  |         supplierId: data.defaultSupplierB.id,
  36  |       }
  37  |     });
  38  | 
  39  |     // Crear un producto de Empresa A para validar colisión
  40  |     await prisma.product.create({
  41  |       data: {
  42  |         code: 'PROD-COMUN',
  43  |         name: 'Producto Comun Empresa A',
  44  |         quantityAvailable: 20,
  45  |         unitCost: 3000,
  46  |         salePrice: 6000,
  47  |         status: 'AVAILABLE',
  48  |         type: 'SALE',
  49  |         companyId: companyAId,
  50  |         categoryId: categoryAId,
  51  |         supplierId: supplierAId,
  52  |       }
  53  |     });
  54  |   });
  55  | 
  56  |   test.beforeEach(async () => {
  57  |     // Asegurar limpieza de sesión antes de cada prueba
  58  |   });
  59  | 
  60  |   test('ADMIN A no debe ver productos pertenecientes a la Empresa B', async ({ page }) => {
  61  |     const loginPage = new LoginPage(page);
  62  |     await loginPage.goto();
  63  |     await loginPage.login('adminA@gns-test.com', 'Admin123');
  64  | 
  65  |     const productPage = new ProductPage(page);
  66  |     await productPage.goto();
  67  | 
  68  |     // Intentar buscar el producto secreto de Empresa B
  69  |     await productPage.searchProduct('SEC-B-999');
  70  | 
  71  |     // Comprobar que no aparece en la tabla
  72  |     const row = page.locator('tr:has-text("SEC-B-999")');
  73  |     await expect(row).not.toBeVisible();
  74  |   });
  75  | 
  76  |   test('ADMIN A debe poder crear un producto con el mismo código que uno de Empresa B (Aislamiento de Restricciones)', async ({ page }) => {
  77  |     const loginPage = new LoginPage(page);
  78  |     await loginPage.goto();
  79  |     await loginPage.login('adminA@gns-test.com', 'Admin123');
  80  | 
  81  |     const productPage = new ProductPage(page);
  82  |     await productPage.goto();
  83  | 
  84  |     // Intentar crear un producto en Empresa A con el código 'SEC-B-999'
  85  |     await productPage.clickNewProduct();
  86  |     await productPage.fillForm({
  87  |       code: 'SEC-B-999', // Código que pertenece a Empresa B
  88  |       name: 'Mi version de SEC-B-999',
  89  |       categoryId: String(categoryAId),
  90  |       supplierId: String(supplierAId),
  91  |       qty: '10',
  92  |       cost: '4000',
  93  |       price: '8000',
  94  |     });
  95  |     await productPage.submitForm();
  96  | 
  97  |     // Verificar que se creó correctamente en Empresa A sin error de código duplicado
  98  |     await productPage.searchProduct('SEC-B-999');
  99  |     await productPage.expectProductInTable('SEC-B-999', 'Mi version de SEC-B-999');
  100 |   });
  101 | 
  102 |   test('ADMIN A no debe poder duplicar un código de producto dentro de su misma Empresa A', async ({ page }) => {
  103 |     const loginPage = new LoginPage(page);
  104 |     await loginPage.goto();
  105 |     await loginPage.login('adminA@gns-test.com', 'Admin123');
  106 | 
  107 |     const productPage = new ProductPage(page);
  108 |     await productPage.goto();
  109 | 
  110 |     // Intentar crear un producto con código ya existente en Empresa A ('PROD-COMUN')
  111 |     await productPage.clickNewProduct();
  112 |     await productPage.fillForm({
  113 |       code: 'PROD-COMUN', // Código duplicado en Empresa A
  114 |       name: 'Duplicado de Comun',
  115 |       categoryId: String(categoryAId),
  116 |       supplierId: String(supplierAId),
  117 |       qty: '5',
  118 |       cost: '2000',
  119 |       price: '4000',
  120 |     });
  121 |     
  122 |     // Guardar formulario
  123 |     await page.click('button[type="submit"]:has-text("Guardar")');
  124 |     // Esperar mensaje de error
  125 |     await expect(page.locator('text=Ya existe un producto con el mismo código')).toBeVisible();
> 126 |     await page.click('button:has-text("OK")');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  127 |   });
  128 | });
  129 | 
```