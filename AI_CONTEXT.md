# Contexto para Asistentes de IA (AI_CONTEXT.md)

Este documento contiene la arquitectura, las reglas de negocio y las convenciones del sistema de "Sistema de Inventarios y Ventas (SaaS Multi-Tenant)". Está diseñado para que cualquier modelo de Inteligencia Artificial que se incorpore al proyecto en el futuro pueda entender el ecosistema rápidamente sin necesidad de escanear o inferir todo el código.

## 1. Arquitectura de Base de Datos (Multi-Tenant)

El sistema utiliza un enfoque híbrido de Bases de Datos impulsado por **Prisma ORM**. 
Existen **TRES esquemas principales**:

1. **Plataforma (Platform DB)**
   - **Ubicación:** `prisma/platform/schema.prisma`
   - **Propósito:** Almacena la metadata global del SaaS. Registra a los Usuarios, las Empresas (Companies), los Servidores de bases de datos disponibles y las Suscripciones.
   - **Conexión:** Singleton estándar en `lib/db-manager.ts` (`platformDb`).

2. **Monolito (Monolith DB) [Legado / En Transición]**
   - **Ubicación:** `prisma/schema.prisma`
   - **Propósito:** Base de datos original compartida donde todas las empresas guardan sus datos operativos mezclados, diferenciados únicamente por la columna `companyId` (entero).
   - **Conexión:** Singleton estándar en `lib/db-manager.ts` (`monolithDb`).

3. **Inquilinos (Tenant DB)**
   - **Ubicación:** `prisma/tenant/schema.prisma`
   - **Propósito:** El esquema estandarizado que se inyecta en bases de datos Dedicadas o Compartidas nuevas. Aquí `companyId` es de tipo `String` (para compatibilidad UUID a futuro).
   - **Regla de Oro en Tenant Schema:** Todas las relaciones foráneas (Foreign Keys) DEBEN tener su propio `@@index([campoId])` explícito y nombres personalizados en la relación (`map: "fk_..."`) para evitar colisiones en bases de datos compartidas (MySQL exige nombres únicos).
   - **Conexión:** Dinámica y por caché mediante `getTenantDb(companyId)` en `lib/db-manager.ts`.

## 2. Enrutador Central de Bases de Datos (`lib/db-manager.ts`)

**NUNCA instanciar `PrismaClient` directamente en los Server Actions operativos.**
Siempre se debe utilizar `lib/db-manager.ts`:

```typescript
import { getDatabaseClient } from "@/lib/db-manager";

// Uso correcto
const db = await getDatabaseClient(session.companyId);
const products = await db.product.findMany(...);
```

El `getDatabaseClient` verificará en la **Plataforma** si la empresa ya fue migrada a un servidor Tenant (tiene `serverId`). Si es así, devolverá una conexión al Tenant. Si no, devolverá la conexión al Monolito. El cambio es transparente para el frontend.

## 3. Autenticación y Sesiones (`auth.ts` / `lib/session.ts`)

- Se utiliza **NextAuth.js (v5)**.
- El usuario inicia sesión y su JWT almacena su `role` (SUPERADMIN, ADMIN, USER), su `companyId`, y sus permisos.
- En Server Actions: Usar `getAuthSession()`.
- Para inyectar filtros automáticos en Prisma:
  - Usar `withTenantWhere(query)` (desde `lib/tenant-db.ts`) para obligar a que las consultas SQL siempre tengan `where: { companyId: X }` si el rol no es SUPERADMIN.
  - Usar `withTenantData(data)` para inyectar automáticamente el `companyId` al crear registros.

## 4. Estructura de Módulos (Rutas y Componentes)

- `app/(auth)/...`: Páginas de inicio de sesión y registro.
- `app/dashboard/...`: Panel principal (Layout protegido).
  - `/settings`: Módulo de Configuraciones. Aquí el SUPERADMIN puede gestionar servidores, ver migraciones y hacer respaldos.
  - `/companies`: CRUD de Empresas (solo SUPERADMIN).
  - `/users`: Gestión de usuarios.
  - `/sales`, `/inventory`, `/purchases`: Módulos operativos (deben usar `getDatabaseClient`).
- `app/api/...`: Rutas de API REST. Ej. `/api/backup` genera un archivo SQL `.sql` a partir de los datos de Prisma.

## 5. Script de Migración (`app/actions/migration-actions.ts`)

Este script se encarga de transferir a una empresa desde el Monolito hacia un Tenant.
**Consideraciones Críticas si vas a editarlo:**
1. Los ID en `Platform` son `Int` (`company.id`), pero el `companyId` en el esquema Tenant es `String`. Siempre realizar el casteo explícito: `companyId: String(company.id)`.
2. Las ejecuciones a base de datos deben preservar el orden de dependencias para no violar las llaves foráneas (ej. Primero Clientes/Proveedores/Categorías, luego Productos, luego Ventas).

## 6. Convenciones de UI y Estilo

- **Estilos:** TailwindCSS. Uso de clases como `bg-card`, `text-foreground`, `bg-primary` para soportar Dark Mode dinámico (`themeConfig`).
- **Componentes:** Se prioriza el uso de componentes funcionales en `React` y "Server Components" donde sea posible, delegando a `"use client"` únicamente la interactividad.
- **Alertas:** Se utiliza **SweetAlert2** centralizado en `lib/sweetalert.ts`. **Prohibido usar `window.confirm` o `window.alert` nativos**. Utiliza `successAlert`, `errorAlert`, o `confirmAction` importados de esa librería.

## 7. Instrucciones para la IA (TÚ, LECTOR):

1. **Limitación del Alcance:** Cuando el usuario te pida un cambio en "Ventas", busca en `app/dashboard/sales` y `app/actions/sale-actions.ts`. No toques archivos no relacionados.
2. **Chequeo de Tipos:** Revisa los esquemas en la carpeta `prisma/` antes de asumir el tipo de un ID. (`id` de plataforma es numérico, en monolito es numérico, en tenant suele ser autoincremental pero `companyId` es String).
3. **Migraciones Prisma:** Si el usuario te pide crear una tabla, hazlo en el esquema de Tenant (`prisma/tenant/schema.prisma`), agrega índices (`@@index`) y sufijos (`map: "fk_..."`) en las relaciones, y recuérdale al usuario correr `npx prisma db push --schema=prisma/tenant/schema.prisma`.
