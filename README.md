# GNS SarriaTech - Sistema ERP & Inventario Multi-Tenant

Bienvenido a **GNS SarriaTech**, una plataforma ERP moderna, elegante y de alto rendimiento diseñada para la gestión integral de inventarios, transacciones comerciales (POS), proveedores, clientes y reportes de rendimiento. 

Este sistema cuenta con una arquitectura **Multi-Tenant (Multi-Inquilino)** de aislamiento estricto, permitiendo que múltiples empresas operen de manera independiente bajo una única base de datos y despliegue.

---

## 🚀 Tecnologías Principales

- **Frontend / Backend**: Next.js 15 (App Router), React 19, TypeScript
- **Estilos**: Tailwind CSS, Lucide Icons, Shadcn UI components
- **Base de Datos / ORM**: MySQL, Prisma ORM
- **Autenticación**: NextAuth.js
- **Seguridad**: Zod (Validación de esquemas y tipos), Server Actions seguras

---

## 🛠️ Arquitectura Multi-Tenant

El aislamiento de datos a nivel de base de datos se maneja inyectando y filtrando a través de la propiedad `companyId` (ID de Empresa). 
- **Superadmin**: Es el usuario administrador global de la plataforma, el cual tiene acceso completo a la creación y gestión de empresas, usuarios globales, y asignación de módulos habilitados para cada empresa.
- **Admin**: Administrador específico de cada empresa, con control absoluto del catálogo de productos, proveedores, clientes, reportes y ventas de su respectivo tenant.
- **User**: Empleado de la empresa que registra ventas rápidas, consulta stock y visualiza inventarios autorizados.

Para garantizar la seguridad de las transacciones, la capa de base de datos implementa las utilidades `withTenantWhere` y `withTenantData` en `lib/tenant-db.ts`, asegurando que ningún usuario pueda listar, modificar o eliminar información de otro inquilino de forma no autorizada.

---

## 📦 Módulos Principales

1. **Productos**: CRUD completo con soporte de códigos administrativos, precios de costo y venta, control estricto de existencias, y disparador de alertas de bajo stock.
2. **Categorías**: Clasificación del catálogo. Cada categoría pertenece obligatoriamente a un grupo y cuenta con un código administrativo.
3. **Grupos de Productos**: Agrupaciones macro del catálogo (ej. Belleza, Alimentos, etc.) que estructuran el inventario.
4. **Proveedores**: Directorio corporativo que soporta el campo de "Código o NIT de Empresa".
5. **Ventas (POS)**: Registro atómico y transaccional de facturas rápidas asociadas opcionalmente a clientes registrados en el CRM o a consumidores finales.
   - **Venta Rápida**: Guarda la transacción en estado `PENDING` (pendiente) sin restar inventario de inmediato.
   - **Completar Venta**: Abre un modal interactivo amplio de dos columnas para seleccionar el método de pago, asociar el cliente final y realizar el cobro final deduciendo las existencias de forma segura.
6. **CRM (Clientes)**: Gestión del listado de clientes de la empresa.
7. **Reportes**: Dashboard interactivo con analíticas de ventas, valor de inventario, stock crítico y métricas de rendimiento comercial.

---

## ⚙️ Configuración del Entorno Local

### 1. Clonar y Configurar Variables de Entorno

Copia el archivo de plantilla `.env.example` y renombralo como `.env`:

```bash
cp .env.example .env
```

Abre `.env` y configura tus credenciales locales:

```env
# URL de conexión a tu base de datos MySQL
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_base_datos"

# Llave secreta para encriptar las sesiones de NextAuth
NEXTAUTH_SECRET="tu-secreto-super-seguro"

# URL de acceso local al servidor de Next.js
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Instalación de Dependencias

Se recomienda utilizar `pnpm` como gestor de paquetes:

```bash
pnpm install
```

### 3. Migración e Inicialización de la Base de Datos

Ejecuta las migraciones de Prisma para sincronizar el esquema con tu base de datos MySQL local:

```bash
pnpm prisma db push
```

Puebla la base de datos con los datos de ejemplo iniciales (seed) que contienen la estructura básica (roles de usuario, categorías iniciales y empresas de muestra):

```bash
pnpm run db:seed
```

### 4. Ejecutar el Servidor de Desarrollo

Inicia la aplicación en modo desarrollo:

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

---

## 🔒 Buenas Prácticas de Seguridad en Git

El archivo `.env` local contiene información crítica y credenciales de acceso a la base de datos en producción. Para evitar fugas de información:
- Nunca comitees el archivo `.env`. El archivo `.gitignore` del proyecto ya lo excluye de manera predeterminada.
- Si por error Git ya estaba trackeando tu archivo `.env`, puedes desvincularlo sin borrarlo de tu disco duro físico ejecutando:
  ```bash
  git rm --cached .env
  ```

---

*GNS SarriaTech — Premium Business System para la gestión eficiente y elegante de tu negocio.*
