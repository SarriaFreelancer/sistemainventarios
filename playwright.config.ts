import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno del entorno de pruebas
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Ejecutar secuencialmente para evitar colisiones de base de datos
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Usar solo 1 worker para mantener consistencia transaccional en la DB
  reporter: 'html',
  timeout: 60000, // Extender el tiempo límite de cada prueba a 60s por compilación de desarrollo
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Iniciar el servidor de Next.js si no hay uno activo en el puerto 3001
  webServer: {
    command: 'npx next dev -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'development',
      DATABASE_URL: process.env.DATABASE_URL || '',
      PLATFORM_DATABASE_URL: process.env.PLATFORM_DATABASE_URL || '',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      NEXTAUTH_URL: 'http://localhost:3001',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
    },
  },
});
