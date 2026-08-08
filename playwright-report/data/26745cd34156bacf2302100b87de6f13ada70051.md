# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: finance.spec.ts >> Módulo de Finanzas - Conciliación Matemática >> Debe calcular matemáticamente y mostrar los KPIs correctos en el panel de Finanzas
- Location: tests\e2e\finance.spec.ts:158:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('div:has-text("Ingresos Totales")').first()
Expected substring: "250.000"
Received string:    "GNS SARRIATECHGESTIÓN DE NEGOCIOSDashboardProductosGruposCategoríasProveedoresVentasCRMComprasFinanzasRRHHReportesAuditoríaConfiguraciónAdmin Empresa AAdministradorColapsar MenúEMPRESA:EMPRESA A TESTERP Administrador3Admin Empresa AADMINEstado FinancieroAnálisis detallado de costos, ingresos y rentabilidad.Ingresos Totales$ 330.000Ventas brutas registradas.Costo de Ventas$ 160.000Costo de los productos ya vendidos.Gastos Operativos$ 50.000Servicios, nóminas, etc.Ganancia Neta$ 120.000Rentabilidad Real (Ingresos - Costos - Gastos)Valorización de InventarioCapital invertido en stock actualMateria PrimaInsumos para producción$ 0Mercancía para VentaProductos terminados y comerciales$ 1.350.000Total Inmovilizado$ 1.350.000Gastos RecientesÚltimos egresos registradosServicios InternetUTILITIES8/8/2026-$ 20.000Papeleria OficinaOTHER8/8/2026-$ 30.000"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('div:has-text("Ingresos Totales")').first()
    14 × locator resolved to <div class="h-screen w-screen flex flex-col bg-background text-foreground transition-colors duration-500 font-sans overflow-hidden">…</div>
       - unexpected value "GNS SARRIATECHGESTIÓN DE NEGOCIOSDashboardProductosGruposCategoríasProveedoresVentasCRMComprasFinanzasRRHHReportesAuditoríaConfiguraciónAdmin Empresa AAdministradorColapsar MenúEMPRESA:EMPRESA A TESTERP Administrador3Admin Empresa AADMINEstado FinancieroAnálisis detallado de costos, ingresos y rentabilidad.Ingresos Totales$ 330.000Ventas brutas registradas.Costo de Ventas$ 160.000Costo de los productos ya vendidos.Gastos Operativos$ 50.000Servicios, nóminas, etc.Ganancia Neta$ 120.000Rentabilidad Real (Ingresos - Costos - Gastos)Valorización de InventarioCapital invertido en stock actualMateria PrimaInsumos para producción$ 0Mercancía para VentaProductos terminados y comerciales$ 1.350.000Total Inmovilizado$ 1.350.000Gastos RecientesÚltimos egresos registradosServicios InternetUTILITIES8/8/2026-$ 20.000Papeleria OficinaOTHER8/8/2026-$ 30.000"

```

```yaml
- complementary:
  - img "GNS SarriaTech"
  - text: GNS SARRIATECH GESTIÓN DE NEGOCIOS
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
      - img
      - text: Dashboard
    - link "Productos":
      - /url: /dashboard/products
      - img
      - text: Productos
    - link "Grupos":
      - /url: /dashboard/groups
      - img
      - text: Grupos
    - link "Categorías":
      - /url: /dashboard/categories
      - img
      - text: Categorías
    - link "Proveedores":
      - /url: /dashboard/suppliers
      - img
      - text: Proveedores
    - link "Ventas":
      - /url: /dashboard/sales
      - img
      - text: Ventas
    - link "CRM":
      - /url: /dashboard/crm
      - img
      - text: CRM
    - link "Compras":
      - /url: /dashboard/compras
      - img
      - text: Compras
    - link "Finanzas":
      - /url: /dashboard/finanzas
      - img
      - text: Finanzas
    - link "RRHH":
      - /url: /dashboard/rrhh
      - img
      - text: RRHH
    - link "Reportes":
      - /url: /dashboard/reportes
      - img
      - text: Reportes
    - link "Auditoría":
      - /url: /dashboard/audit
      - img
      - text: Auditoría
    - link "Configuración":
      - /url: /dashboard/settings
      - img
      - text: Configuración
  - img "Avatar"
  - paragraph: Admin Empresa A
  - img
  - text: Administrador
  - button "Cerrar Sesión":
    - img
  - button "Colapsar Menú":
    - img
    - text: Colapsar Menú
- banner:
  - img
  - paragraph: "EMPRESA: EMPRESA A TEST"
  - heading "ERP Administrador" [level=2]
  - button "Notificaciones":
    - img
    - text: "3"
  - button "Cambiar Tema":
    - img
  - button "Avatar Admin Empresa A ADMIN":
    - img "Avatar"
    - text: Admin Empresa A ADMIN
    - img
- main:
  - heading "Estado Financiero" [level=1]
  - paragraph: Análisis detallado de costos, ingresos y rentabilidad.
  - paragraph: Ingresos Totales
  - img
  - paragraph: $ 330.000
  - paragraph: Ventas brutas registradas.
  - paragraph: Costo de Ventas
  - img
  - paragraph: $ 160.000
  - paragraph: Costo de los productos ya vendidos.
  - paragraph: Gastos Operativos
  - img
  - paragraph: $ 50.000
  - paragraph: Servicios, nóminas, etc.
  - paragraph: Ganancia Neta
  - img
  - paragraph: $ 120.000
  - paragraph: Rentabilidad Real (Ingresos - Costos - Gastos)
  - img
  - heading "Valorización de Inventario" [level=2]
  - paragraph: Capital invertido en stock actual
  - paragraph: Materia Prima
  - paragraph: Insumos para producción
  - paragraph: $ 0
  - paragraph: Mercancía para Venta
  - paragraph: Productos terminados y comerciales
  - paragraph: $ 1.350.000
  - paragraph: Total Inmovilizado
  - paragraph: $ 1.350.000
  - img
  - heading "Gastos Recientes" [level=2]
  - paragraph: Últimos egresos registrados
  - paragraph: Servicios Internet
  - text: UTILITIES 8/8/2026
  - paragraph: "-$ 20.000"
  - paragraph: Papeleria Oficina
  - text: OTHER 8/8/2026
  - paragraph: "-$ 30.000"
```

# Test source

```ts
  75  |             productId: prodX.id,
  76  |             quantity: 2,
  77  |             unitPrice: 50000,
  78  |             subtotal: 100000,
  79  |             discount: 0,
  80  |             total: 100000,
  81  |             companyId: companyAId
  82  |           }]
  83  |         }
  84  |       }
  85  |     });
  86  | 
  87  |     // Venta 2: Completada. 1 unidad de ProdY. Total = 150,000. Costo = 70,000.
  88  |     await prisma.sale.create({
  89  |       data: {
  90  |         saleNumber: 'VEN-TEST-002',
  91  |         userId: adminAId,
  92  |         client: 'Finanzas Client 2',
  93  |         total: 150000,
  94  |         paymentMethod: 'TARJETA',
  95  |         status: 'COMPLETED',
  96  |         companyId: companyAId,
  97  |         details: {
  98  |           create: [{
  99  |             productId: prodY.id,
  100 |             quantity: 1,
  101 |             unitPrice: 150000,
  102 |             subtotal: 150000,
  103 |             discount: 0,
  104 |             total: 150000,
  105 |             companyId: companyAId
  106 |           }]
  107 |         }
  108 |       }
  109 |     });
  110 | 
  111 |     // Venta 3: Anulada. 1 unidad de ProdZ. Total = 80,000. Costo = 40,000.
  112 |     // Al estar VOIDED, no debe sumarse a ingresos ni costo de ventas.
  113 |     await prisma.sale.create({
  114 |       data: {
  115 |         saleNumber: 'VEN-TEST-003',
  116 |         userId: adminAId,
  117 |         client: 'Finanzas Client 3',
  118 |         total: 80000,
  119 |         paymentMethod: 'TRANSFERENCIA',
  120 |         status: 'VOIDED',
  121 |         companyId: companyAId,
  122 |         details: {
  123 |           create: [{
  124 |             productId: prodZ.id,
  125 |             quantity: 1,
  126 |             unitPrice: 80000,
  127 |             subtotal: 80000,
  128 |             discount: 0,
  129 |             total: 80000,
  130 |             companyId: companyAId
  131 |           }]
  132 |         }
  133 |       }
  134 |     });
  135 | 
  136 |     // 3. Registrar Gastos Operativos Directos
  137 |     // Gasto 1: Papelería = $30,000
  138 |     await prisma.expense.create({
  139 |       data: {
  140 |         description: 'Papeleria Oficina',
  141 |         amount: 30000,
  142 |         category: 'OTHER',
  143 |         companyId: companyAId
  144 |       }
  145 |     });
  146 | 
  147 |     // Gasto 2: Servicios = $20,000
  148 |     await prisma.expense.create({
  149 |       data: {
  150 |         description: 'Servicios Internet',
  151 |         amount: 20000,
  152 |         category: 'UTILITIES',
  153 |         companyId: companyAId
  154 |       }
  155 |     });
  156 |   });
  157 | 
  158 |   test('Debe calcular matemáticamente y mostrar los KPIs correctos en el panel de Finanzas', async ({ page }) => {
  159 |     // Fórmulas matemáticas:
  160 |     // Ingresos Totales = Venta1 (100.000) + Venta2 (150.000) = 250.000 COP
  161 |     // Costo de Ventas = (2 * 25.000) + (1 * 70.000) = 120.000 COP
  162 |     // Ganancia Bruta = 250.000 - 120.000 = 130.000 COP
  163 |     // Gastos Operativos = Papelería (30.000) + Servicios (20.000) = 50.000 COP
  164 |     // Ganancia Neta = 130.000 (Ganancia Bruta) - 50.000 (Gastos) = 80.000 COP
  165 | 
  166 |     const loginPage = new LoginPage(page);
  167 |     await loginPage.goto();
  168 |     await loginPage.login('adminA@gns-test.com', 'Admin123');
  169 | 
  170 |     await page.goto('/dashboard/finanzas');
  171 |     await page.waitForLoadState('networkidle');
  172 | 
  173 |     // 1. Verificar Ingresos Totales = $250,000
  174 |     const ingresosCard = page.locator('div:has-text("Ingresos Totales")').first();
> 175 |     await expect(ingresosCard).toContainText('250.000');
      |                                ^ Error: expect(locator).toContainText(expected) failed
  176 | 
  177 |     // 2. Verificar Costo de Ventas = $120,000
  178 |     const costoCard = page.locator('div:has-text("Costo de Ventas")').first();
  179 |     await expect(costoCard).toContainText('120.000');
  180 | 
  181 |     // 3. Verificar Gastos Operativos = $50,000
  182 |     const gastosCard = page.locator('div:has-text("Gastos Operativos")').first();
  183 |     await expect(gastosCard).toContainText('50.000');
  184 | 
  185 |     // 4. Verificar Ganancia Neta = $80,000
  186 |     const netProfitCard = page.locator('div:has-text("Ganancia Neta")').first();
  187 |     await expect(netProfitCard).toContainText('80.000');
  188 |   });
  189 | });
  190 | 
```