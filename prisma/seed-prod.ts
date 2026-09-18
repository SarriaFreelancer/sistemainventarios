import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando inicializacion limpia de produccion...');

  const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@gnsgestion.com';
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'Admin123';
  const passwordHash = await bcrypt.hash(superAdminPassword, 10);

  // 1. Roles del Sistema (upsert)
  console.log('Creando roles del sistema...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: { name: 'SUPERADMIN' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  // 2. Empresa Global para Superadmin (upsert)
  console.log('Creando empresa Global...');
  const globalCompany = await prisma.company.upsert({
    where: { name: 'Global' },
    update: {},
    create: {
      name: 'Global',
      address: 'N/A',
      city: 'N/A',
      country: 'Colombia',
      status: 'ACTIVE',
    },
  });

  // 3. Usuario Superadmin (upsert)
  console.log(`Creando usuario Superadmin (${superAdminEmail})...`);
  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      password: passwordHash,
      roleId: superAdminRole.id,
      companyId: globalCompany.id,
    },
    create: {
      name: 'Super Admin',
      email: superAdminEmail,
      password: passwordHash,
      roleId: superAdminRole.id,
      companyId: globalCompany.id,
      rememberMe: false,
    },
  });

  // 4. Modulos del Sistema (Menu Dinamico)
  console.log('Registrando modulos del sistema...');
  const systemModules = [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', description: 'Resumen del negocio y metricas clave' },
    { name: 'Productos', href: '/dashboard/products', icon: 'Boxes', description: 'Gestiona el catalogo y stock' },
    { name: 'Grupos', href: '/dashboard/groups', icon: 'Folder', description: 'Agrupa productos por colecciones' },
    { name: 'Categorias', href: '/dashboard/categories', icon: 'Tags', description: 'Organiza productos por categoria' },
    { name: 'Proveedores', href: '/dashboard/suppliers', icon: 'Factory', description: 'Gestiona proveedores y contactos' },
    { name: 'Ventas', href: '/dashboard/sales', icon: 'ShoppingCart', description: 'Registra y revisa transacciones' },
    { name: 'CRM', href: '/dashboard/crm', icon: 'Users', description: 'Gestiona clientes y relaciones comerciales' },
    { name: 'Usuarios', href: '/dashboard/users', icon: 'Users', description: 'Administra cuentas, roles y permisos' },
    { name: 'Empresas', href: '/dashboard/companies', icon: 'Folder', description: 'Gestiona las empresas del SaaS' },
    { name: 'Compras', href: '/dashboard/compras', icon: 'Truck', description: 'Modulo de compras y abastecimiento' },
    { name: 'Finanzas', href: '/dashboard/finanzas', icon: 'DollarSign', description: 'Monitorea ingresos y gastos' },
    { name: 'RRHH', href: '/dashboard/rrhh', icon: 'Users', description: 'Gestion de personal y nomina' },
    { name: 'Reportes', href: '/dashboard/reportes', icon: 'FileText', description: 'Genera analisis e informes clave' },
    { name: 'Auditoria', href: '/dashboard/audit', icon: 'ShieldAlert', description: 'Trazabilidad de seguridad y logs' },
    { name: 'Configuracion', href: '/dashboard/settings', icon: 'Settings', description: 'Configuracion de empresa y sistema' },
  ];

  for (const mod of systemModules) {
    const createdModule = await prisma.module.upsert({
      where: { name: mod.name },
      update: { href: mod.href, icon: mod.icon, description: mod.description },
      create: {
        name: mod.name,
        href: mod.href,
        icon: mod.icon,
        description: mod.description,
        isActive: true,
      },
    });

    // Asignar al Rol Superadmin y a la Empresa Global
    await prisma.roleModule.upsert({
      where: {
        roleId_moduleId: {
          roleId: superAdminRole.id,
          moduleId: createdModule.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        moduleId: createdModule.id,
      },
    });

    await prisma.companyModule.upsert({
      where: {
        companyId_moduleId: {
          companyId: globalCompany.id,
          moduleId: createdModule.id,
        },
      },
      update: {},
      create: {
        companyId: globalCompany.id,
        moduleId: createdModule.id,
      },
    });
  }

  console.log('Inicializacion de produccion completada con exito.');
  console.log(`Email: ${superAdminEmail}`);
  console.log(`Password: ${superAdminPassword}`);
}

main()
  .catch((e) => {
    console.error('Error en seed de produccion:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
