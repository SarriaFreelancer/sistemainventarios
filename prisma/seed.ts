import { PrismaClient, CustomerStatus, OpportunityStage } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123', 10);

  // Clear existing data in reverse order of dependencies
  await prisma.auditLog.deleteMany();
  await prisma.saleDetail.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productGroup.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.roleModule.deleteMany();
  await prisma.companyModule.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.company.deleteMany();

  // Create roles
  const adminRole = await prisma.role.create({ data: { name: 'ADMIN' } });
  const superAdminRole = await prisma.role.create({ data: { name: 'SUPERADMIN' } });
  const userRole = await prisma.role.create({ data: { name: 'USER' } });

  // Create sample companies
  const mainCompany = await prisma.company.create({
    data: {
      name: 'Dulche Dorelle S.A.S.',
      address: 'Calle 95 #14-60',
      city: 'Bogotá',
      country: 'Colombia',
      status: 'ACTIVE',
    },
  });

  const partnerCompany = await prisma.company.create({
    data: {
      name: 'Glitz Beauty SAS',
      address: 'Carrera 15 #82-23',
      city: 'Medellín',
      country: 'Colombia',
      status: 'ACTIVE',
    },
  });

  // Create admin user scoped to the main company
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Dulche Dorelle',
      email: 'admin@dulchedorelle.com',
      password: passwordHash,
      roleId: adminRole.id,
      companyId: mainCompany.id,
    },
  });

  // Create super‑admin user without company scope
  const superAdminUser = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@dulchedorelle.com',
      password: passwordHash,
      roleId: superAdminRole.id,
    },
  });

  // Create a sample company-scoped user
  await prisma.user.create({
    data: {
      name: 'Laura Ortiz',
      email: 'laura@glitzbeauty.co',
      password: passwordHash,
      roleId: adminRole.id,
      companyId: partnerCompany.id,
    },
  });

  // Create Modules (Dynamic Menu)
  const systemModules = [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', description: 'Resumen del negocio y métricas clave' },
    { name: 'Productos', href: '/dashboard/products', icon: 'Boxes', description: 'Gestiona el catálogo y stock' },
    { name: 'Grupos', href: '/dashboard/groups', icon: 'Folder', description: 'Agrupa productos por colecciones' },
    { name: 'Categorías', href: '/dashboard/categories', icon: 'Tags', description: 'Organiza productos por categoría' },
    { name: 'Proveedores', href: '/dashboard/suppliers', icon: 'Factory', description: 'Gestiona proveedores y contactos' },
    { name: 'Ventas', href: '/dashboard/sales', icon: 'ShoppingCart', description: 'Registra y revisa transacciones' },
    { name: 'CRM', href: '/dashboard/crm', icon: 'Users', description: 'Gestiona clientes y relaciones comerciales' },
    { name: 'Usuarios', href: '/dashboard/users', icon: 'Users', description: 'Administra cuentas, roles y permisos de usuario' },
    { name: 'Empresas', href: '/dashboard/companies', icon: 'Folder', description: 'Gestiona las empresas y sus usuarios' },
    { name: 'Compras', href: '/dashboard/compras', icon: 'Truck', description: 'Supervisa órdenes de compra' },
    { name: 'Finanzas', href: '/dashboard/finanzas', icon: 'DollarSign', description: 'Monitorea ingresos y gastos' },
    { name: 'Reportes', href: '/dashboard/reportes', icon: 'FileText', description: 'Genera análisis e informes clave' },
  ];

  for (const mod of systemModules) {
    const createdModule = await prisma.module.create({
      data: {
        name: mod.name,
        href: mod.href,
        icon: mod.icon,
        description: mod.description,
        isActive: true,
      }
    });

    // Assign to SUPERADMIN and main company by default
    await prisma.roleModule.create({
      data: { roleId: superAdminRole.id, moduleId: createdModule.id }
    });

    await prisma.companyModule.create({
      data: { companyId: mainCompany.id, moduleId: createdModule.id }
    });
  }

  // Create groups in database
  const groupNames = ['Maquillaje', 'Accesorios', 'Skincare', 'Capilar', 'Corporal', 'Perfumería', 'Otros'];
  const createdGroups: any[] = [];
  for (const name of groupNames) {
    const group = await prisma.productGroup.create({
      data: { name, status: 'ACTIVE', companyId: mainCompany.id }
    });
    createdGroups.push(group);
  }

  const getGroupIdByName = (name: string) => {
    return createdGroups.find(g => g.name.toLowerCase() === name.toLowerCase())?.id ?? null;
  };

  // Create categories inspired by premium cosmetics
  const categoryNames = [
    { name: 'Labiales Matte', description: 'Labiales líquidos y en barra de larga duración' },
    { name: 'Paletas de Sombras', description: 'Sombras ultra pigmentadas satinadas y mate' },
    { name: 'Bases y Correctores', description: 'Fórmulas hidratantes de alta cobertura' },
    { name: 'Sérums Faciales', description: 'Tratamientos concentrados antiedad e hidratación' },
    { name: 'Limpieza Facial', description: 'Aguas micelares, geles limpiadores y tónicos' },
    { name: 'Brochas y Esponjas', description: 'Herramientas de aplicación profesional' },
    { name: 'Fragancias Premium', description: 'Perfumes exclusivos de alta fijación' },
  ];
  const createdCategories: any[] = [];
  for (const c of categoryNames) {
    const cat = await prisma.category.create({
      data: { ...c, companyId: mainCompany.id }
    });
    createdCategories.push(cat);
  }

  // Create suppliers
  const supplierNames = [
    { companyName: 'Dorelle Beauty Corp', contactName: 'Isabella Ross', phone: '3104567890', email: 'isabella@dorellebeauty.com', address: 'Av. Lujo 123', city: 'Bogotá', country: 'Colombia' },
    { companyName: 'Cosméticos Satin S.A.', contactName: 'Alejandro Sanz', phone: '3157891234', email: 'ventas@satincosmeticos.com', address: 'Calle Perlada 45', city: 'Medellín', country: 'Colombia' },
    { companyName: 'Esencias de París S.A.S.', contactName: 'Camille Dupont', phone: '3209876543', email: 'cdupont@esenciasparis.com', address: 'Carrera Diamante 89', city: 'Cali', country: 'Colombia' },
    { companyName: 'Accesorios Glitz & Glam', contactName: 'Valeria Gómez', phone: '3001234567', email: 'valeria@glitzglam.co', address: 'Diag. Cristal 12', city: 'Barranquilla', country: 'Colombia' },
  ];
  const createdSuppliers: any[] = [];
  for (const s of supplierNames) {
    const sup = await prisma.supplier.create({
      data: { ...s, companyId: mainCompany.id }
    });
    createdSuppliers.push(sup);
  }

  const customerData = [
    { name: 'Juliana Restrepo', email: 'juliana.restrepo@mail.com', phone: '3101234567', company: 'Restrepo Boutique', address: 'Calle 50 #12-34', city: 'Bogotá', status: CustomerStatus.ACTIVE },
    { name: 'Camila Gómez', email: 'camila.gomez@mail.com', phone: '3150987654', company: 'Gómez Beauty', address: 'Carrera 10 #20-15', city: 'Medellín', status: CustomerStatus.ACTIVE },
    { name: 'Mariana Mesa', email: 'mariana.mesa@mail.com', phone: '3123456789', company: 'Mesa Cosmetics', address: 'Av. 4 #16-72', city: 'Cali', status: CustomerStatus.PROSPECT },
    { name: 'Lucía Pérez', email: 'lucia.perez@mail.com', phone: '3169876543', company: 'Pérez Estética', address: 'Calle 80 #22-10', city: 'Barranquilla', status: CustomerStatus.ACTIVE },
    { name: 'Sofía Vergara', email: 'sofia.vergara@mail.com', phone: '3132468101', company: 'Vergara Spa', address: 'Av. 7 #35-50', city: 'Cartagena', status: CustomerStatus.PROSPECT },
  ];

  const createdCustomers: any[] = [];
  for (const customer of customerData) {
    const created = await prisma.customer.create({ data: { ...customer, companyId: mainCompany.id } });
    createdCustomers.push(created);
  }

  const opportunities = [
    { title: 'Nueva línea de maquillaje de temporada', customerIndex: 0, stage: OpportunityStage.QUALIFIED, estimatedValue: 950000, probability: 75 },
    { title: 'Acuerdo de suministro mensual', customerIndex: 1, stage: OpportunityStage.CONTACTED, estimatedValue: 450000, probability: 40 },
    { title: 'Capacitación para equipo de ventas', customerIndex: 2, stage: OpportunityStage.PROPOSAL, estimatedValue: 320000, probability: 55 },
    { title: 'Renovación de contrato de cosmetics', customerIndex: 3, stage: OpportunityStage.NEW, estimatedValue: 220000, probability: 30 },
  ];

  for (const opportunity of opportunities) {
    await prisma.opportunity.create({
      data: {
        title: opportunity.title,
        customerId: createdCustomers[opportunity.customerIndex].id,
        stage: opportunity.stage,
        estimatedValue: opportunity.estimatedValue,
        probability: opportunity.probability,
        companyId: mainCompany.id,
      },
    });
  }

  // Create products with group relation
  const productTemplates = [
    { name: 'Labial Matte Rouge Satin', price: 45000, cost: 22000, catIdx: 0, supIdx: 0, groupName: 'Maquillaje', code: 'LIP-001' },
    { name: 'Gloss Voluminizador Rose Gold', price: 38000, cost: 18000, catIdx: 0, supIdx: 0, groupName: 'Maquillaje', code: 'LIP-002' },
    { name: 'Paleta Amore Lilac 18 Tonos', price: 120000, cost: 60000, catIdx: 1, supIdx: 1, groupName: 'Maquillaje', code: 'EYE-001' },
    { name: 'Delineador Pearl Liquid Violet', price: 29000, cost: 14000, catIdx: 1, supIdx: 1, groupName: 'Maquillaje', code: 'EYE-002' },
    { name: 'Base Hydra Glow Tono 02', price: 68000, cost: 32000, catIdx: 2, supIdx: 0, groupName: 'Maquillaje', code: 'FAC-001' },
    { name: 'Corrector Velvet Touch Cream', price: 35000, cost: 16000, catIdx: 2, supIdx: 1, groupName: 'Maquillaje', code: 'FAC-002' },
    { name: 'Sérum Ácido Hialurónico 2%', price: 85000, cost: 40000, catIdx: 3, supIdx: 2, groupName: 'Skincare', code: 'SKN-001' },
    { name: 'Crema Hidratante Lavender Dew', price: 92000, cost: 45000, catIdx: 3, supIdx: 2, groupName: 'Skincare', code: 'SKN-002' },
    { name: 'Agua Micelar Infusión de Rosas', price: 28000, cost: 12000, catIdx: 4, supIdx: 2, groupName: 'Skincare', code: 'SKN-003' },
    { name: 'Set Brochas Premium Gold (12 u.)', price: 150000, cost: 70000, catIdx: 5, supIdx: 3, groupName: 'Accesorios', code: 'ACC-001' },
    { name: 'Esponja Microfibra Silk Orchid', price: 18000, cost: 7000, catIdx: 5, supIdx: 3, groupName: 'Accesorios', code: 'ACC-002' },
    { name: 'Perfume Dorelle Nuit Eau de Parfum', price: 240000, cost: 110000, catIdx: 6, supIdx: 2, groupName: 'Perfumería', code: 'FRG-001' },
    { name: 'Bruma Capilar Destello Morado', price: 42000, cost: 19000, catIdx: 6, supIdx: 1, groupName: 'Capilar', code: 'FRG-002' },
    { name: 'Óleo Reparador de Argán y Coco', price: 56000, cost: 26000, catIdx: 3, supIdx: 1, groupName: 'Capilar', code: 'CAP-001' },
    { name: 'Exfoliante Corporal Lavanda y Azúcar', price: 48000, cost: 22000, catIdx: 4, supIdx: 0, groupName: 'Corporal', code: 'BDY-001' },
  ];

  const createdProducts = [];
  for (let i = 0; i < productTemplates.length; i++) {
    const t = productTemplates[i];
    const category = createdCategories[t.catIdx % createdCategories.length];
    const supplier = createdSuppliers[t.supIdx % createdSuppliers.length];

    const p = await prisma.product.create({
      data: {
        code: t.code,
        name: t.name,
        categoryId: category.id,
        supplierId: supplier.id,
        quantityAvailable: i % 4 === 0 ? 0 : 25 + i * 2,
        unitCost: t.cost,
        salePrice: t.price,
        soldQuantity: 10 + i * 3,
        productGroupId: getGroupIdByName(t.groupName),
        companyId: mainCompany.id,
      },
    });
    createdProducts.push(p);
  }

  // Create historical Sales data (e.g. over the last 6 months)
  const clientNames = ['Juliana Restrepo', 'Camila Gómez', 'Mariana Mesa', 'Lucía Pérez', 'Sofía Vergara', 'Paola Turbay'];
  const paymentMethods = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];
  const baseDate = new Date();
  
  for (let i = 1; i <= 24; i++) {
    const saleDate = new Date();
    saleDate.setMonth(baseDate.getMonth() - (i % 6));
    saleDate.setDate(1 + (i * 3) % 28);
    saleDate.setHours(10 + (i % 8), (i * 12) % 60, 0);

    const client = i % 3 === 0 ? null : clientNames[i % clientNames.length];
    const paymentMethod = paymentMethods[i % paymentMethods.length];
    
    const detailsData = [];
    let saleTotal = 0;
    const numItems = 1 + (i % 3);
    
    for (let k = 0; k < numItems; k++) {
      const prod = createdProducts[(i + k * 3) % createdProducts.length];
      const qty = 1 + (i % 2);
      const price = Number(prod.salePrice);
      const subtotal = qty * price;
      saleTotal += subtotal;
      
      detailsData.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: price,
        subtotal: subtotal,
        discount: 0,
        total: subtotal
      });
    }

    const discount = i % 4 === 0 ? 10000 : 0;
    const finalTotal = Math.max(0, saleTotal - discount);

    const sale = await prisma.sale.create({
      data: {
        saleNumber: `VEN-${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, '0')}${String(saleDate.getDate()).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
        userId: adminUser.id,
        client,
        discount,
        total: finalTotal,
        paymentMethod,
        status: 'COMPLETED',
        companyId: mainCompany.id,
        createdAt: saleDate,
        updatedAt: saleDate,
        details: {
          create: detailsData.map(d => ({
            productId: d.productId,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            subtotal: d.subtotal,
            discount: d.discount,
            total: d.total,
            companyId: mainCompany.id,
            createdAt: saleDate,
            updatedAt: saleDate,
          }))
        }
      }
    });

    for (const d of detailsData) {
      await prisma.product.update({
        where: { id: d.productId },
        data: {
          soldQuantity: { increment: d.quantity }
        }
      });
    }
  }

  console.log('Seed ejecutado correctamente con grupos de producto e historial de ventas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

