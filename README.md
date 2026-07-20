# GNS SarriaTech - Sistema ERP & Inventario Multi-Tenant

Bienvenido a **GNS SarriaTech**, una plataforma ERP moderna, elegante y de alto rendimiento diseñada para la gestión integral de inventarios, transacciones comerciales (POS), proveedores, compras, clientes y reportes de rendimiento. 

Este sistema cuenta con una arquitectura **Multi-Tenant (Multi-Inquilino)** de aislamiento estricto, permitiendo que múltiples empresas operen de manera independiente bajo una única base de datos y despliegue.

---

## 🚀 Tecnologías Principales

- **Frontend / Backend**: Next.js 15 (App Router), React 19, TypeScript
- **Estilos**: Tailwind CSS, Lucide Icons, Shadcn UI components
- **Base de Datos / ORM**: MySQL, Prisma ORM
- **Autenticación y Seguridad**: NextAuth.js (Sesiones encriptadas), AES-256-CBC (Encriptación de datos sensibles)
- **Validaciones**: Zod (Validación de esquemas y tipos), Server Actions seguras

---

## 🔐 Seguridad y Autenticación del Sistema

La plataforma implementa un esquema de seguridad robusto a múltiples niveles:

1. **Autenticación (NextAuth.js):** Manejo seguro de sesiones mediante cookies HTTP-Only y encriptación robusta en el servidor, garantizando que los datos de sesión no sean manipulados desde el lado del cliente (No expone JWT al frontend directamente).
2. **Encriptación de Datos en Reposo:** Utiliza una `ENCRYPTION_KEY` para cifrar datos altamente sensibles directamente en la base de datos (por ejemplo, credenciales SMTP o API Keys) utilizando el estándar de la industria AES-256-CBC.
3. **MFA / 2FA Opcional:** Capacidad para exigir Doble Factor de Autenticación a nivel de empresa para elevar la seguridad de los ingresos.
4. **Validación Zod y Server Actions:** Las mutaciones de datos (crear, editar, eliminar) son validadas en tiempo de ejecución (runtime) en el servidor antes de impactar en la base de datos, evitando inyecciones o datos malformados.
5. **Auditorías de Sistema (Audit Logs):** Se rastrea cualquier acción crítica (creación, edición o eliminación de registros) realizada por los usuarios, guardando quién, cuándo y qué cambió, asegurando trazabilidad total.

---

## 🛠️ Arquitectura Multi-Tenant y Roles

El aislamiento de datos a nivel de base de datos se maneja inyectando y filtrando a través de la propiedad `companyId` (ID de Empresa). 

- **Superadmin**: Es el usuario administrador global de la plataforma, el cual tiene acceso completo a la creación y gestión de empresas, usuarios globales, integración de pagos y asignación de licencias o planes a cada inquilino.
- **Admin**: Administrador específico de cada empresa, con control absoluto del catálogo de productos, proveedores, clientes, compras, reportes y ventas de su respectivo tenant. Tiene acceso a configuraciones críticas de la empresa (facturación, notificaciones, respaldos).
- **User**: Empleado de la empresa que registra ventas rápidas, consulta stock y visualiza inventarios autorizados, con permisos limitados.

Para garantizar la seguridad de las transacciones, la capa de base de datos implementa las utilidades `withTenantWhere` y `withTenantData` en `lib/tenant-db.ts`, asegurando que ningún usuario pueda listar, modificar o eliminar información de otro inquilino de forma no autorizada.

---

## 📦 Módulos del Sistema

1. **Productos e Inventario**: CRUD completo con soporte de códigos administrativos, precios de costo y venta. Control estricto de existencias, con alertas en tiempo real al llegar a stock bajo (Naranja) o stock cero (Rojo).
2. **Categorías y Grupos**: Clasificación estructurada del catálogo. Cada categoría pertenece obligatoriamente a un grupo y cuenta con un código administrativo.
3. **Proveedores y Compras**: 
   - Directorio de proveedores soportando "Código o NIT de Empresa".
   - Panel de **Órdenes de Compra** (generación y recepción de mercancía para abastecer inventario de forma organizada).
4. **Ventas (POS)**: Registro transaccional de facturas rápidas asociadas a clientes del CRM o consumidores finales.
   - **Venta Rápida**: Guarda la transacción en estado `PENDING` (pendiente) sin restar inventario de inmediato.
   - **Completar Venta**: Abre un modal interactivo para seleccionar el método de pago, cobrar y deducir automáticamente las existencias.
5. **CRM (Clientes)**: Gestión del listado de clientes de la empresa, rastreo de historial e integraciones.
6. **Centro de Notificaciones**: Campanita interactiva global que notifica en tiempo real sobre ventas completadas (Éxito), stock agotado (Alerta) y finalización de respaldos de base de datos. Integrado con `Sonner` para visualización temporal de *toasts* elegantes.
7. **Reportes y Analíticas**: Dashboard interactivo con analíticas de ventas, valor de inventario, ganancias, métricas de rendimiento comercial y fechas de filtrado (hoy, semana, mes, año).
8. **Auditoría (Log de Acciones)**: Registro inmutable de cada acción generada por los usuarios del sistema.
9. **Suscripciones y Pagos**: Gestión automatizada de planes (Básico, Intermedio, Premium) restringiendo la cantidad de usuarios y productos por plan. Integrado de base con pasarelas (ej. Bold) para venta de licencias SaaS.
10. **Configuraciones de Empresa**: Herramienta donde el Administrador ajusta el diseño de su facturación (Logo, colores primarios/secundarios), activa notificaciones, configura respaldos automáticos por `Cron` y establece límites y formatos moneda/fecha.

---

## ⚙️ Configuración del Entorno Local

### 1. Variables de Entorno (.env)

Debes crear un archivo `.env` en la raíz del proyecto. Estas son **todas las variables utilizadas** y requeridas para su correcto funcionamiento:

```env
# URL principal de conexión a tu base de datos MySQL (Tenant Database)
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_base_datos"
TENANT_DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_base_datos"
PLATFORM_DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_base_datos"

# Llave secreta para encriptar las sesiones de NextAuth (Generar una cadena larga y segura)
NEXTAUTH_SECRET="tu-secreto-super-seguro"

# URL de acceso al servidor (Ej: http://localhost:3000 o tu dominio de producción)
NEXTAUTH_URL="http://localhost:3000"

# Llave AES-256 de 64 caracteres Hexadecimales para encriptar configuraciones (ej: 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# API Keys para Pasarela de Pagos (Ejemplo con Bold)
NEXT_PUBLIC_BOLD_API_KEY="tu_bold_api_key_publica"
BOLD_INTEGRITY_KEY="tu_bold_integrity_key_secreta"
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
