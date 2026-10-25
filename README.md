# GNS — Gestión de Negocios SarriaTech
### Plataforma SaaS Multi-Empresa & ERP Empresarial Cloud

> **Desarrollado por:** SarriaTech Solutions S.A.S.
> **Desarrollador Líder:** David Sarria
> **Sitio Web / Soporte:** [https://sarriatech.tech](https://sarriatech.tech)
> **Versión:** 2.5 Enterprise (Next.js 15 · React 19 · Prisma · MySQL)

---

## 🌟 1. Visión General & Alcance del Sistema

**GNS (Gestión de Negocios SarriaTech)** es una plataforma SaaS (*Software as a Service*) integral, modular y escalable para la gestión y administración empresarial. Está diseñada para cubrir todo el ciclo operativo de micro, pequeñas, medianas y grandes empresas:

- **Arquitectura Multi-Inquilino (Multi-Tenant):** Aislamiento estricto de datos por empresa (`companyId`), con soporte para esquemas compartidos y bases de datos dedicadas por cliente corporativo.
- **Modelo Híbrido Físico & Digital:** Punto de Venta (POS) en mostrador, facturación electrónica/tirilla, e-commerce público con tienda virtual nativa, catálogo interactivo y checkout directo a WhatsApp.
- **Logística & Cadena de Suministro (WMS):** Almacenes múltiples, control de lotes con fechas de vencimiento, traslados entre bodegas con estados en tránsito y kardex valorizado.
- **Operaciones Financieras & Cartera:** Ventas a crédito, control de cuentas por cobrar, alertas de mora, planes separe con reserva de stock y emisión de recibos oficiales de caja.
- **Escalabilidad Corporativa (Enterprise Multi-Sedes):** Administración de múltiples sucursales físicas con inventarios independientes, catálogo centralizado y consolidado financiero de rentabilidad por sede.
- **Inteligencia Artificial Generativa (BYOK):** Asistentes y análisis predictivo integrando modelos Google Gemini y OpenAI mediante llaves propias de cada empresa.
- **Ecosistema Abierto (APIs REST v1 & v2):** Conexión segura mediante Bearer Token y API Keys para sincronizar tiendas externas (Shopify, WooCommerce, MercadoLibre) o ERPs legados.

---

## 🏗️ 2. Arquitectura & Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Framework Fullstack** | [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Route Handlers) |
| **Librería UI** | [React 19](https://react.dev/), [Tailwind CSS v3](https://tailwindcss.com/) |
| **Componentes & Iconos** | Shadcn UI, Radix UI Primitives, Lucide Icons, Sonner Toasts |
| **Lenguaje** | [TypeScript 5](https://www.typescriptlang.org/) (Tipado estricto de extremo a extremo) |
| **Base de Datos & ORM** | [MySQL 8+](https://www.mysql.com/), [Prisma ORM](https://www.prisma.io/) (Esquemas Central y Tenant) |
| **Autenticación & Sesión** | [NextAuth.js (Auth.js)](https://next-auth.js.org/) con sesiones HTTP-Only y RBAC |
| **Cifrado & Seguridad** | AES-256-CBC para credenciales en reposo, Zod para validación de contratos |
| **Generación de Reportes** | [ExcelJS](https://github.com/exceljs/exceljs) (Hojas de cálculo nativas con auto-filtros y estilos), PDF Generator |
| **Tiempo Real & Notificaciones** | Pusher Channels, Webhooks |
| **Pasarelas de Pago** | Bold Colombia, Wompi, Stripe |
| **Gestor de Procesos** | PM2 con soporte cluster y reinicio automático |

---

## 📁 3. Estructura del Proyecto

```text
invetario_productos/
├── app/                                # Enrutamiento y vistas Next.js App Router
│   ├── (auth)/                         # Rutas de autenticación (login, registro, recuperación)
│   ├── actions/                        # Server Actions para mutaciones seguras
│   │   ├── store-actions.ts            # Lógica de tienda virtual, personalización y pedidos
│   │   ├── credit-actions.ts           # Cartera, créditos, cuotas y recibos de caja
│   │   ├── branch-actions.ts           # Enterprise multi-sedes y solicitudes
│   │   └── ai-config-actions.ts        # Configuración de Inteligencia Artificial (BYOK)
│   ├── api/                            # Endpoints REST y Webhooks
│   │   ├── auth/                       # Endpoints de NextAuth
│   │   ├── reports/                    # Generadores de reportes ExcelJS en tiempo real
│   │   │   ├── cartera/                # Reporte de cartera, mora y cuotas
│   │   │   ├── enterprise/             # Consolidado de ventas multi-sedes
│   │   │   ├── transfers/              # Trazabilidad de traslados de bodegas
│   │   │   ├── sales/                  # Historial de ventas POS
│   │   │   ├── stock/                  # Estado de inventario y alertas
│   │   │   └── products/               # Catálogo de artículos y costos
│   │   ├── store/                      # API pública de la tienda virtual
│   │   └── v2/                         # APIs públicas REST protegidas por API Key
│   ├── dashboard/                      # Panel de administración protegido (ERP)
│   │   ├── tienda/                     # Panel de la tienda virtual (Diseño y Catálogo)
│   │   ├── cartera/                    # Gestión de cartera, cuotas y recibos
│   │   ├── enterprise/                 # Control corporativo multi-sedes
│   │   ├── bodegas/                    # WMS, almacenes y traslados
│   │   ├── productos/                  # Catálogo, variantes, combos y lotes
│   │   ├── ventas/                     # Punto de Venta (POS) y facturación
│   │   ├── compras/                    # Órdenes de compra y proveedores
│   │   ├── crm/                        # Clientes y cotizaciones
│   │   ├── rrhh/                       # Empleados y liquidación de nómina
│   │   ├── finanzas/                   # Egresos, caja chica y flujo de efectivo
│   │   ├── reportes/                   # Centro interactivo de reportes
│   │   ├── documentacion/              # Manual interactivo oficial
│   │   └── configuracion/              # Parámetros, consecutivos, DIAN e IA
│   └── t/                              # Rutas públicas de la Tienda Virtual
│       └── [storeSlug]/                # Catálogo web, producto, carrito y checkout
│           └── order/[orderToken]/     # Confirmación y seguimiento de pedido en vivo
├── components/                         # Componentes reutilizables de UI
│   ├── store/                          # Componentes del e-commerce y personalizador visual
│   │   ├── public-catalog-client.tsx   # Vitrina interactiva, filtros y ordenamiento
│   │   ├── theme-customizer.tsx        # Personalizador visual estilo WordPress
│   │   ├── store-admin-client.tsx      # Gestión de productos publicados y banners
│   │   ├── cart-drawer.tsx             # Carrito lateral deslizable
│   │   └── product-modal.tsx           # Modal rápido de producto con fotos/video
│   ├── reports/                        # Componentes para exportar Excel y PDF
│   │   └── report-download-button.tsx  # Selector de columnas, filtros y presets
│   └── ui/                             # Componentes base Shadcn (Botones, Modales, Tablas)
├── lib/                                # Utilidades, clientes y lógica de negocio
│   ├── prisma.ts                       # Instancia global de Prisma Client
│   ├── store-theme.ts                  # Esquemas y configuraciones de temas visuales
│   ├── tenant-db.ts                    # Helpers de aislamiento multi-tenant
│   └── encryption.ts                   # Cifrado simétrico AES-256
├── prisma/                             # Esquemas y migraciones de base de datos
│   ├── schema.prisma                   # Esquema maestro de la plataforma
│   └── tenant/                         # Esquema de base de datos dedicada de tenant
├── public/                             # Recursos estáticos (Logos, fuentes, iconos)
├── .env.example                        # Plantilla de variables de entorno
├── ecosystem.config.cjs                # Configuración de despliegue para PM2
├── package.json                        # Dependencias y scripts de compilación
└── tsconfig.json                       # Configuración del compilador TypeScript
```

---

## 🧩 4. Módulos del Sistema GNS

### 🛒 4.1. Tienda Virtual & E-Commerce Nativo
- **URL Pública Estable e Inmutable:** Cada negocio cuenta con un enlace único y permanente (`/t/store_xxxx`) y soporte para dominios personalizados (`mitienda.com`).
- **Personalizador Visual Estilo WordPress:**
  - Ajuste de logotipo comercial, isotipo y eslogan.
  - Paleta de colores con temas prediseñados (*Azul Profesional, Esmeralda Eco, Púrpura Boutique, Ámbar Dinámico, Glamour Rose, Dark Luxe*) o colores hexadecimales a medida.
  - Tipografías corporativas, estilos de bordes redondeados y barra superior de anuncios (*promotional banner*).
  - Personalización de la sección Hero (títulos, subtítulos, botones de acción y fondos degradados o imágenes).
  - Sección de beneficios destacados, testimonios y pie de página con políticas legales y redes sociales.
- **Catálogo de Productos & Galerías Multimedia:**
  - Selección y publicación de artículos con paginación optimizada y filtros por categoría.
  - Soporte de hasta **5 fotografías en alta resolución** y **enlace a video demostrativo** por producto.
  - Precios de oferta con etiquetas de descuento en tiempo real y stock dinámico.
- **Carrito de Compras & Checkout Express:**
  - Carrito lateral (*Drawer*) fluido para móviles, tablets y computadores.
  - Selección de método de entrega: Envío a domicilio, retiro en punto físico o coordinar por chat.
  - **Seguimiento sin Login Forzoso:** El cliente realiza su pedido sin necesidad de crear cuenta ni recordar contraseñas.
- **Integración con WhatsApp:**
  - Envío automático de mensaje preformateado a la línea comercial de la tienda con el resumen completo de productos, totales y datos de entrega.
  - Enlace directo para que el comprador y el vendedor hagan seguimiento al pedido en vivo.
- **Bandeja de Pedidos en GNS:**
  - Los pedidos web ingresan en estado `PENDING` para revisión administrativa.
  - Botón de **conversión a venta POS en un clic**, emitiendo factura y descontando el inventario automáticamente.

---

### 💳 4.2. Cartera & Ventas a Crédito (Cuentas por Cobrar)
- **Modalidades de Entrega Flexibles:**
  - **Entrega Inmediata:** Despacha la mercancía al momento de la venta y genera el plan de cobro diferido.
  - **Contra Pago Total (Plan Separe / Reserva):** Reserva formalmente las existencias en inventario pero retiene la mercancía físicamente hasta que el cliente cancele la totalidad de la deuda.
- **Cronograma de Amortización & Cuotas:**
  - Cálculo automático de cuotas (semanal, quincenal, mensual) y fecha límite de pago.
  - **Semáforo de Mora:** Alertas automáticas para créditos vencidos con cálculo dinámico de días de retraso.
- **Recaudos & Recibos de Caja Oficiales:**
  - Registro de abonos parciales o totales con múltiples métodos de pago (Efectivo, Transferencia, Tarjeta).
  - Aplicación automática a las cuotas más antiguas.
  - Emisión e impresión de **Recibo de Caja** oficial en formato ticket térmico (58mm/80mm) y tamaño carta PDF.
  - Trazabilidad y anulación de pagos con registro de auditoría.

---

### 🏢 4.3. GNS Enterprise Multi-Sedes
- **Gestión Corporativa de Sucursales:** Control centralizado de múltiples puntos de venta, locales comerciales y almacenes.
- **Flujo de Solicitud de Sedes:** Las empresas en plan Enterprise pueden solicitar la apertura de nuevos locales desde el sistema, quedando sujetos a aprobación del Superadministrador.
- **Catálogo Maestro vs Catálogos Locales:** Los productos pueden heredarse desde la sede principal o administrarse de forma independiente por cada sucursal.
- **Inventarios Aislados:** Cada sucursal maneja su propio stock, cajas y bodegas físicas.
- **Consolidado Ejecutivo de Rentabilidad:** Reportes comparativos de ventas, costos, utilidades y margen neto entre sedes.

---

### 📦 4.4. Almacén WMS & Traslados de Bodegas
- **Múltiples Almacenes:** Bodega principal, bodegas secundarias, puntos de exhibición y vehículos de despacho.
- **Flujo Logístico en 4 Fases:**
  1. `REQUESTED`: Solicitud formal de abastecimiento entre bodegas.
  2. `APPROVED`: Autorización por el encargado del almacén emisor.
  3. `IN_TRANSIT`: Mercancía despachada y en ruta (descontada de origen, evitando duplicidad).
  4. `RECEIVED`: Conteo físico y confirmación de recepción en destino, sumando existencias al Kardex.
- **Kardex Valorizado:** Registro inmutable de cada entrada, salida y ajuste de inventario.

---

### 🏷️ 4.5. Productos, Lotes & Vencimientos
- Clasificación por **Grupos y Categorías** con códigos administrativos normalizados.
- Control de costos de adquisición, margen de ganancia proyectado y precios de venta al público.
- **Trazabilidad de Lotes:** Registro de números de lote, fechas de fabricación y fechas de expiración con alertas preventivas para productos perecederos o farmacéuticos.
- Combos y paquetes de productos para promociones especiales.

---

### 🧾 4.6. Punto de Venta (POS) & Facturación
- Venta rápida en mostrador con soporte de lectores de código de barras.
- Facturas en estado borrador/pendiente y confirmación inmediata con múltiples métodos de pago.
- Formatos de impresión configurables: **Ticket Térmico 58mm**, **Ticket Térmico 80mm** y **PDF Tamaño Carta / A4**.
- Consecutivos autorizados, resolución DIAN / tributaria y notas legales al pie de factura.

---

### 📊 4.7. Centro de Reportes & Analíticas
- Exportación nativa a **Microsoft Excel (.xlsx)** con estilos profesionales y auto-filtros.
- Modo de exportación completa o **selector de campos personalizados**.
- **Guardado de Plantillas (Presets):** Guarda configuraciones de columnas favoritas en base de datos.
- Reportes incluidos:
  - Catálogo de Productos y Márgenes
  - Historial de Ventas POS
  - Reporte de Stock y Disponibilidad
  - Proveedores y Contactos
  - Historial de Compras
  - Nómina Generada y Empleados
  - **Cartera y Créditos (Mora, Abonos y Saldos)**
  - **Ventas Enterprise Multi-Sedes**
  - **Traslados de Bodegas WMS**

---

### 🤖 4.8. Inteligencia Artificial (BYOK)
- Conexión flexible de modelos de IA con el enfoque **Bring Your Own Key**:
  - **Google Gemini:** `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`.
  - **OpenAI:** `gpt-4o`, `gpt-4o-mini`, `o1`.
- Análisis automatizado de tendencias comerciales, detección de inventario de baja rotación y generación de textos publicitarios para la tienda online.

---

### 🌐 4.9. APIs REST v1 / v2 & Integraciones
- Autenticación segura mediante cabeceras `Authorization: Bearer <API_KEY>` y `x-api-key`.
- Endpoints JSON para consultar catálogo, crear ventas, verificar stock y sincronizar clientes con plataformas externas.

---

## ⚙️ 5. Requisitos del Sistema & Instalación

### 📋 Requisitos Previos
- **Node.js:** Versión 18.18.0 o superior (Recomendado: Node.js 20 LTS o 22 LTS).
- **Gestor de Paquetes:** `pnpm` (recomendado) o `npm`.
- **Base de Datos:** MySQL 8.0 o MariaDB 10.5+.
- **Servidor Web / Proxy Inverso:** Nginx o Apache con certificado SSL (para producción).

---

### 🚀 Instalación Paso a Paso

1. **Clonar el Repositorio:**
   ```bash
   git clone https://github.com/SarriaFreelancer/sistemainventarios.git
   cd sistemainventarios
   ```

2. **Instalar Dependencias:**
   ```bash
   pnpm install
   # o bien: npm install
   ```

3. **Configurar Variables de Entorno:**
   Copia el archivo de plantilla `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   Diligencia las credenciales requeridas:
   ```env
   # ─── Conexión a Base de Datos MySQL ───
   DATABASE_URL="mysql://usuario:password@localhost:3306/gns_inventarios"
   PLATFORM_DATABASE_URL="mysql://usuario:password@localhost:3306/gns_inventarios"

   # ─── Autenticación & Seguridad ───
   NEXTAUTH_SECRET="genera-un-token-aleatorio-de-al-menos-32-caracteres"
   NEXTAUTH_URL="http://localhost:3000"
   ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

   # ─── Pasarela de Pagos Bold (Opcional) ───
   NEXT_PUBLIC_BOLD_API_KEY="tu_bold_api_key"
   BOLD_INTEGRITY_KEY="tu_bold_integrity_key"

   # ─── Notificaciones Pusher (Opcional) ───
   PUSHER_APP_ID="tu_pusher_app_id"
   PUSHER_SECRET="tu_pusher_secret"
   NEXT_PUBLIC_PUSHER_KEY="tu_pusher_public_key"
   NEXT_PUBLIC_PUSHER_CLUSTER="us2"
   ```

4. **Sincronizar y Generar Prisma ORM:**
   ```bash
   # Sincroniza las tablas en la base de datos
   pnpm run db:push

   # Genera el cliente tipado de Prisma
   pnpm run db:generate

   # Puebla datos iniciales (Roles, Superadmin, Empresa demo)
   pnpm run db:seed
   ```

5. **Iniciar el Entorno de Desarrollo:**
   ```bash
   pnpm dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🛠️ 6. Scripts Disponibles

| Script | Descripción |
| :--- | :--- |
| `pnpm dev` | Inicia el servidor de desarrollo Next.js en el puerto 3000 |
| `pnpm build` | Compila la aplicación optimizada para producción |
| `pnpm start` | Inicia el servidor compilado de producción |
| `pnpm run db:push` | Sincroniza el esquema de Prisma con la base de datos MySQL |
| `pnpm run db:generate` | Regenera el cliente `@prisma/client` con tipos TypeScript |
| `pnpm run db:seed` | Ejecuta el script de siembra de datos iniciales |
| `pnpm run db:studio` | Abre la interfaz gráfica visual de Prisma Studio |
| `pnpm test:e2e` | Ejecuta las pruebas automatizadas End-to-End con Playwright |

---

## 🚢 7. Despliegue en Producción con PM2

Para mantener el sistema en ejecución continua en un servidor Linux (Ubuntu/Debian) o Windows Server:

1. **Compilar la versión final:**
   ```bash
   pnpm build
   ```

2. **Iniciar y registrar el servicio con PM2:**
   ```bash
   # Iniciar el proceso de producción
   pnpm run pm2:prod

   # Guardar la lista para que reinicie tras un reinicio del servidor
   pm2 save
   pm2 startup
   ```

3. **Comandos útiles de mantenimiento:**
   ```bash
   pm2 status              # Verifica el estado del servicio
   pm2 logs gns            # Monitorea los logs en tiempo real
   pm2 restart gns         # Reinicia el servicio
   ```

---

## 👥 8. Créditos & Derechos de Autor

- **Empresa:** **SarriaTech Solutions S.A.S.**
- **Desarrollador Principal:** **David Sarria**
- **Contacto Comercial & Soporte Técnico:** [soporte@sarriatech.tech](mailto:soporte@sarriatech.tech)
- **Todos los derechos reservados © 2026 SarriaTech Solutions S.A.S.**

---

*GNS SarriaTech — Potencia, elegancia y control total para tu negocio.*
