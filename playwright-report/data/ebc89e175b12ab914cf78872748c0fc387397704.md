# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: critical-flows.spec.ts >> Flujos Críticos de Negocio >> Flujo Crítico 2: Ciclo Completo de Nómina e Impacto en Finanzas
- Location: tests\e2e\critical-flows.spec.ts:141:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Generar Nómina")')

```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - generic [ref=f3e3]:
    - complementary [ref=f3e4]:
      - generic [ref=f3e5]:
        - img "GNS SarriaTech" [ref=f3e7]
        - generic [ref=f3e8]:
          - generic [ref=f3e9]: GNS SARRIATECH
          - generic [ref=f3e10]: GESTIÓN DE NEGOCIOS
      - navigation [ref=f3e11]:
        - link "Dashboard" [ref=f3e12] [cursor=pointer]:
          - /url: /dashboard
        - link "Productos" [ref=f3e19] [cursor=pointer]:
          - /url: /dashboard/products
        - link "Grupos" [ref=f3e31] [cursor=pointer]:
          - /url: /dashboard/groups
        - link "Categorías" [ref=f3e35] [cursor=pointer]:
          - /url: /dashboard/categories
        - link "Proveedores" [ref=f3e41] [cursor=pointer]:
          - /url: /dashboard/suppliers
        - link "Ventas" [ref=f3e45] [cursor=pointer]:
          - /url: /dashboard/sales
        - link "CRM" [ref=f3e51] [cursor=pointer]:
          - /url: /dashboard/crm
        - link "Compras" [ref=f3e58] [cursor=pointer]:
          - /url: /dashboard/compras
        - link "Finanzas" [ref=f3e65] [cursor=pointer]:
          - /url: /dashboard/finanzas
        - link "RRHH" [ref=f3e69] [cursor=pointer]:
          - /url: /dashboard/rrhh
        - link "Reportes" [ref=f3e76] [cursor=pointer]:
          - /url: /dashboard/reportes
        - link "Auditoría" [ref=f3e81] [cursor=pointer]:
          - /url: /dashboard/audit
        - link "Configuración" [ref=f3e85] [cursor=pointer]:
          - /url: /dashboard/settings
      - generic [ref=f3e90]:
        - generic [ref=f3e91]:
          - generic [ref=f3e92]:
            - img "Avatar" [ref=f3e94]
            - generic [ref=f3e95]:
              - paragraph [ref=f3e96]: Admin Empresa A
              - generic [ref=f3e97]: Administrador
          - button "Cerrar Sesión" [ref=f3e102] [cursor=pointer]
        - button "Colapsar Menú" [ref=f3e106] [cursor=pointer]
    - generic [ref=f3e111]:
      - banner [ref=f3e112]:
        - generic [ref=f3e120]:
          - paragraph [ref=f3e121]:
            - generic [ref=f3e122]: "EMPRESA:"
            - generic [ref=f3e123]: EMPRESA A TEST
          - heading "ERP Administrador" [level=2] [ref=f3e124]
        - generic [ref=f3e125]:
          - button "Notificaciones" [ref=f3e126] [cursor=pointer]
          - button "Cambiar Tema" [ref=f3e127] [cursor=pointer]
          - button "Avatar Admin Empresa A ADMIN" [ref=f3e131] [cursor=pointer]:
            - img "Avatar" [ref=f3e133]
            - generic [ref=f3e134]:
              - generic [ref=f3e135]: Admin Empresa A
              - generic [ref=f3e136]: ADMIN
      - main [ref=f3e139]:
        - generic [ref=f3e140]:
          - generic [ref=f3e141]:
            - heading "Recursos Humanos (RRHH)" [level=1] [ref=f3e142]
            - paragraph [ref=f3e143]: Administra la información de tu personal y automatiza el cálculo y pago de nóminas.
          - generic [ref=f3e144]:
            - link [ref=f3e145] [cursor=pointer]:
              - /url: /dashboard/rrhh/cargos
              - generic [ref=f3e146]:
                - heading "Cargos" [level=3] [ref=f3e153]
                - paragraph [ref=f3e154]: Define la estructura organizacional y los salarios base.
              - generic [ref=f3e155]: Ingresar al módulo
            - link [ref=f3e158] [cursor=pointer]:
              - /url: /dashboard/rrhh/novedades
              - generic [ref=f3e159]:
                - heading "Novedades" [level=3] [ref=f3e163]
                - paragraph [ref=f3e164]: Gestiona bonos, horas extras y deducciones del personal.
              - generic [ref=f3e165]: Ingresar al módulo
            - link [ref=f3e168] [cursor=pointer]:
              - /url: /dashboard/rrhh/empleados
              - generic [ref=f3e169]:
                - heading "Directorio de Empleados" [level=3] [ref=f3e176]
                - paragraph [ref=f3e177]: Gestión de información personal, cargos y salarios base del equipo.
              - generic [ref=f3e178]: Ingresar al módulo
            - link [ref=f3e181] [cursor=pointer]:
              - /url: /dashboard/rrhh/nomina
              - generic [ref=f3e182]:
                - heading "Gestión de Nómina" [level=3] [ref=f3e186]
                - paragraph [ref=f3e187]: Cálculo de pagos, deducciones, aprobación y registro de nómina.
              - generic [ref=f3e188]: Ingresar al módulo
  - generic [ref=f3e192]:
    - generic [ref=f3e197]:
      - generic [ref=f3e198]:
        - text: Protección de Datos & Cookies
        - generic [ref=f3e199]: Seguro
      - paragraph [ref=f3e203]:
        - text: Utilizamos cookies de sesión esenciales para garantizar el correcto funcionamiento del sistema de inventarios, la seguridad de sus datos y cumplir con las políticas de privacidad de
        - strong [ref=f3e204]: GNS Gestión SarriaTech
        - text: .
    - generic [ref=f3e205]:
      - button "Leer Políticas de Privacidad" [ref=f3e206] [cursor=pointer]
      - button "Aceptar y Continuar" [ref=f3e210] [cursor=pointer]
  - region "Notifications alt+T"
  - alert [ref=f3e214]
```

# Test source

```ts
  91  |     // 7. Simular compra de 5 unidades incrementando el stock directamente en la DB (o a través de recibos si está soportado)
  92  |     // Para asegurar robustez y probar el efecto en la campanita, actualizamos la BD
  93  |     await prisma.product.update({
  94  |       where: { code_companyId: { code: 'TST-INV-100', companyId: companyAId } },
  95  |       data: { quantityAvailable: 14 }
  96  |     });
  97  | 
  98  |     const pOrder = await prisma.purchaseOrder.create({
  99  |       data: {
  100 |         orderNumber: `PO-TST-${Date.now()}`,
  101 |         supplierId: supplierAId,
  102 |         companyId: companyAId,
  103 |         status: 'RECEIVED'
  104 |       }
  105 |     });
  106 | 
  107 |     const pReceipt = await prisma.purchaseReceipt.create({
  108 |       data: {
  109 |         receiptNumber: `REC-TST-${Date.now()}`,
  110 |         purchaseOrderId: pOrder.id,
  111 |         companyId: companyAId,
  112 |         status: 'COMPLETE'
  113 |       }
  114 |     });
  115 | 
  116 |     // Crear un registro en InventoryEntry para cumplir el flujo del manual
  117 |     await prisma.inventoryEntry.create({
  118 |       data: {
  119 |         purchaseReceiptId: pReceipt.id,
  120 |         companyId: companyAId,
  121 |         items: {
  122 |           create: [{
  123 |             productId: (await prisma.product.findFirst({ where: { code: 'TST-INV-100', companyId: companyAId } }))!.id,
  124 |             quantityAdded: 5,
  125 |             companyId: companyAId
  126 |           }]
  127 |         }
  128 |       }
  129 |     });
  130 | 
  131 |     // 8. Comprobar stock esperado = 14 en la UI
  132 |     await page.reload();
  133 |     await productPage.searchProduct('TST-INV-100');
  134 |     await expect(row.locator('td').nth(2)).toContainText('14');
  135 | 
  136 |     // 9. Comprobar que la alerta de stock bajo desaparezca automáticamente (stock > 10)
  137 |     await page.waitForTimeout(6000); // Esperar polling
  138 |     await expect(bellButton.locator('span.bg-destructive').first()).not.toBeVisible();
  139 |   });
  140 | 
  141 |   test('Flujo Crítico 2: Ciclo Completo de Nómina e Impacto en Finanzas', async ({ page }) => {
  142 |     // 1. Iniciar sesión como administrador
  143 |     const loginPage = new LoginPage(page);
  144 |     await loginPage.goto();
  145 |     await loginPage.login('adminA@gns-test.com', 'Admin123');
  146 | 
  147 |     // 2. Ir a RRHH -> Empleados y crear un empleado
  148 |     await page.goto('/dashboard/rrhh');
  149 |     // Ir a la pestaña o subruta de empleados
  150 |     await page.click('text=Empleados');
  151 |     await page.click('button:has-text("Añadir Empleado")');
  152 | 
  153 |     await page.fill('input[name="firstName"]', 'John');
  154 |     await page.fill('input[name="lastName"]', 'Doe');
  155 |     await page.fill('input[name="documentId"]', '10987654');
  156 |     await page.fill('input[name="email"]', 'johndoe@test.com');
  157 |     await page.fill('input[name="phone"]', '3001234567');
  158 |     await page.fill('input[name="address"]', 'Calle Falsa 123');
  159 |     await page.fill('input[name="department"]', 'Tecnología');
  160 |     await page.selectOption('select[name="positionId"]', String(positionId));
  161 |     await page.fill('input[name="bankName"]', 'Bancolombia');
  162 |     await page.fill('input[name="bankAccount"]', '987654321');
  163 | 
  164 |     // Guardar empleado
  165 |     await page.click('button[type="submit"]:has-text("Guardar")');
  166 |     await page.waitForTimeout(1000); // Esperar redirección/recarga
  167 | 
  168 |     // Verificar que el empleado John Doe está en el listado
  169 |     await expect(page.locator('text=John Doe')).toBeVisible();
  170 | 
  171 |     // 3. Crear novedad de descuento de $50,000 para John Doe directamente en la DB para evitar flujos UI inestables
  172 |     const employee = await prisma.employee.findFirst({
  173 |       where: { documentId: '10987654', companyId: companyAId }
  174 |     });
  175 |     expect(employee).not.toBeNull();
  176 | 
  177 |     await prisma.employeeNovelty.create({
  178 |       data: {
  179 |         employeeId: employee!.id,
  180 |         type: 'DEDUCTION',
  181 |         amount: 50000,
  182 |         description: 'Descuento Test E2E',
  183 |         isRecurring: false,
  184 |         companyId: companyAId
  185 |       }
  186 |     });
  187 | 
  188 |     // 4. Generar nómina del periodo actual
  189 |     await page.goto('/dashboard/rrhh');
  190 |     await page.click('text=Nóminas');
> 191 |     await page.click('button:has-text("Generar Nómina")');
      |                ^ Error: page.click: Test timeout of 60000ms exceeded.
  192 |     
  193 |     // Confirmar en SweetAlert
  194 |     await page.click('button:has-text("Sí, generar")');
  195 |     await page.waitForSelector('text=Nómina Generada');
  196 |     await page.click('button:has-text("OK")');
  197 | 
  198 |     // 5. Entrar al detalle de la nómina generada y verificar los cálculos matemáticos
  199 |     // Buscamos la nómina recién creada en el listado y hacemos clic
  200 |     await page.click('table tbody tr:first-child td a:has-text("Detalle")');
  201 |     await page.waitForURL(/.*\/dashboard\/rrhh\/nomina\/\d+/);
  202 | 
  203 |     // Verificar que el salario neto tiene el descuento aplicado
  204 |     // Salario base de la posición = 1,200,000
  205 |     // Deducción de ley 8% = 96,000
  206 |     // Novedad descuento = 50,000
  207 |     // Salario neto esperado = 1,200,000 - 96,000 - 50,000 = 1,054,000
  208 |     await expect(page.locator('text=1.054.000')).toBeVisible();
  209 | 
  210 |     // 6. Aprobar la nómina en la UI
  211 |     await page.click('button:has-text("Aprobar Nómina")');
  212 |     await page.click('button:has-text("Sí, aprobar")');
  213 |     await page.waitForSelector('text=Nómina aprobada');
  214 |     await page.click('button:has-text("OK")');
  215 | 
  216 |     // 7. Pagar la nómina en la UI
  217 |     await page.click('button:has-text("Registrar Pago")');
  218 |     await page.click('button:has-text("Sí, registrar")');
  219 |     await page.waitForSelector('text=Pago registrado');
  220 |     await page.click('button:has-text("OK")');
  221 | 
  222 |     // 8. Ir a Finanzas y verificar aumento de gastos operativos
  223 |     await page.goto('/dashboard/finanzas');
  224 |     // Verificar que los gastos operativos muestran el valor de la nómina pagada (1.054.000) o se incrementó en ese monto
  225 |     // Nota: Como es el E2E QA runner, si GNS no vincula la nómina pagada a los gastos de finanzas directamente en su código (lo cual validamos que es así),
  226 |     // el test fallará aquí con un timeout/expect, exponiendo el GAP en el sistema de manera automática!
  227 |     await expect(page.locator('text=1.054.000')).toBeVisible();
  228 |   });
  229 | });
  230 | 
```