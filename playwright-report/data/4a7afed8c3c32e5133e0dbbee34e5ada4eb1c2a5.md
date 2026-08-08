# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Autenticación y Seguridad de Sesión >> Debe mostrar error si se intenta iniciar sesión con credenciales incorrectas
- Location: tests\e2e\auth.spec.ts:17:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('p.leading-snug')
Expected substring: "Credenciales inválidas"
Received string:    "Correo electrónico o contraseña incorrectos. Verifica tus credenciales."
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('p.leading-snug')
    14 × locator resolved to <p class="leading-snug">Correo electrónico o contraseña incorrectos. Veri…</p>
       - unexpected value "Correo electrónico o contraseña incorrectos. Verifica tus credenciales."

```

```yaml
- paragraph: Correo electrónico o contraseña incorrectos. Verifica tus credenciales.
```

# Test source

```ts
  1  | import { Page, expect } from '@playwright/test';
  2  | 
  3  | export class LoginPage {
  4  |   private readonly page: Page;
  5  | 
  6  |   constructor(page: Page) {
  7  |     this.page = page;
  8  |   }
  9  | 
  10 |   async goto() {
  11 |     await this.page.goto('/auth/login');
  12 |   }
  13 | 
  14 |   async login(email: string, password = 'Admin123', expectSuccess = true) {
  15 |     await this.page.fill('input[type="email"]', email);
  16 |     await this.page.fill('input[type="password"]', password);
  17 |     await this.page.click('button[type="submit"]');
  18 |     
  19 |     if (expectSuccess) {
  20 |       // Esperar a que la URL cambie al dashboard (lo cual indica login exitoso)
  21 |       await this.page.waitForURL(/.*\/dashboard.*/);
  22 |     }
  23 |   }
  24 | 
  25 |   async expectErrorMessage(message: string) {
  26 |     const errorBanner = this.page.locator('p.leading-snug');
  27 |     await expect(errorBanner).toBeVisible();
> 28 |     await expect(errorBanner).toContainText(message);
     |                               ^ Error: expect(locator).toContainText(expected) failed
  29 |   }
  30 | }
  31 | 
```