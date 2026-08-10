import { PrismaClient, CustomerStatus, OpportunityStage, ProductType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123', 10);

  // Desactivar restricciones de clave foránea temporalmente en MySQL para una limpieza 100% segura
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  
  await prisma.companySetting.deleteMany();
  await prisma.invoiceCounter.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.purchaseOrder?.deleteMany().catch(() => {});
  await prisma.saleDetail.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.productGroup.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.roleModule.deleteMany();
  await prisma.companyModule.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.company.deleteMany();

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  // Create roles
  const adminRole = await prisma.role.create({ data: { name: 'ADMIN' } });
  const superAdminRole = await prisma.role.create({ data: { name: 'SUPERADMIN' } });
  const userRole = await prisma.role.create({ data: { name: 'USER' } });

  // Create sample companies
  const globalCompany = await prisma.company.create({
    data: {
      name: 'Global',
      address: 'N/A',
      city: 'N/A',
      country: 'N/A',
      status: 'ACTIVE',
    },
  });

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

  // Create admin user scoped to main company
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Dulche Dorelle',
      email: 'admin@dulchedorelle.com',
      password: passwordHash,
      roleId: adminRole.id,
      companyId: mainCompany.id,
      preferences: { plainPassword: 'Admin123' },
    },
  });

  // Create super‑admin user scoped to Global company
  await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@gnsgestion.com',
      password: passwordHash,
      roleId: superAdminRole.id,
      companyId: globalCompany.id,
      preferences: { plainPassword: 'Admin123' },
    },
  });

  // Create sample company user
  await prisma.user.create({
    data: {
      name: 'Laura Ortiz',
      email: 'laura@glitzbeauty.co',
      password: passwordHash,
      roleId: adminRole.id,
      companyId: partnerCompany.id,
      preferences: { plainPassword: 'Admin123' },
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

    await prisma.roleModule.create({ data: { roleId: superAdminRole.id, moduleId: createdModule.id } });
    await prisma.companyModule.create({ data: { companyId: globalCompany.id, moduleId: createdModule.id } });

    const userModules = ['Dashboard', 'Productos', 'Grupos', 'Categorías', 'Proveedores', 'Ventas', 'CRM', 'Compras', 'Finanzas', 'Reportes'];
    if (userModules.includes(mod.name)) {
      await prisma.roleModule.create({ data: { roleId: userRole.id, moduleId: createdModule.id } }).catch(() => {});
    }

    await prisma.companyModule.create({ data: { companyId: mainCompany.id, moduleId: createdModule.id } });
    await prisma.companyModule.create({ data: { companyId: partnerCompany.id, moduleId: createdModule.id } });
  }

  // 1. CREAR GRUPOS CON CÓDIGOS REALES (10 Grupos)
  const groupDefs = [
    { name: 'Maquillaje Profesional', code: 'GRP-MAQ' },
    { name: 'Cuidado Facial & Skincare', code: 'GRP-SKN' },
    { name: 'Cuidado Capilar & Estilo', code: 'GRP-CAP' },
    { name: 'Cuidado Corporal & Spa', code: 'GRP-COR' },
    { name: 'Perfumería & Fragancias', code: 'GRP-PER' },
    { name: 'Accesorios & Herramientas', code: 'GRP-ACC' },
    { name: 'Materias Primas & Químicos', code: 'GRP-MPR' },
    { name: 'Empaques & Suministros', code: 'GRP-SUM' },
    { name: 'Servicios & Asesorías', code: 'GRP-SER' },
    { name: 'Equipos & Activos Fijos', code: 'GRP-ACT' },
  ];

  const createdGroups: any[] = [];
  for (const g of groupDefs) {
    const group = await prisma.productGroup.create({
      data: { name: g.name, code: g.code, status: 'ACTIVE', companyId: mainCompany.id }
    });
    createdGroups.push(group);
  }

  const getGroupIdByCode = (code: string) => createdGroups.find(g => g.code === code)?.id ?? createdGroups[0].id;

  // 2. CREAR CATEGORÍAS CON CÓDIGOS REALES (20 Categorías)
  const categoryDefs = [
    { name: 'Labiales & Brillos', code: 'CAT-LAB', groupCode: 'GRP-MAQ', description: 'Labiales líquidos, en barra y gloss voluminizadores' },
    { name: 'Sombras & Ojos', code: 'CAT-EYE', groupCode: 'GRP-MAQ', description: 'Paletas de sombras, delineadores y pestañinas' },
    { name: 'Rostro & Cobertura', code: 'CAT-ROS', groupCode: 'GRP-MAQ', description: 'Bases hidratantes, correctores y polvos sueltos' },
    { name: 'Sérums & Ampollas', code: 'CAT-SER', groupCode: 'GRP-SKN', description: 'Fórmulas concentradas con ácido hialurónico y niacinamida' },
    { name: 'Limpieza & Tónicos', code: 'CAT-LMP', groupCode: 'GRP-SKN', description: 'Aguas micelares, geles limpiadores y desmaquillantes' },
    { name: 'Protección Solar', code: 'CAT-SOL', groupCode: 'GRP-SKN', description: 'Bloqueadores solares SPF 50+ con y sin color' },
    { name: 'Tratamientos Capilares', code: 'CAT-TRT', groupCode: 'GRP-CAP', description: 'Mascarillas de keratina, óleos y ampollas reparadoras' },
    { name: 'Champús & Acondicionadores', code: 'CAT-SHA', groupCode: 'GRP-CAP', description: 'Fórmulas libres de sulfatos y parabenos' },
    { name: 'Exfoliantes & Cremas', code: 'CAT-EXF', groupCode: 'GRP-COR', description: 'Exfoliantes de café y mantecas hidratantes de cacao' },
    { name: 'Aceites & Mantequillas', code: 'CAT-OIL', groupCode: 'GRP-COR', description: 'Aceites secos corporal y mantecas de karité' },
    { name: 'Perfumes Luxury', code: 'CAT-FRG', groupCode: 'GRP-PER', description: 'Fragancias exclusivas Eau de Parfum de alta fijación' },
    { name: 'Brochas & Aplicadores', code: 'CAT-BRO', groupCode: 'GRP-ACC', description: 'Kits de brochas profesionales y esponjas de microfibra' },
    { name: 'Ingredientes Orgánicos', code: 'CAT-ING', groupCode: 'GRP-MPR', description: 'Aceites puros, mantequillas sin refinar y ceras' },
    { name: 'Activos Cosméticos', code: 'CAT-ACT', groupCode: 'GRP-MPR', description: 'Polvos de ácido hialurónico, elastina y vitaminas' },
    { name: 'Frascos & Contenedores', code: 'CAT-FRS', groupCode: 'GRP-SUM', description: 'Frascos gotero de vidrio ámbar y potes acrílicos' },
    { name: 'Cajas & Embalajes', code: 'CAT-CAJ', groupCode: 'GRP-SUM', description: 'Cajas rígidas de regalo y etiquetas térmicas autoadhesivas' },
    { name: 'Asesorías & Cursos', code: 'CAT-CON', groupCode: 'GRP-SER', description: 'Talleres de automaquillaje y diagnóstico capilar 3D' },
    { name: 'Servicios de Estética', code: 'CAT-SPA', groupCode: 'GRP-SER', description: 'Servicios de maquillaje para novias y limpieza facial' },
    { name: 'Maquinaria de Producción', code: 'CAT-MAQ', groupCode: 'GRP-ACT', description: 'Mezcladoras industriales, llenadoras y autoclaves' },
    { name: 'Mobiliario & Equipos POS', code: 'CAT-MOB', groupCode: 'GRP-ACT', description: 'Muebles exhibidores LED y equipos de cómputo POS' },
  ];

  const createdCategories: any[] = [];
  for (const c of categoryDefs) {
    const groupId = getGroupIdByCode(c.groupCode);
    const cat = await prisma.category.create({
      data: {
        name: c.name,
        code: c.code,
        description: c.description,
        productGroupId: groupId,
        companyId: mainCompany.id,
      }
    });
    createdCategories.push(cat);
  }

  const getCatIdByCode = (code: string) => createdCategories.find(c => c.code === code)?.id ?? createdCategories[0].id;

  // 3. CREAR PROVEEDORES
  const supplierDefs = [
    { companyName: 'Dorelle Beauty Corp', contactName: 'Isabella Ross', phone: '3104567890', email: 'isabella@dorellebeauty.com', address: 'Av. Lujo 123', city: 'Bogotá', country: 'Colombia' },
    { companyName: 'Cosméticos Satin S.A.', contactName: 'Alejandro Sanz', phone: '3157891234', email: 'ventas@satincosmeticos.com', address: 'Calle Perlada 45', city: 'Medellín', country: 'Colombia' },
    { companyName: 'Esencias & Químicos de Colombia', contactName: 'Camille Dupont', phone: '3209876543', email: 'cdupont@esenciasparis.com', address: 'Carrera Diamante 89', city: 'Cali', country: 'Colombia' },
    { companyName: 'Empaques Industriales del Valle', contactName: 'Carlos Mendoza', phone: '3185554321', email: 'contacto@empaquesvalle.com', address: 'Zona Industrial Lote 4', city: 'Yumbo', country: 'Colombia' },
    { companyName: 'Accesorios Glitz & Glam', contactName: 'Valeria Gómez', phone: '3001234567', email: 'valeria@glitzglam.co', address: 'Diag. Cristal 12', city: 'Barranquilla', country: 'Colombia' },
  ];

  const createdSuppliers: any[] = [];
  for (const s of supplierDefs) {
    const sup = await prisma.supplier.create({ data: { ...s, companyId: mainCompany.id } });
    createdSuppliers.push(sup);
  }

  // 4. CREAR CLIENTES
  const customerDefs = [
    { name: 'Juliana Restrepo', email: 'juliana.restrepo@mail.com', phone: '3101234567', company: 'Restrepo Boutique', address: 'Calle 50 #12-34', city: 'Bogotá', status: CustomerStatus.ACTIVE },
    { name: 'Camila Gómez', email: 'camila.gomez@mail.com', phone: '3150987654', company: 'Gómez Beauty', address: 'Carrera 10 #20-15', city: 'Medellín', status: CustomerStatus.ACTIVE },
    { name: 'Mariana Mesa', email: 'mariana.mesa@mail.com', phone: '3123456789', company: 'Mesa Cosmetics', address: 'Av. 4 #16-72', city: 'Cali', status: CustomerStatus.PROSPECT },
    { name: 'Lucía Pérez', email: 'lucia.perez@mail.com', phone: '3169876543', company: 'Pérez Estética', address: 'Calle 80 #22-10', city: 'Barranquilla', status: CustomerStatus.ACTIVE },
    { name: 'Sofía Vergara', email: 'sofia.vergara@mail.com', phone: '3132468101', company: 'Vergara Spa', address: 'Av. 7 #35-50', city: 'Cartagena', status: CustomerStatus.PROSPECT },
  ];

  const createdCustomers: any[] = [];
  for (const c of customerDefs) {
    const customer = await prisma.customer.create({ data: { ...c, companyId: mainCompany.id } });
    createdCustomers.push(customer);
  }

  // 5. CREAR OPORTUNIDADES
  const opportunityDefs = [
    { title: 'Suministro mensual de línea de maquillaje', customerIndex: 0, stage: OpportunityStage.QUALIFIED, estimatedValue: 950000, probability: 75 },
    { title: 'Contrato de insumos y empaques', customerIndex: 1, stage: OpportunityStage.CONTACTED, estimatedValue: 450000, probability: 40 },
    { title: 'Taller de capacitación cosmética', customerIndex: 2, stage: OpportunityStage.PROPOSAL, estimatedValue: 320000, probability: 55 },
    { title: 'Renovación de exhibidores y activos', customerIndex: 3, stage: OpportunityStage.NEW, estimatedValue: 220000, probability: 30 },
  ];

  for (const op of opportunityDefs) {
    await prisma.opportunity.create({
      data: {
        title: op.title,
        customerId: createdCustomers[op.customerIndex].id,
        stage: op.stage,
        estimatedValue: op.estimatedValue,
        probability: op.probability,
        companyId: mainCompany.id,
      }
    });
  }

  // 6. CATÁLOGO COMPLETO DE 105 PRODUCTOS REALES (REPARTIDOS EN TODOS LOS TIPOS)
  // Tipos: SALE, FINISHED_GOOD, RAW_MATERIAL, SUPPLY, SERVICE, FIXED_ASSET
  const rawProducts = [
    // ── VENTA (SALE) - 35 PRODUCTOS ──
    { code: 'PROD-001', name: 'Labial Matte Rouge Satin', price: 45000, cost: 22000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 45 },
    { code: 'PROD-002', name: 'Gloss Voluminizador Rose Gold', price: 38000, cost: 18000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 60 },
    { code: 'PROD-003', name: 'Labial Humectante Nude Caramel', price: 42000, cost: 20000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 30 },
    { code: 'PROD-004', name: 'Tinta de Labios y Mejillas Cereza', price: 32000, cost: 14000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 85 },
    { code: 'PROD-005', name: 'Delineador de Labios Precisión Vino', price: 25000, cost: 11000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 40 },
    { code: 'PROD-006', name: 'Paleta Amore Lilac 18 Tonos', price: 120000, cost: 60000, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 25 },
    { code: 'PROD-007', name: 'Delineador Liquid Violet Waterproof', price: 29000, cost: 14000, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 50 },
    { code: 'PROD-008', name: 'Pestañina Efecto Alargador Carbon Black', price: 39000, cost: 17000, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 70 },
    { code: 'PROD-009', name: 'Sombra Individual Metalizada Bronze', price: 22000, cost: 9500, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 90 },
    { code: 'PROD-010', name: 'Gel Fijador de Cejas Orgánico Transparente', price: 28000, cost: 12000, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 65 },
    { code: 'PROD-011', name: 'Base Hydra Glow Tono 02 Medium', price: 68000, cost: 32000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 35 },
    { code: 'PROD-012', name: 'Corrector Velvet Touch Cream Tono Light', price: 35000, cost: 16000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 55 },
    { code: 'PROD-013', name: 'Polvo Traslúcido Matificante de Arroz', price: 48000, cost: 21000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 40 },
    { code: 'PROD-014', name: 'Rubor en Crema Durazno Radiante', price: 36000, cost: 15000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 48 },
    { code: 'PROD-015', name: 'Iluminador Liquido Champagne Glow', price: 44000, cost: 19000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 32 },
    { code: 'PROD-016', name: 'Sérum Ácido Hialurónico 2% Rejuvenecedor', price: 85000, cost: 40000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 50 },
    { code: 'PROD-017', name: 'Sérum Vitamina C 15% Iluminador', price: 89000, cost: 42000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 28 },
    { code: 'PROD-018', name: 'Sérum Niacinamida 10% Antimperfecciones', price: 78000, cost: 36000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 42 },
    { code: 'PROD-019', name: 'Ampolla Concentrada Botox Effect', price: 95000, cost: 45000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 18 },
    { code: 'PROD-020', name: 'Agua Micelar Infusión de Rosas 400ml', price: 28000, cost: 12000, catCode: 'CAT-LMP', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 75 },
    { code: 'PROD-021', name: 'Gel Limpiador Facial Ácido Salicílico', price: 42000, cost: 19000, catCode: 'CAT-LMP', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 62 },
    { code: 'PROD-022', name: 'Tónico Facial Hidratante Manzanilla', price: 34000, cost: 14500, catCode: 'CAT-LMP', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 40 },
    { code: 'PROD-023', name: 'Protector Solar Gel SPF 50+ Toque Seco', price: 65000, cost: 29000, catCode: 'CAT-SOL', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 58 },
    { code: 'PROD-024', name: 'Protector Solar Fluid con Color Tono Dorado', price: 69000, cost: 31000, catCode: 'CAT-SOL', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 34 },
    { code: 'PROD-025', name: 'Champú Reparador Sin Sulfatos Argán 500ml', price: 46000, cost: 21000, catCode: 'CAT-SHA', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 45 },
    { code: 'PROD-026', name: 'Acondicionador Nutritivo Aguacate 500ml', price: 44000, cost: 20000, catCode: 'CAT-SHA', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 38 },
    { code: 'PROD-027', name: 'Óleo Reparador de Argán y Coco 100ml', price: 56000, cost: 26000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 52 },
    { code: 'PROD-028', name: 'Mascarilla Capilar Keratina Intensiva 300g', price: 58000, cost: 27000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 29 },
    { code: 'PROD-029', name: 'Bruma Capilar Termoprotectora Destello', price: 42000, cost: 19000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 64 },
    { code: 'PROD-030', name: 'Exfoliante Corporal Lavanda y Azúcar 250g', price: 48000, cost: 22000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.SALE, qty: 33 },
    { code: 'PROD-031', name: 'Crema Corporal Hidratación Profunda Cacao', price: 52000, cost: 24000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.SALE, qty: 41 },
    { code: 'PROD-032', name: 'Aceite Seco Corporal Almendras Dulces 200ml', price: 62000, cost: 28000, catCode: 'CAT-OIL', groupCode: 'GRP-COR', type: ProductType.SALE, qty: 27 },
    { code: 'PROD-033', name: 'Perfume Dorelle Nuit Eau de Parfum 100ml', price: 240000, cost: 110000, catCode: 'CAT-FRG', groupCode: 'GRP-PER', type: ProductType.SALE, qty: 15 },
    { code: 'PROD-034', name: 'Perfume Satin Floral Rose EDP 100ml', price: 225000, cost: 102000, catCode: 'CAT-FRG', groupCode: 'GRP-PER', type: ProductType.SALE, qty: 22 },
    { code: 'PROD-035', name: 'Set Brochas Premium Gold (12 unidades)', price: 150000, cost: 70000, catCode: 'CAT-BRO', groupCode: 'GRP-ACC', type: ProductType.SALE, qty: 20 },

    // ── PRODUCTO TERMINADO (FINISHED_GOOD) - 20 PRODUCTOS ──
    { code: 'PROD-036', name: 'Kit Skincare Rutina Completa Antiedad', price: 210000, cost: 98000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 30 },
    { code: 'PROD-037', name: 'Cofre de Regalo Labiales Matte Edición Especial', price: 135000, cost: 62000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 25 },
    { code: 'PROD-038', name: 'Lote Mascarilla Keratina Granel (Balde 10kg)', price: 420000, cost: 190000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 12 },
    { code: 'PROD-039', name: 'Lote Champú Nutritivo Orgánico (Balde 20L)', price: 650000, cost: 310000, catCode: 'CAT-SHA', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 8 },
    { code: 'PROD-040', name: 'Pack Sérum Hialurónico Dúo Día y Noche', price: 145000, cost: 68000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 40 },
    { code: 'PROD-041', name: 'Jabón Artesanal Avena & Miel (Caja x 12 u.)', price: 96000, cost: 42000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.FINISHED_GOOD, qty: 50 },
    { code: 'PROD-042', name: 'Kit Corporal Exfoliante + Manteca de Karité', price: 92000, cost: 41000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.FINISHED_GOOD, qty: 35 },
    { code: 'PROD-043', name: 'Cofre Perfume Nuit + Lotion Perfumada', price: 280000, cost: 130000, catCode: 'CAT-FRG', groupCode: 'GRP-PER', type: ProductType.FINISHED_GOOD, qty: 18 },
    { code: 'PROD-044', name: 'Set Limpieza Facial Profunda Micelar + Gel', price: 62000, cost: 27000, catCode: 'CAT-LMP', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 44 },
    { code: 'PROD-045', name: 'Kit Profesional Maquillaje Novias Completo', price: 380000, cost: 180000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 10 },
    { code: 'PROD-046', name: 'Lote Crema Hidratante Lavanda (Balde 5kg)', price: 310000, cost: 140000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.FINISHED_GOOD, qty: 14 },
    { code: 'PROD-047', name: 'Pack Ampollas Reconstructoras Capilares x 6', price: 110000, cost: 49000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 26 },
    { code: 'PROD-048', name: 'Kit Viajero Skincare Esenciales 50ml', price: 75000, cost: 33000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 60 },
    { code: 'PROD-049', name: 'Set Pinceles de Alta Precisión Ojos (8 u.)', price: 88000, cost: 39000, catCode: 'CAT-BRO', groupCode: 'GRP-ACC', type: ProductType.FINISHED_GOOD, qty: 32 },
    { code: 'PROD-050', name: 'Caja Regalo Corporal SPA Relajación Total', price: 165000, cost: 76000, catCode: 'CAT-OIL', groupCode: 'GRP-COR', type: ProductType.FINISHED_GOOD, qty: 22 },
    { code: 'PROD-051', name: 'Paleta Contorno e Iluminación Profesional', price: 115000, cost: 52000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 28 },
    { code: 'PROD-052', name: 'Tratamiento Nocturno Óleo Nutritivo Capilar', price: 68000, cost: 30000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 37 },
    { code: 'PROD-053', name: 'Kit Solar Familiar SPF 50+ x 2 Unidades', price: 118000, cost: 54000, catCode: 'CAT-SOL', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 19 },
    { code: 'PROD-054', name: 'Edición Limitada Labial Rose Gold + Neceser', price: 58000, cost: 25000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 45 },
    { code: 'PROD-055', name: 'Colección Fragancias Miniatura 15ml x 4', price: 160000, cost: 72000, catCode: 'CAT-FRG', groupCode: 'GRP-PER', type: ProductType.FINISHED_GOOD, qty: 16 },

    // ── MATERIA PRIMA (RAW_MATERIAL) - 20 PRODUCTOS ──
    { code: 'PROD-056', name: 'Aceite Puro de Argán Marroquí Prensado (Litro)', price: 180000, cost: 180000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 50 },
    { code: 'PROD-057', name: 'Manteca de Karité Orgánica Sin Refinar (Kg)', price: 65000, cost: 65000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 80 },
    { code: 'PROD-058', name: 'Ácido Hialurónico Puro en Polvo USP (100g)', price: 240000, cost: 240000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 25 },
    { code: 'PROD-059', name: 'Elastina Hidrolizada Líquida Grado Cosmético (Litro)', price: 140000, cost: 140000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 35 },
    { code: 'PROD-060', name: 'Cera de Abejas Virgen Amarilla en Perlas (Kg)', price: 42000, cost: 42000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 100 },
    { code: 'PROD-061', name: 'Extracto Glicólico de Caléndula Concentrado (Litro)', price: 85000, cost: 85000, catCode: 'CAT-EXT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 40 },
    { code: 'PROD-062', name: 'Colágeno Marino Hidrolizado en Polvo (500g)', price: 195000, cost: 195000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 30 },
    { code: 'PROD-063', name: 'Vitamina E Líquida Tocoferol USP (Litro)', price: 160000, cost: 160000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 45 },
    { code: 'PROD-064', name: 'Pigmento Mineral Mica Rosa Perlado (Kg)', price: 125000, cost: 125000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 20 },
    { code: 'PROD-065', name: 'Aceite Esencial de Lavanda Francesa 100% Puro (250ml)', price: 175000, cost: 175000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 18 },
    { code: 'PROD-066', name: 'Manteca de Cacao Virgen Pura en Bloque (Kg)', price: 58000, cost: 58000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 65 },
    { code: 'PROD-067', name: 'Niacinamida en Polvo Grado Farmacéutico (500g)', price: 110000, cost: 110000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 28 },
    { code: 'PROD-068', name: 'Glicerina Vegetal USP 99.7% Pureza (Galón)', price: 72000, cost: 72000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 75 },
    { code: 'PROD-069', name: 'Extracto de Áloe Vera Gel Concentrado 10:1 (Litro)', price: 98000, cost: 98000, catCode: 'CAT-EXT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 42 },
    { code: 'PROD-070', name: 'Keratina Hidrolizada Concentrada Líquida (Litro)', price: 155000, cost: 155000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 33 },
    { code: 'PROD-071', name: 'Aceite de Coco Nucifera Virgen Extra (Kg)', price: 48000, cost: 48000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 90 },
    { code: 'PROD-072', name: 'Óxidos de Hierro Mineral Pigmento Rojo (Kg)', price: 95000, cost: 95000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 22 },
    { code: 'PROD-073', name: 'Extracto Oleoso de Romero Silvestre (Litro)', price: 82000, cost: 82000, catCode: 'CAT-EXT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 38 },
    { code: 'PROD-074', name: 'Conservante Natural Eco-Certificado (500ml)', price: 135000, cost: 135000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 27 },
    { code: 'PROD-075', name: 'Filtro Solar UV Bisoctrizol Polvo (500g)', price: 210000, cost: 210000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 15 },

    // ── INSUMO / SUMINISTRO (SUPPLY) - 15 PRODUCTOS ──
    { code: 'PROD-076', name: 'Frasco Gotero Vidrio Ámbar 30ml con Ppipeta (Caja x 100)', price: 120000, cost: 120000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 150 },
    { code: 'PROD-077', name: 'Pote Acrílico Transparente 50g Tapa Dorada (Caja x 100)', price: 165000, cost: 165000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 110 },
    { code: 'PROD-078', name: 'Envase Airless Blanco 50ml para Sérum (Caja x 50)', price: 140000, cost: 140000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 85 },
    { code: 'PROD-079', name: 'Tubo Colapsable para Labial 5ml (Caja x 200)', price: 180000, cost: 180000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 95 },
    { code: 'PROD-080', name: 'Válvula Atomizadora Spray Dorada 24/410 (Caja x 200)', price: 130000, cost: 130000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 140 },
    { code: 'PROD-081', name: 'Etiqueta Térmica Autoadhesiva 50x30mm (Rollo x 1000)', price: 28000, cost: 28000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 300 },
    { code: 'PROD-082', name: 'Caja de Cartón Rígido Dorado con Imán (Paquete x 50)', price: 210000, cost: 210000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 45 },
    { code: 'PROD-083', name: 'Cinta Embellecedora Satinada Negra 25mm (Rollo 100m)', price: 35000, cost: 35000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 80 },
    { code: 'PROD-084', name: 'Bolsa Ecológica de Lienzo con Logo (Paquete x 100)', price: 250000, cost: 250000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 60 },
    { code: 'PROD-085', name: 'Papel Seda Protector Impreso con Marca (Paquete 500 h.)', price: 68000, cost: 68000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 70 },
    { code: 'PROD-086', name: 'Frasco Espumador 150ml con Bomba Lather (Caja x 50)', price: 155000, cost: 155000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 90 },
    { code: 'PROD-087', name: 'Tapa Rosca de Aluminio 28mm (Caja x 500)', price: 95000, cost: 95000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 120 },
    { code: 'PROD-088', name: 'Sello de Seguridad Termoencogible para Frasco (Millar)', price: 45000, cost: 45000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 200 },
    { code: 'PROD-089', name: 'Cinta de Embalaje Transparente 48mmx100m (Paquete x 12)', price: 54000, cost: 54000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 110 },
    { code: 'PROD-090', name: 'Bolsa Burbuja de Protección para Envíos (Caja x 200)', price: 78000, cost: 78000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 130 },

    // ── SERVICIO (SERVICE) - 8 PRODUCTOS ──
    { code: 'PROD-091', name: 'Sesión de Maquillaje Profesional para Novias', price: 250000, cost: 80000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
    { code: 'PROD-092', name: 'Diagnóstico Capilar 3D con Microcámara', price: 80000, cost: 20000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
    { code: 'PROD-093', name: 'Taller de Auto-Maquillaje Personalizado (2h)', price: 150000, cost: 40000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
    { code: 'PROD-094', name: 'Servicio de Limpieza Facial Profunda Hydrafacial', price: 180000, cost: 50000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
    { code: 'PROD-095', name: 'Asesoría de Colorimetría y Visagismo Facial', price: 120000, cost: 30000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
    { code: 'PROD-096', name: 'Tratamiento Restaurador de Keratina en Cabina', price: 220000, cost: 70000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
    { code: 'PROD-097', name: 'Mantenimiento Preventivo de Mezcladoras Cosméticas', price: 350000, cost: 120000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
    { code: 'PROD-098', name: 'Curso Intensivo Formulaciones Cosméticas Naturales', price: 450000, cost: 150000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },

    // ── ACTIVO FIJO (FIXED_ASSET) - 7 PRODUCTOS ──
    { code: 'PROD-099', name: 'Mezcladora Industrial de Cremas 50L Stainless Steel', price: 8500000, cost: 8500000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 2 },
    { code: 'PROD-100', name: 'Llenadora Neumática de Líquidos y Viscosos 500ml', price: 4200000, cost: 4200000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 3 },
    { code: 'PROD-101', name: 'Autoclave Digital de Esterilización Cosmética 24L', price: 3100000, cost: 3100000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 4 },
    { code: 'PROD-102', name: 'Mueble Exhibidor de Cristal Templado con Iluminación LED', price: 1850000, cost: 1850000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 6 },
    { code: 'PROD-103', name: 'Silla Reclinable Hidráulica para Maquillaje y Spa', price: 1450000, cost: 1450000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 8 },
    { code: 'PROD-104', name: 'Sistema de Cómputo All-in-One POS de Registro 21"', price: 2900000, cost: 2900000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 5 },
    { code: 'PROD-105', name: 'Lámpara LED Profesional de Anillo con Soporte 18"', price: 480000, cost: 480000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 10 },
  ];

  const createdProducts = [];
  for (let i = 0; i < rawProducts.length; i++) {
    const raw = rawProducts[i];
    const categoryId = getCatIdByCode(raw.catCode);
    const supplier = createdSuppliers[i % createdSuppliers.length];

    const p = await prisma.product.create({
      data: {
        code: raw.code,
        name: raw.name,
        categoryId: categoryId,
        supplierId: supplier.id,
        quantityAvailable: raw.qty,
        unitCost: raw.cost,
        salePrice: raw.price,
        soldQuantity: raw.type === ProductType.SALE ? 10 + (i % 15) : 0,
        type: raw.type,
        productGroupId: getGroupIdByCode(raw.groupCode),
        companyId: mainCompany.id,
      },
    });
    createdProducts.push(p);
  }

  // 7. CREAR HISTORIAL REALISTA DE VENTAS DE LOS ÚLTIMOS 6 MESES
  const clientNames = ['Juliana Restrepo', 'Camila Gómez', 'Mariana Mesa', 'Lucía Pérez', 'Sofía Vergara', 'Paola Turbay'];
  const paymentMethods = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];
  const baseDate = new Date();
  const saleProducts = createdProducts.filter(p => p.type === ProductType.SALE || p.type === ProductType.FINISHED_GOOD);
  
  for (let i = 1; i <= 30; i++) {
    const saleDate = new Date();
    saleDate.setMonth(baseDate.getMonth() - (i % 6));
    saleDate.setDate(1 + (i * 2) % 28);
    saleDate.setHours(9 + (i % 9), (i * 15) % 60, 0);

    const client = i % 4 === 0 ? null : clientNames[i % clientNames.length];
    const paymentMethod = paymentMethods[i % paymentMethods.length];
    
    const detailsData = [];
    let saleTotal = 0;
    const numItems = 1 + (i % 4);
    
    for (let k = 0; k < numItems; k++) {
      const prod = saleProducts[(i + k * 4) % saleProducts.length];
      const qty = 1 + (i % 3);
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

    const discount = i % 5 === 0 ? 15000 : 0;
    const finalTotal = Math.max(0, saleTotal - discount);

    await prisma.sale.create({
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

  console.log('Seed ejecutado exitosamente con 105 productos profesionales (Venta, Materia Prima, Insumos, Servicios y Activos Fijos).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
