import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Truck,
  FileSpreadsheet,
  BarChart3,
  Calculator,
  Briefcase,
  Users
} from 'lucide-react';
import { ReportDownloadButton } from '@/components/reports/report-download-button';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';

export const metadata = {
  title: 'Reportes · GNS Gestión de Negocios SarriaTech',
  description: 'Informes de ventas, inventario y rendimiento.',
};

/* ─── Report Card Definition ─────────────────────────────────── */
interface ReportCard {
  title: string;
  description: string;
  details: string[];
  href: string;
  filename: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentBar: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
}

const REPORTS: ReportCard[] = [
  {
    title: 'Catálogo de Productos',
    description: 'Listado completo de todos los productos con precios, márgenes y estado actual de inventario.',
    details: [
      'Código y nombre del producto',
      'Categoría y proveedor',
      'Costo unitario y precio de venta',
      'Margen de ganancia (%)',
      'Unidades vendidas y stock disponible',
    ],
    href: '/api/reports/products',
    filename: 'catalogo_productos.xlsx',
    icon: Package,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accentBar: 'bg-violet-500',
    badgeLabel: 'Productos',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
  },
  {
    title: 'Historial de Ventas',
    description: 'Registro completo de todas las transacciones realizadas con detalle de productos, totales y método de pago.',
    details: [
      'Número de venta y fecha',
      'Cliente y productos comprados',
      'Cantidades y totales por venta',
      'Descuentos aplicados',
      'Método de pago y estado',
    ],
    href: '/api/reports/sales',
    filename: 'historial_ventas.xlsx',
    icon: ShoppingCart,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accentBar: 'bg-emerald-500',
    badgeLabel: 'Ventas',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  {
    title: 'Reporte de Stock',
    description: 'Estado actual de inventario por producto con alertas de stock bajo o agotado.',
    details: [
      'Código, nombre y grupo del producto',
      'Categoría a la que pertenece',
      'Stock actual vs stock mínimo',
      'Estado: OK / BAJO / AGOTADO',
      'Ordenado por menor disponibilidad',
    ],
    href: '/api/reports/stock',
    filename: 'reporte_stock.xlsx',
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accentBar: 'bg-amber-500',
    badgeLabel: 'Inventario',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
  },
  {
    title: 'Proveedores',
    description: 'Directorio completo de proveedores registrados con información de contacto y número de productos asociados.',
    details: [
      'Razón social y persona de contacto',
      'Teléfono, email y dirección',
      'Ciudad y país',
      'Cantidad de productos asociados',
      'Estado del proveedor',
    ],
    href: '/api/reports/suppliers',
    filename: 'proveedores.xlsx',
    icon: Truck,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    accentBar: 'bg-sky-500',
    badgeLabel: 'Proveedores',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
  },
  {
    title: 'Historial de Compras',
    description: 'Registro de todas las órdenes de compra emitidas a proveedores y su estado de pago.',
    details: [
      'Número de orden y fecha',
      'Proveedor asignado',
      'Costos (subtotal, impuestos, total)',
      'Notas y fecha esperada',
      'Estado (Borrador, Enviada, Recibida, etc.)',
    ],
    href: '/api/reports/purchases',
    filename: 'historial_compras.xlsx',
    icon: Briefcase,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    accentBar: 'bg-blue-500',
    badgeLabel: 'Compras',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
  },
  {
    title: 'Nómina Generada',
    description: 'Resumen detallado de todos los pagos realizados a empleados, incluyendo bonos y deducciones.',
    details: [
      'Código de nómina y período',
      'Empleado y número de documento',
      'Cargo y salario base',
      'Adiciones y deducciones',
      'Neto pagado y estado del pago',
    ],
    href: '/api/reports/payroll',
    filename: 'reporte_nomina.xlsx',
    icon: Calculator,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    accentBar: 'bg-rose-500',
    badgeLabel: 'Nómina',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
  },
  {
    title: 'Directorio de Empleados',
    description: 'Base de datos completa con la información personal y contractual de todos los empleados.',
    details: [
      'Nombres, apellidos y documento',
      'Cargo asignado y salario base',
      'Datos de contacto (email, teléfono)',
      'Fecha de contratación',
      'Estado activo/inactivo',
    ],
    href: '/api/reports/employees',
    filename: 'directorio_empleados.xlsx',
    icon: Users,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    accentBar: 'bg-teal-500',
    badgeLabel: 'Empleados',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
  },
];

/* ─── Page ──────────────────────────────────────────────────── */
export default async function ReportesPage() {
  const session = await getAuthSession();
  const companyId = await getSessionCompanyId();
  const companyFilter = session?.user?.role !== 'SUPERADMIN' && companyId 
    ? { companyId } 
    : {};

  const [categories, suppliers, groups, productMappings] = await Promise.all([
    prisma.category.findMany({ where: companyFilter, select: { id: true, name: true, productGroupId: true }, orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ where: companyFilter, select: { id: true, companyName: true }, orderBy: { companyName: 'asc' } }),
    prisma.productGroup.findMany({ where: companyFilter, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.product.findMany({ where: companyFilter, select: { type: true, productGroupId: true, categoryId: true, supplierId: true } })
  ]);

  const lookupData = { categories, suppliers, groups, productMappings };

  return (
    <div className="p-4 sm:p-6 space-y-8">

      {/* ── Header ── */}
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#8B5CF6]">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Centro de Reportes</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Descarga reportes en formato Excel (.xlsx) con la información actualizada de tu empresa.
              Cada reporte incluye sólo los datos de tu organización.
            </p>
          </div>
        </div>

        {/* Info strip */}
        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { label: 'Formato', value: 'Excel (.xlsx)' },
            { label: 'Datos', value: 'En tiempo real' },
            { label: 'Alcance', value: 'Tu empresa' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#8B5CF6]" />
              <span className="text-xs text-muted-foreground">{label}:</span>
              <span className="text-xs font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Report Cards Grid ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.href}
              className="
                group relative overflow-hidden rounded-3xl border border-border
                bg-card shadow-sm transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
              "
            >
              {/* Colored top accent bar */}
              <div className={`h-1.5 w-full ${report.accentBar}`} />

              <div className="p-7">
                {/* Card header */}
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${report.iconBg}`}>
                    <Icon className={`h-6 w-6 ${report.iconColor}`} />
                  </div>
                  <span
                    className={`
                      inline-flex items-center rounded-full px-3 py-1
                      text-xs font-medium ${report.badgeBg} ${report.badgeText}
                    `}
                  >
                    {report.badgeLabel}
                  </span>
                </div>

                {/* Title & description */}
                <div className="mt-5">
                  <h2 className="text-lg font-bold text-foreground">{report.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {report.description}
                  </p>
                </div>

                {/* Column list */}
                <ul className="mt-5 space-y-1.5">
                  {report.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${report.accentBar}`} />
                      {detail}
                    </li>
                  ))}
                </ul>

                {/* Divider */}
                <div className="my-6 border-t border-border" />

                {/* Download button */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted-foreground">
                    Archivo: <span className="font-mono">{report.filename}</span>
                  </span>
                  <ReportDownloadButton href={report.href} reportType={report.href.split('/').pop() || ''} lookupData={lookupData} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer note ── */}
      <p className="text-center text-xs text-muted-foreground pb-2">
        Los reportes se generan en tiempo real con los datos actuales de tu empresa.
        Ábrelos con Microsoft Excel, Google Sheets o LibreOffice Calc.
      </p>
    </div>
  );
}
