import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function clearDatabase() {
  try {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Lista de tablas a limpiar con la capitalización exacta de los modelos Prisma
    const tables = [
      'Notification',
      'CompanySetting',
      'InvoiceCounter',
      'AuditLog',
      'SaleDetail',
      'Sale',
      'Opportunity',
      'Customer',
      'Product',
      'Category',
      'ProductGroup',
      'Supplier',
      'RoleModule',
      'CompanyModule',
      'Module',
      'User',
      'Role',
      'Company',
      'EmployeeNovelty',
      'PayrollDetail',
      'Payroll',
      'Employee',
      'Position',
      'InternalRequisitionItem',
      'InternalRequisition',
      'PurchasePayment',
      'AccountsPayable',
      'PurchaseInvoice',
      'PurchaseReceiptItem',
      'PurchaseReceipt',
      'InventoryEntryItem',
      'InventoryEntry',
      'PurchaseQuotationItem',
      'PurchaseQuotation',
      'PurchaseRequestItem',
      'PurchaseRequest',
      'PurchaseOrderLine',
      'PurchaseOrder',
    ];

    for (const table of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`).catch(() => {});
    }

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  } catch (error) {
    console.error('Error clearing test database:', error);
  }
}

export async function seedDatabase() {
  const passwordHash = await bcrypt.hash('Admin123', 10);

  // 1. Crear Roles de forma segura (upsert)
  const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
  const superAdminRole = await prisma.role.upsert({ where: { name: 'SUPERADMIN' }, update: {}, create: { name: 'SUPERADMIN' } });
  const userRole = await prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } });

  // 2. Crear Empresas de Prueba (upsert)
  const globalCompany = await prisma.company.upsert({
    where: { name: 'Global' },
    update: {},
    create: { name: 'Global', address: 'N/A', city: 'N/A', country: 'N/A', status: 'ACTIVE' },
  });

  const companyA = await prisma.company.upsert({
    where: { name: 'Empresa A Test' },
    update: {},
    create: { name: 'Empresa A Test', address: 'Calle A #12-34', city: 'Bogota', country: 'Colombia', status: 'ACTIVE' },
  });

  const companyB = await prisma.company.upsert({
    where: { name: 'Empresa B Test' },
    update: {},
    create: { name: 'Empresa B Test', address: 'Carrera B #56-78', city: 'Medellin', country: 'Colombia', status: 'ACTIVE' },
  });

  // 3. Crear Usuarios de Prueba (upsert)
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@gns-test.com' },
    update: { password: passwordHash, companyId: globalCompany.id, roleId: superAdminRole.id },
    create: {
      name: 'Super Admin Test',
      email: 'superadmin@gns-test.com',
      password: passwordHash,
      roleId: superAdminRole.id,
      companyId: globalCompany.id,
      preferences: { plainPassword: 'Admin123' },
    },
  });

  const adminA = await prisma.user.upsert({
    where: { email: 'adminA@gns-test.com' },
    update: { password: passwordHash, companyId: companyA.id, roleId: adminRole.id },
    create: {
      name: 'Admin Empresa A',
      email: 'adminA@gns-test.com',
      password: passwordHash,
      roleId: adminRole.id,
      companyId: companyA.id,
      preferences: { plainPassword: 'Admin123' },
    },
  });

  const userA = await prisma.user.upsert({
    where: { email: 'userA@gns-test.com' },
    update: { password: passwordHash, companyId: companyA.id, roleId: userRole.id },
    create: {
      name: 'User Empresa A',
      email: 'userA@gns-test.com',
      password: passwordHash,
      roleId: userRole.id,
      companyId: companyA.id,
      preferences: { plainPassword: 'Admin123' },
    },
  });

  const adminB = await prisma.user.upsert({
    where: { email: 'adminB@gns-test.com' },
    update: { password: passwordHash, companyId: companyB.id, roleId: adminRole.id },
    create: {
      name: 'Admin Empresa B',
      email: 'adminB@gns-test.com',
      password: passwordHash,
      roleId: adminRole.id,
      companyId: companyB.id,
      preferences: { plainPassword: 'Admin123' },
    },
  });

  // Crear configuración por defecto de la empresa para habilitar/deshabilitar stock negativo
  await prisma.companySetting.upsert({
    where: { companyId: companyA.id },
    update: { allowNegativeStock: false },
    create: {
      companyId: companyA.id,
      allowNegativeStock: false,
    }
  });

  await prisma.companySetting.upsert({
    where: { companyId: companyB.id },
    update: { allowNegativeStock: false },
    create: {
      companyId: companyB.id,
      allowNegativeStock: false,
    }
  });

  // 4. Módulos del Sistema
  const systemModules = [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', description: 'Resumen del negocio y métricas' },
    { name: 'Productos', href: '/dashboard/products', icon: 'Boxes', description: 'Catálogo de productos' },
    { name: 'Grupos', href: '/dashboard/groups', icon: 'Folder', description: 'Agrupa productos' },
    { name: 'Categorías', href: '/dashboard/categories', icon: 'Tags', description: 'Categoriza productos' },
    { name: 'Proveedores', href: '/dashboard/suppliers', icon: 'Factory', description: 'Gestión de proveedores' },
    { name: 'Ventas', href: '/dashboard/sales', icon: 'ShoppingCart', description: 'Registrar ventas' },
    { name: 'CRM', href: '/dashboard/crm', icon: 'Users', description: 'Clientes y embudo' },
    { name: 'Compras', href: '/dashboard/compras', icon: 'Truck', description: 'Módulo de compras' },
    { name: 'Finanzas', href: '/dashboard/finanzas', icon: 'DollarSign', description: 'Finanzas generales' },
    { name: 'RRHH', href: '/dashboard/rrhh', icon: 'Users', description: 'Nómina y personal' },
    { name: 'Reportes', href: '/dashboard/reportes', icon: 'FileText', description: 'Reportes ejecutivos' },
    { name: 'Auditoría', href: '/dashboard/audit', icon: 'ShieldAlert', description: 'Trazabilidad de logs' },
    { name: 'Configuración', href: '/dashboard/settings', icon: 'Settings', description: 'Configuraciones de empresa' },
    { name: 'Empresas', href: '/dashboard/companies', icon: 'Folder', description: 'Gestión global de empresas' },
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
      }
    });

    // Asignación a Superadmin y Global
    await prisma.roleModule.create({ data: { roleId: superAdminRole.id, moduleId: createdModule.id } });
    await prisma.companyModule.create({ data: { companyId: globalCompany.id, moduleId: createdModule.id } });

    // Asignación a empresas de prueba
    await prisma.companyModule.create({ data: { companyId: companyA.id, moduleId: createdModule.id } });
    await prisma.companyModule.create({ data: { companyId: companyB.id, moduleId: createdModule.id } });

    // Asignación al rol USER para Empresa A
    const userModules = ['Dashboard', 'Productos', 'Grupos', 'Categorías', 'Proveedores', 'Ventas', 'CRM', 'Compras', 'Finanzas', 'Reportes'];
    if (userModules.includes(mod.name)) {
      await prisma.roleModule.create({ data: { roleId: userRole.id, moduleId: createdModule.id } }).catch(() => {});
    }
  }

  // 5. Configurar Grupo y Categoría por defecto en Empresa A (para tests de productos)
  const defaultGroup = await prisma.productGroup.create({
    data: { name: 'Grupo Test', code: 'GRP-TST', status: 'ACTIVE', companyId: companyA.id }
  });

  const defaultCategory = await prisma.category.create({
    data: { name: 'Categoría Test', code: 'CAT-TST', description: 'Test', status: 'ACTIVE', companyId: companyA.id, productGroupId: defaultGroup.id }
  });

  const defaultSupplier = await prisma.supplier.create({
    data: { companyName: 'Proveedor Test', code: 'PROV-TST', contactName: 'Juan', email: 'prov@test.com', phone: '1234', address: 'Calle 1', city: 'Bogota', companyId: companyA.id }
  });

  // Configurar Grupo y Categoría por defecto en Empresa B (para tests de aislamiento)
  const defaultGroupB = await prisma.productGroup.create({
    data: { name: 'Grupo Test B', code: 'GRP-TST-B', status: 'ACTIVE', companyId: companyB.id }
  });

  const defaultCategoryB = await prisma.category.create({
    data: { name: 'Categoría Test B', code: 'CAT-TST-B', description: 'Test B', status: 'ACTIVE', companyId: companyB.id, productGroupId: defaultGroupB.id }
  });

  const defaultSupplierB = await prisma.supplier.create({
    data: { companyName: 'Proveedor Test B', code: 'PROV-TST-B', contactName: 'Pedro', email: 'provB@test.com', phone: '5678', address: 'Calle 2', city: 'Medellin', companyId: companyB.id }
  });

  // Crear un cargo (Position) por defecto en Empresa A (para tests de RRHH)
  const defaultPosition = await prisma.position.create({
    data: {
      name: 'Desarrollador',
      baseSalary: 1200000,
      companyId: companyA.id
    }
  });

  return {
    companyA,
    companyB,
    adminA,
    userA,
    adminB,
    defaultGroup,
    defaultCategory,
    defaultSupplier,
    defaultCategoryB,
    defaultSupplierB,
    defaultPosition
  };
}
