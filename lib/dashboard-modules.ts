import type { LucideIcon } from 'lucide-react';
import { Boxes, Factory, LayoutDashboard, Tags, ShoppingCart, Folder, Users, Truck, DollarSign, FileText } from 'lucide-react';

export interface DashboardModule {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  roles?: string[];
}

export const dashboardModules: DashboardModule[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Resumen del negocio y métricas clave' },
  { label: 'Productos', href: '/dashboard/products', icon: Boxes, description: 'Gestiona el catálogo y stock' },
  { label: 'Grupos', href: '/dashboard/groups', icon: Folder, description: 'Agrupa productos por colecciones' },
  { label: 'Categorías', href: '/dashboard/categories', icon: Tags, description: 'Organiza productos por categoría' },
  { label: 'Proveedores', href: '/dashboard/suppliers', icon: Factory, description: 'Gestiona proveedores y contactos' },
  { label: 'Ventas', href: '/dashboard/sales', icon: ShoppingCart, description: 'Registra y revisa transacciones' },
  { label: 'CRM', href: '/dashboard/crm', icon: Users, description: 'Gestiona clientes y relaciones comerciales' },
  { label: 'Usuarios', href: '/dashboard/users', icon: Users, description: 'Administra cuentas, roles y permisos de usuario', roles: ['SUPERADMIN'] },
  { label: 'Empresas', href: '/dashboard/companies', icon: Folder, description: 'Gestiona las empresas y sus usuarios', roles: ['SUPERADMIN'] },
  { label: 'Compras', href: '/dashboard/compras', icon: Truck, description: 'Supervisa órdenes de compra' },
  { label: 'Finanzas', href: '/dashboard/finanzas', icon: DollarSign, description: 'Monitorea ingresos y gastos' },
  { label: 'Reportes', href: '/dashboard/reportes', icon: FileText, description: 'Genera análisis e informes clave' },
];
