"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { resolveActionCompanyId, resolveActionUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import {
  ProductType,
  CustomerStatus,
  OpportunityStage,
  ExpenseCategory,
  IncomeCategory,
  EmployeeStatus,
  PayrollStatus
} from "@prisma/client";

/**
 * Consulta el estado actual de datos de prueba para la empresa.
 * Retorna si ya existen datos de prueba generados.
 */
export async function getDemoDataStatus(targetCompanyId?: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) return { success: false, hasDemoData: false };

    const companyId = targetCompanyId || (await resolveActionCompanyId());
    if (!companyId) return { success: false, hasDemoData: false };

    // 1. Revisar si hay un registro de lote de prueba en AuditLog
    const demoBatch = await prisma.auditLog.findFirst({
      where: {
        companyId,
        module: "DEMO_DATA",
        action: "BATCH_CREATED",
      },
      orderBy: { createdAt: "desc" }
    });

    if (demoBatch) {
      const details = demoBatch.newValues as any;
      const productCount = Array.isArray(details?.productIds) ? details.productIds.length : 0;
      return {
        success: true,
        hasDemoData: true,
        batchInfo: {
          createdAt: demoBatch.createdAt,
          productCount,
          suffix: details?.batchSuffix,
        }
      };
    }

    // 2. Fallback de verificación: si existen usuarios de prueba o nómina/productos con tags demo
    const demoUsers = await prisma.user.count({
      where: { companyId, email: { contains: "@gns-demo.com" } }
    });

    const demoPayrolls = await prisma.payroll.count({
      where: { companyId, code: { startsWith: "NOM-" } }
    });

    if (demoUsers > 0 || demoPayrolls > 0) {
      return { success: true, hasDemoData: true };
    }

    return { success: true, hasDemoData: false };
  } catch (error: any) {
    console.error("[GET_DEMO_DATA_STATUS_ERROR]", error);
    return { success: false, hasDemoData: false };
  }
}

/**
 * Genera datos de prueba solo si no existen datos de prueba previos en la empresa.
 * Registra un identificador interno (AuditLog DemoBatch) con todos los IDs creados.
 */
export async function generateDemoData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    if (!companyId) throw new Error("Compañía no encontrada");
    const userId = await resolveActionUserId(session.user.id);
    const isSuperAdmin = session.user.role === 'SUPERADMIN';

    // Validación previa: no permitir generar si ya existen datos de prueba
    const status = await getDemoDataStatus(companyId);
    if (status.hasDemoData) {
      return {
        success: false,
        error: "Ya existen datos de prueba activos en esta empresa. Debes eliminarlos antes de generar un nuevo lote de prueba."
      };
    }

    const suffix = Date.now().toString().slice(-4);

    // Arrays de seguimiento para el identificador interno del lote
    const createdGroupIds: number[] = [];
    const createdCategoryIds: number[] = [];
    const createdSupplierIds: number[] = [];
    const createdCustomerIds: number[] = [];
    const createdLeadIds: number[] = [];
    const createdOpportunityIds: number[] = [];
    const createdActivityIds: number[] = [];
    const createdContactIds: number[] = [];
    const createdQuoteIds: number[] = [];
    const createdProductIds: number[] = [];
    const createdSaleIds: number[] = [];
    const createdIncomeIds: number[] = [];
    const createdExpenseIds: number[] = [];
    const createdPositionIds: number[] = [];
    const createdEmployeeIds: number[] = [];
    const createdPayrollIds: number[] = [];
    const createdUserIds: number[] = [];

    // 1. GRUPOS DE PRODUCTOS
    const groupDefs = isSuperAdmin ? [
      { name: `Maquillaje Profesional ${suffix}`, code: `GRP-MAQ-${suffix}` },
      { name: `Cuidado Facial & Skincare ${suffix}`, code: `GRP-SKN-${suffix}` },
      { name: `Cuidado Capilar & Estilo ${suffix}`, code: `GRP-CAP-${suffix}` },
      { name: `Cuidado Corporal & Spa ${suffix}`, code: `GRP-COR-${suffix}` },
      { name: `Perfumería & Fragancias ${suffix}`, code: `GRP-PER-${suffix}` },
      { name: `Accesorios & Herramientas ${suffix}`, code: `GRP-ACC-${suffix}` },
      { name: `Materias Primas & Químicos ${suffix}`, code: `GRP-MPR-${suffix}` },
      { name: `Empaques & Suministros ${suffix}`, code: `GRP-SUM-${suffix}` },
      { name: `Servicios & Asesorías ${suffix}`, code: `GRP-SER-${suffix}` },
      { name: `Equipos & Activos Fijos ${suffix}`, code: `GRP-ACT-${suffix}` },
    ] : [
      { name: `Maquillaje Profesional ${suffix}`, code: `GRP-MAQ-${suffix}` },
      { name: `Cuidado Facial & Skincare ${suffix}`, code: `GRP-SKN-${suffix}` },
      { name: `Cuidado Capilar & Estilo ${suffix}`, code: `GRP-CAP-${suffix}` },
      { name: `Materias Primas & Químicos ${suffix}`, code: `GRP-MPR-${suffix}` },
      { name: `Empaques & Suministros ${suffix}`, code: `GRP-SUM-${suffix}` },
      { name: `Servicios & Activos ${suffix}`, code: `GRP-SER-${suffix}` },
    ];

    const createdGroups: any[] = [];
    for (const g of groupDefs) {
      const group = await prisma.productGroup.create({
        data: { name: g.name, code: g.code, status: 'ACTIVE', companyId }
      });
      createdGroups.push(group);
      createdGroupIds.push(group.id);
    }

    const getGroupIdByCode = (codePrefix: string) => {
      const found = createdGroups.find(g => g.code.startsWith(codePrefix));
      return found ? found.id : createdGroups[0].id;
    };

    // 2. CATEGORÍAS
    const categoryDefs = isSuperAdmin ? [
      { name: `Labiales & Brillos ${suffix}`, code: `CAT-LAB-${suffix}`, groupCode: 'GRP-MAQ', description: 'Labiales líquidos y gloss' },
      { name: `Sombras & Ojos ${suffix}`, code: `CAT-EYE-${suffix}`, groupCode: 'GRP-MAQ', description: 'Paletas de sombras y delineadores' },
      { name: `Rostro & Cobertura ${suffix}`, code: `CAT-ROS-${suffix}`, groupCode: 'GRP-MAQ', description: 'Bases y correctores' },
      { name: `Sérums & Ampollas ${suffix}`, code: `CAT-SER-${suffix}`, groupCode: 'GRP-SKN', description: 'Fórmulas concentradas' },
      { name: `Limpieza & Tónicos ${suffix}`, code: `CAT-LMP-${suffix}`, groupCode: 'GRP-SKN', description: 'Aguas micelares y limpiadores' },
      { name: `Protección Solar ${suffix}`, code: `CAT-SOL-${suffix}`, groupCode: 'GRP-SKN', description: 'Bloqueadores SPF 50+' },
      { name: `Tratamientos Capilares ${suffix}`, code: `CAT-TRT-${suffix}`, groupCode: 'GRP-CAP', description: 'Mascarillas de keratina y óleos' },
      { name: `Champús & Acondicionadores ${suffix}`, code: `CAT-SHA-${suffix}`, groupCode: 'GRP-CAP', description: 'Libres de sulfatos' },
      { name: `Exfoliantes & Cremas ${suffix}`, code: `CAT-EXF-${suffix}`, groupCode: 'GRP-COR', description: 'Exfoliantes y mantecas' },
      { name: `Aceites & Mantequillas ${suffix}`, code: `CAT-OIL-${suffix}`, groupCode: 'GRP-COR', description: 'Aceites secos y mantecas' },
      { name: `Perfumes Luxury ${suffix}`, code: `CAT-FRG-${suffix}`, groupCode: 'GRP-PER', description: 'Fragancias Eau de Parfum' },
      { name: `Brochas & Aplicadores ${suffix}`, code: `CAT-BRO-${suffix}`, groupCode: 'GRP-ACC', description: 'Kits de brochas profesionales' },
      { name: `Ingredientes Orgánicos ${suffix}`, code: `CAT-ING-${suffix}`, groupCode: 'GRP-MPR', description: 'Aceites puros y ceras' },
      { name: `Activos Cosméticos ${suffix}`, code: `CAT-ACT-${suffix}`, groupCode: 'GRP-MPR', description: 'Polvos de ácido hialurónico' },
      { name: `Frascos & Contenedores ${suffix}`, code: `CAT-FRS-${suffix}`, groupCode: 'GRP-SUM', description: 'Frascos gotero ámbar' },
      { name: `Cajas & Embalajes ${suffix}`, code: `CAT-CAJ-${suffix}`, groupCode: 'GRP-SUM', description: 'Cajas rígidas y etiquetas' },
      { name: `Asesorías & Cursos ${suffix}`, code: `CAT-CON-${suffix}`, groupCode: 'GRP-SER', description: 'Talleres de automaquillaje' },
      { name: `Servicios de Estética ${suffix}`, code: `CAT-SPA-${suffix}`, groupCode: 'GRP-SER', description: 'Maquillaje novias y facial' },
      { name: `Maquinaria de Producción ${suffix}`, code: `CAT-MAQ-${suffix}`, groupCode: 'GRP-ACT', description: 'Mezcladoras industriales' },
      { name: `Mobiliario & Equipos POS ${suffix}`, code: `CAT-MOB-${suffix}`, groupCode: 'GRP-ACT', description: 'Muebles exhibidores y POS' },
    ] : [
      { name: `Labiales & Maquillaje ${suffix}`, code: `CAT-LAB-${suffix}`, groupCode: 'GRP-MAQ', description: 'Labiales y cosméticos faciales' },
      { name: `Sérums & Cuidado Facial ${suffix}`, code: `CAT-SER-${suffix}`, groupCode: 'GRP-SKN', description: 'Sérums hidratantes y rejuvenecedores' },
      { name: `Cuidado Capilar ${suffix}`, code: `CAT-TRT-${suffix}`, groupCode: 'GRP-CAP', description: 'Champús y tratamientos capilares' },
      { name: `Materias Primas ${suffix}`, code: `CAT-ING-${suffix}`, groupCode: 'GRP-MPR', description: 'Aceites puros e ingredientes cosméticos' },
      { name: `Empaques & Envases ${suffix}`, code: `CAT-FRS-${suffix}`, groupCode: 'GRP-SUM', description: 'Frascos goteros y cajas' },
      { name: `Servicios & Equipos ${suffix}`, code: `CAT-SPA-${suffix}`, groupCode: 'GRP-SER', description: 'Servicios de estética y maquinaria' },
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
          companyId,
        }
      });
      createdCategories.push(cat);
      createdCategoryIds.push(cat.id);
    }

    const getCatIdByCode = (codePrefix: string) => {
      const found = createdCategories.find(c => c.code.startsWith(codePrefix));
      return found ? found.id : createdCategories[0].id;
    };

    // 3. PROVEEDORES
    const supplier1 = await prisma.supplier.create({
      data: {
        companyName: `Dorelle Beauty Suppliers ${suffix} S.A.S.`,
        contactName: "Juan Carlos Pérez",
        phone: "3004567890",
        email: `contacto_${suffix}@dorellebeauty.com`,
        address: "Calle 93 #15-20",
        city: "Bogotá",
        companyId,
      }
    });
    createdSupplierIds.push(supplier1.id);

    const supplier2 = await prisma.supplier.create({
      data: {
        companyName: `Insumos Cosméticos de Colombia ${suffix}`,
        contactName: "Martha Cecilia Ortiz",
        phone: "3158901234",
        email: `ventas_${suffix}@insumoscolombia.com`,
        address: "Carrera 43A #1-50",
        city: "Medellín",
        companyId,
      }
    });
    createdSupplierIds.push(supplier2.id);

    // 4. CLIENTES CRM
    const customer1 = await prisma.customer.create({
      data: {
        name: `Juliana Restrepo ${suffix}`,
        email: `juliana_${suffix}@mail.com`,
        phone: "3101234567",
        company: "Restrepo Boutique",
        address: "Calle 50 #12-34",
        city: "Bogotá",
        status: CustomerStatus.ACTIVE,
        companyId,
      }
    });
    createdCustomerIds.push(customer1.id);

    const customer2 = await prisma.customer.create({
      data: {
        name: `Carlos Mario Gómez ${suffix}`,
        email: `carlos_${suffix}@mail.com`,
        phone: "3209876543",
        company: "Salón & Spa Elegance",
        address: "Avenida 6N #22-10",
        city: "Cali",
        status: CustomerStatus.ACTIVE,
        companyId,
      }
    });
    createdCustomerIds.push(customer2.id);

    // 5. CRM: LEADS, OPORTUNIDADES, ACTIVIDADES Y COTIZACIONES
    const lead1 = await prisma.lead.create({
      data: {
        name: `Distribuidora Cosmética del Valle ${suffix}`,
        email: `compras_${suffix}@vallecosmeticos.com`,
        phone: "3127894561",
        companyName: "Cosméticos del Valle",
        source: "Sitio Web",
        status: "QUALIFIED",
        companyId,
      }
    });
    createdLeadIds.push(lead1.id);

    const opportunity1 = await prisma.opportunity.create({
      data: {
        title: `Dotación Productos Spa Temporada ${suffix}`,
        customerId: customer2.id,
        stage: OpportunityStage.PROPOSAL,
        estimatedValue: 4500000,
        probability: 70,
        companyId,
      }
    });
    createdOpportunityIds.push(opportunity1.id);

    const activity1 = await prisma.activity.create({
      data: {
        title: "Llamada de presentación de catálogo",
        type: "CALL",
        description: "Se presentó propuesta comercial y catálogo de productos para el salón.",
        date: new Date(),
        userId,
        customerId: customer2.id,
        companyId,
      }
    });
    createdActivityIds.push(activity1.id);

    const contact1 = await prisma.contact.create({
      data: {
        name: "Valeria Gómez",
        email: `valeria_${suffix}@elegance.com`,
        phone: "3114569874",
        position: "Directora de Compras",
        customerId: customer2.id,
        companyId,
      }
    });
    createdContactIds.push(contact1.id);

    const quote1 = await prisma.quote.create({
      data: {
        quoteNumber: `COT-${suffix}-001`,
        customerId: customer1.id,
        total: 1850000,
        status: "SENT",
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        companyId,
      }
    });
    createdQuoteIds.push(quote1.id);

    // 6. CATÁLOGO DE PRODUCTOS (100 para Superadmin, 20 para otros usuarios)
    const rawSuperAdminProducts = [
      // VENTA (SALE) - 35
      { code: `P-${suffix}-001`, name: 'Labial Matte Rouge Satin', price: 45000, cost: 22000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 45 },
      { code: `P-${suffix}-002`, name: 'Gloss Voluminizador Rose Gold', price: 38000, cost: 18000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 60 },
      { code: `P-${suffix}-003`, name: 'Labial Humectante Nude Caramel', price: 42000, cost: 20000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 30 },
      { code: `P-${suffix}-004`, name: 'Tinta de Labios y Mejillas Cereza', price: 32000, cost: 14000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 85 },
      { code: `P-${suffix}-005`, name: 'Delineador de Labios Precisión Vino', price: 25000, cost: 11000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 40 },
      { code: `P-${suffix}-006`, name: 'Paleta Amore Lilac 18 Tonos', price: 120000, cost: 60000, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 25 },
      { code: `P-${suffix}-007`, name: 'Delineador Liquid Violet Waterproof', price: 29000, cost: 14000, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 50 },
      { code: `P-${suffix}-008`, name: 'Pestañina Efecto Alargador Carbon Black', price: 39000, cost: 17000, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 70 },
      { code: `P-${suffix}-009`, name: 'Sombra Individual Metalizada Bronze', price: 22000, cost: 9500, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 90 },
      { code: `P-${suffix}-010`, name: 'Gel Fijador de Cejas Orgánico Transparente', price: 28000, cost: 12000, catCode: 'CAT-EYE', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 65 },
      { code: `P-${suffix}-011`, name: 'Base Hydra Glow Tono 02 Medium', price: 68000, cost: 32000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 35 },
      { code: `P-${suffix}-012`, name: 'Corrector Velvet Touch Cream Tono Light', price: 35000, cost: 16000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 55 },
      { code: `P-${suffix}-013`, name: 'Polvo Traslúcido Matificante de Arroz', price: 48000, cost: 21000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 40 },
      { code: `P-${suffix}-014`, name: 'Rubor en Crema Durazno Radiante', price: 36000, cost: 15000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 48 },
      { code: `P-${suffix}-015`, name: 'Iluminador Liquido Champagne Glow', price: 44000, cost: 19000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 32 },
      { code: `P-${suffix}-016`, name: 'Sérum Ácido Hialurónico 2% Rejuvenecedor', price: 85000, cost: 40000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 50 },
      { code: `P-${suffix}-017`, name: 'Sérum Vitamina C 15% Iluminador', price: 89000, cost: 42000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 28 },
      { code: `P-${suffix}-018`, name: 'Sérum Niacinamida 10% Antimperfecciones', price: 78000, cost: 36000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 42 },
      { code: `P-${suffix}-019`, name: 'Ampolla Concentrada Botox Effect', price: 95000, cost: 45000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 18 },
      { code: `P-${suffix}-020`, name: 'Agua Micelar Infusión de Rosas 400ml', price: 28000, cost: 12000, catCode: 'CAT-LMP', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 75 },
      { code: `P-${suffix}-021`, name: 'Gel Limpiador Facial Ácido Salicílico', price: 42000, cost: 19000, catCode: 'CAT-LMP', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 62 },
      { code: `P-${suffix}-022`, name: 'Tónico Facial Hidratante Manzanilla', price: 34000, cost: 14500, catCode: 'CAT-LMP', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 40 },
      { code: `P-${suffix}-023`, name: 'Protector Solar Gel SPF 50+ Toque Seco', price: 65000, cost: 29000, catCode: 'CAT-SOL', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 58 },
      { code: `P-${suffix}-024`, name: 'Protector Solar Fluid con Color Tono Dorado', price: 69000, cost: 31000, catCode: 'CAT-SOL', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 34 },
      { code: `P-${suffix}-025`, name: 'Champú Reparador Sin Sulfatos Argán 500ml', price: 46000, cost: 21000, catCode: 'CAT-SHA', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 45 },
      { code: `P-${suffix}-026`, name: 'Acondicionador Nutritivo Aguacate 500ml', price: 44000, cost: 20000, catCode: 'CAT-SHA', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 38 },
      { code: `P-${suffix}-027`, name: 'Óleo Reparador de Argán y Coco 100ml', price: 56000, cost: 26000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 52 },
      { code: `P-${suffix}-028`, name: 'Mascarilla Capilar Keratina Intensiva 300g', price: 58000, cost: 27000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 29 },
      { code: `P-${suffix}-029`, name: 'Bruma Capilar Termoprotectora Destello', price: 42000, cost: 19000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 64 },
      { code: `P-${suffix}-030`, name: 'Exfoliante Corporal Lavanda y Azúcar 250g', price: 48000, cost: 22000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.SALE, qty: 33 },
      { code: `P-${suffix}-031`, name: 'Crema Corporal Hidratación Profunda Cacao', price: 52000, cost: 24000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.SALE, qty: 41 },
      { code: `P-${suffix}-032`, name: 'Aceite Seco Corporal Almendras Dulces 200ml', price: 62000, cost: 28000, catCode: 'CAT-OIL', groupCode: 'GRP-COR', type: ProductType.SALE, qty: 27 },
      { code: `P-${suffix}-033`, name: 'Perfume Dorelle Nuit Eau de Parfum 100ml', price: 240000, cost: 110000, catCode: 'CAT-FRG', groupCode: 'GRP-PER', type: ProductType.SALE, qty: 15 },
      { code: `P-${suffix}-034`, name: 'Perfume Satin Floral Rose EDP 100ml', price: 225000, cost: 102000, catCode: 'CAT-FRG', groupCode: 'GRP-PER', type: ProductType.SALE, qty: 22 },
      { code: `P-${suffix}-035`, name: 'Set Brochas Premium Gold (12 unidades)', price: 150000, cost: 70000, catCode: 'CAT-BRO', groupCode: 'GRP-ACC', type: ProductType.SALE, qty: 20 },

      // PRODUCTO TERMINADO (FINISHED_GOOD) - 20
      { code: `P-${suffix}-036`, name: 'Kit Skincare Rutina Completa Antiedad', price: 210000, cost: 98000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 30 },
      { code: `P-${suffix}-037`, name: 'Cofre de Regalo Labiales Matte Edición Especial', price: 135000, cost: 62000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 25 },
      { code: `P-${suffix}-038`, name: 'Lote Mascarilla Keratina Granel (Balde 10kg)', price: 420000, cost: 190000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 12 },
      { code: `P-${suffix}-039`, name: 'Lote Champú Nutritivo Orgánico (Balde 20L)', price: 65000, cost: 310000, catCode: 'CAT-SHA', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 8 },
      { code: `P-${suffix}-040`, name: 'Pack Sérum Hialurónico Dúo Día y Noche', price: 145000, cost: 68000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 40 },
      { code: `P-${suffix}-041`, name: 'Jabón Artesanal Avena & Miel (Caja x 12 u.)', price: 96000, cost: 42000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.FINISHED_GOOD, qty: 50 },
      { code: `P-${suffix}-042`, name: 'Kit Corporal Exfoliante + Manteca de Karité', price: 92000, cost: 41000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.FINISHED_GOOD, qty: 35 },
      { code: `P-${suffix}-043`, name: 'Cofre Perfume Nuit + Lotion Perfumada', price: 280000, cost: 130000, catCode: 'CAT-FRG', groupCode: 'GRP-PER', type: ProductType.FINISHED_GOOD, qty: 18 },
      { code: `P-${suffix}-044`, name: 'Set Limpieza Facial Profunda Micelar + Gel', price: 62000, cost: 27000, catCode: 'CAT-LMP', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 44 },
      { code: `P-${suffix}-045`, name: 'Kit Profesional Maquillaje Novias Completo', price: 380000, cost: 180000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 10 },
      { code: `P-${suffix}-046`, name: 'Lote Crema Hidratante Lavanda (Balde 5kg)', price: 310000, cost: 140000, catCode: 'CAT-EXF', groupCode: 'GRP-COR', type: ProductType.FINISHED_GOOD, qty: 14 },
      { code: `P-${suffix}-047`, name: 'Pack Ampollas Reconstructoras Capilares x 6', price: 110000, cost: 49000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 26 },
      { code: `P-${suffix}-048`, name: 'Kit Viajero Skincare Esenciales 50ml', price: 75000, cost: 33000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 60 },
      { code: `P-${suffix}-049`, name: 'Set Pinceles de Alta Precisión Ojos (8 u.)', price: 88000, cost: 39000, catCode: 'CAT-BRO', groupCode: 'GRP-ACC', type: ProductType.FINISHED_GOOD, qty: 32 },
      { code: `P-${suffix}-050`, name: 'Caja Regalo Corporal SPA Relajación Total', price: 165000, cost: 76000, catCode: 'CAT-OIL', groupCode: 'GRP-COR', type: ProductType.FINISHED_GOOD, qty: 22 },
      { code: `P-${suffix}-051`, name: 'Paleta Contorno e Iluminación Profesional', price: 115000, cost: 52000, catCode: 'CAT-ROS', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 28 },
      { code: `P-${suffix}-052`, name: 'Tratamiento Nocturno Óleo Nutritivo Capilar', price: 68000, cost: 30000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 37 },
      { code: `P-${suffix}-053`, name: 'Kit Solar Familiar SPF 50+ x 2 Unidades', price: 118000, cost: 54000, catCode: 'CAT-SOL', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 19 },
      { code: `P-${suffix}-054`, name: 'Edición Limitada Labial Rose Gold + Neceser', price: 58000, cost: 25000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 45 },
      { code: `P-${suffix}-055`, name: 'Colección Fragancias Miniatura 15ml x 4', price: 160000, cost: 72000, catCode: 'CAT-FRG', groupCode: 'GRP-PER', type: ProductType.FINISHED_GOOD, qty: 16 },

      // MATERIA PRIMA (RAW_MATERIAL) - 15
      { code: `P-${suffix}-056`, name: 'Aceite Puro de Argán Marroquí Prensado (Litro)', price: 180000, cost: 180000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 50 },
      { code: `P-${suffix}-057`, name: 'Manteca de Karité Orgánica Sin Refinar (Kg)', price: 65000, cost: 65000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 80 },
      { code: `P-${suffix}-058`, name: 'Ácido Hialurónico Puro en Polvo USP (100g)', price: 240000, cost: 240000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 25 },
      { code: `P-${suffix}-059`, name: 'Elastina Hidrolizada Líquida Grado Cosmético (Litro)', price: 140000, cost: 140000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 35 },
      { code: `P-${suffix}-060`, name: 'Cera de Abejas Virgen Amarilla en Perlas (Kg)', price: 42000, cost: 42000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 100 },
      { code: `P-${suffix}-061`, name: 'Extracto Glicólico de Caléndula Concentrado (Litro)', price: 85000, cost: 85000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 40 },
      { code: `P-${suffix}-062`, name: 'Colágeno Marino Hidrolizado en Polvo (500g)', price: 195000, cost: 195000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 30 },
      { code: `P-${suffix}-063`, name: 'Vitamina E Líquida Tocoferol USP (Litro)', price: 160000, cost: 160000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 45 },
      { code: `P-${suffix}-064`, name: 'Pigmento Mineral Mica Rosa Perlado (Kg)', price: 125000, cost: 125000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 20 },
      { code: `P-${suffix}-065`, name: 'Aceite Esencial de Lavanda Francesa 100% Puro (250ml)', price: 175000, cost: 175000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 18 },
      { code: `P-${suffix}-066`, name: 'Manteca de Cacao Virgen Pura en Bloque (Kg)', price: 58000, cost: 58000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 65 },
      { code: `P-${suffix}-067`, name: 'Niacinamida en Polvo Grado Farmacéutico (500g)', price: 110000, cost: 110000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 28 },
      { code: `P-${suffix}-068`, name: 'Glicerina Vegetal USP 99.7% Pureza (Galón)', price: 72000, cost: 72000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 75 },
      { code: `P-${suffix}-069`, name: 'Extracto de Áloe Vera Gel Concentrado 10:1 (Litro)', price: 98000, cost: 98000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 42 },
      { code: `P-${suffix}-070`, name: 'Keratina Hidrolizada Concentrada Líquida (Litro)', price: 155000, cost: 155000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 33 },

      // INSUMO / SUMINISTRO (SUPPLY) - 15
      { code: `P-${suffix}-071`, name: 'Frasco Gotero Vidrio Ámbar 30ml con Pipeta (Caja x 100)', price: 120000, cost: 120000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 150 },
      { code: `P-${suffix}-072`, name: 'Pote Acrílico Transparente 50g Tapa Dorada (Caja x 100)', price: 165000, cost: 165000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 110 },
      { code: `P-${suffix}-073`, name: 'Envase Airless Blanco 50ml para Sérum (Caja x 50)', price: 140000, cost: 140000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 85 },
      { code: `P-${suffix}-074`, name: 'Tubo Colapsable para Labial 5ml (Caja x 200)', price: 180000, cost: 180000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 95 },
      { code: `P-${suffix}-075`, name: 'Válvula Atomizadora Spray Dorada 24/410 (Caja x 200)', price: 130000, cost: 130000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 140 },
      { code: `P-${suffix}-076`, name: 'Etiqueta Térmica Autoadhesiva 50x30mm (Rollo x 1000)', price: 28000, cost: 28000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 300 },
      { code: `P-${suffix}-077`, name: 'Caja de Cartón Rígido Dorado con Imán (Paquete x 50)', price: 210000, cost: 210000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 45 },
      { code: `P-${suffix}-078`, name: 'Cinta Embellecedora Satinada Negra 25mm (Rollo 100m)', price: 35000, cost: 35000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 80 },
      { code: `P-${suffix}-079`, name: 'Bolsa Ecológica de Lienzo con Logo (Paquete x 100)', price: 250000, cost: 250000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 60 },
      { code: `P-${suffix}-080`, name: 'Papel Seda Protector Impreso con Marca (Paquete 500 h.)', price: 68000, cost: 68000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 70 },
      { code: `P-${suffix}-081`, name: 'Frasco Espumador 150ml con Bomba Lather (Caja x 50)', price: 155000, cost: 155000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 90 },
      { code: `P-${suffix}-082`, name: 'Tapa Rosca de Aluminio 28mm (Caja x 500)', price: 95000, cost: 95000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 120 },
      { code: `P-${suffix}-083`, name: 'Sello de Seguridad Termoencogible para Frasco (Millar)', price: 45000, cost: 45000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 200 },
      { code: `P-${suffix}-084`, name: 'Cinta de Embalaje Transparente 48mmx100m (Paquete x 12)', price: 54000, cost: 54000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 110 },
      { code: `P-${suffix}-085`, name: 'Bolsa Burbuja de Protección para Envíos (Caja x 200)', price: 78000, cost: 78000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 130 },

      // SERVICIO (SERVICE) - 8
      { code: `P-${suffix}-086`, name: 'Sesión de Maquillaje Profesional para Novias', price: 250000, cost: 80000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-087`, name: 'Diagnóstico Capilar 3D con Microcámara', price: 80000, cost: 20000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-088`, name: 'Taller de Auto-Maquillaje Personalizado (2h)', price: 150000, cost: 40000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-089`, name: 'Servicio de Limpieza Facial Profunda Hydrafacial', price: 180000, cost: 50000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-090`, name: 'Asesoría de Colorimetría y Visagismo Facial', price: 120000, cost: 30000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-091`, name: 'Tratamiento Restaurador de Keratina en Cabina', price: 220000, cost: 70000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-092`, name: 'Mantenimiento Preventivo de Mezcladoras Cosméticas', price: 350000, cost: 120000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-093`, name: 'Curso Intensivo Formulaciones Cosméticas Naturales', price: 450000, cost: 150000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },

      // ACTIVO FIJO (FIXED_ASSET) - 7
      { code: `P-${suffix}-094`, name: 'Mezcladora Industrial de Cremas 50L Stainless Steel', price: 8500000, cost: 8500000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 2 },
      { code: `P-${suffix}-095`, name: 'Llenadora Neumática de Líquidos y Viscosos 500ml', price: 4200000, cost: 4200000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 3 },
      { code: `P-${suffix}-096`, name: 'Autoclave Digital de Esterilización Cosmética 24L', price: 3100000, cost: 3100000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 4 },
      { code: `P-${suffix}-097`, name: 'Mueble Exhibidor de Cristal Templado con Iluminación LED', price: 1850000, cost: 1850000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 6 },
      { code: `P-${suffix}-098`, name: 'Silla Reclinable Hidráulica para Maquillaje y Spa', price: 1450000, cost: 1450000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 8 },
      { code: `P-${suffix}-099`, name: 'Sistema de Cómputo All-in-One POS de Registro 21"', price: 2900000, cost: 2900000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 5 },
      { code: `P-${suffix}-100`, name: 'Lámpara LED Profesional de Anillo con Soporte 18"', price: 480000, cost: 480000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 10 },
    ];

    const rawStandardProducts = [
      // VENTA (SALE) - 8
      { code: `P-${suffix}-001`, name: 'Labial Matte Rouge Satin', price: 45000, cost: 22000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 45 },
      { code: `P-${suffix}-002`, name: 'Gloss Voluminizador Rose Gold', price: 38000, cost: 18000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 60 },
      { code: `P-${suffix}-003`, name: 'Paleta Sombras Amore 18 Tonos', price: 120000, cost: 60000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 25 },
      { code: `P-${suffix}-004`, name: 'Base Hydra Glow Tono 02 Medium', price: 68000, cost: 32000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.SALE, qty: 35 },
      { code: `P-${suffix}-005`, name: 'Sérum Ácido Hialurónico 2% Rejuvenecedor', price: 85000, cost: 40000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 50 },
      { code: `P-${suffix}-006`, name: 'Protector Solar Gel SPF 50+ Toque Seco', price: 65000, cost: 29000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.SALE, qty: 58 },
      { code: `P-${suffix}-007`, name: 'Champú Reparador Sin Sulfatos Argán 500ml', price: 46000, cost: 21000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 45 },
      { code: `P-${suffix}-008`, name: 'Mascarilla Capilar Keratina Intensiva 300g', price: 58000, cost: 27000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.SALE, qty: 29 },

      // PRODUCTO TERMINADO (FINISHED_GOOD) - 4
      { code: `P-${suffix}-009`, name: 'Kit Skincare Rutina Completa Antiedad', price: 210000, cost: 98000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 30 },
      { code: `P-${suffix}-010`, name: 'Cofre de Regalo Labiales Matte Edición Especial', price: 135000, cost: 62000, catCode: 'CAT-LAB', groupCode: 'GRP-MAQ', type: ProductType.FINISHED_GOOD, qty: 25 },
      { code: `P-${suffix}-011`, name: 'Lote Mascarilla Keratina Granel (Balde 10kg)', price: 420000, cost: 190000, catCode: 'CAT-TRT', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 12 },
      { code: `P-${suffix}-012`, name: 'Set Limpieza Facial Profunda Micelar + Gel', price: 62000, cost: 27000, catCode: 'CAT-SER', groupCode: 'GRP-SKN', type: ProductType.FINISHED_GOOD, qty: 44 },

      // MATERIA PRIMA (RAW_MATERIAL) - 3
      { code: `P-${suffix}-013`, name: 'Aceite Puro de Argán Marroquí Prensado (Litro)', price: 180000, cost: 180000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 50 },
      { code: `P-${suffix}-014`, name: 'Manteca de Karité Orgánica Sin Refinar (Kg)', price: 65000, cost: 65000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 80 },
      { code: `P-${suffix}-015`, name: 'Ácido Hialurónico Puro en Polvo USP (100g)', price: 240000, cost: 240000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 25 },

      // INSUMO / SUMINISTRO (SUPPLY) - 2
      { code: `P-${suffix}-016`, name: 'Frasco Gotero Vidrio Ámbar 30ml con Pipeta (Caja x 100)', price: 120000, cost: 120000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 150 },
      { code: `P-${suffix}-017`, name: 'Caja de Cartón Rígido Dorado con Imán (Paquete x 50)', price: 210000, cost: 210000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 45 },

      // SERVICIO (SERVICE) - 2
      { code: `P-${suffix}-018`, name: 'Sesión de Maquillaje Profesional para Novias', price: 250000, cost: 80000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-019`, name: 'Servicio de Limpieza Facial Profunda Hydrafacial', price: 180000, cost: 50000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },

      // ACTIVO FIJO (FIXED_ASSET) - 1
      { code: `P-${suffix}-020`, name: 'Mezcladora Industrial de Cremas 50L Stainless Steel', price: 8500000, cost: 8500000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.FIXED_ASSET, qty: 2 },
    ];

    const productsToCreate = isSuperAdmin ? rawSuperAdminProducts : rawStandardProducts;
    const createdProducts = [];

    for (let i = 0; i < productsToCreate.length; i++) {
      const raw = productsToCreate[i];
      const categoryId = getCatIdByCode(raw.catCode);

      const p = await prisma.product.create({
        data: {
          code: raw.code,
          name: raw.name,
          categoryId: categoryId,
          supplierId: i % 2 === 0 ? supplier1.id : supplier2.id,
          quantityAvailable: raw.qty,
          unitCost: raw.cost,
          salePrice: raw.price,
          soldQuantity: raw.type === ProductType.SALE ? 8 + (i % 10) : 0,
          type: raw.type,
          productGroupId: getGroupIdByCode(raw.groupCode),
          companyId,
        },
      });
      createdProducts.push(p);
      createdProductIds.push(p.id);
    }

    // 7. HISTORIAL DE VENTAS TRANSACCIONALES (8 a 10 Ventas)
    const now = new Date();
    const saleProducts = createdProducts.filter(p => p.type === ProductType.SALE || p.type === ProductType.FINISHED_GOOD);
    const customers = [customer1, customer2];

    const salesCount = isSuperAdmin ? 10 : 8;
    for (let i = 1; i <= salesCount; i++) {
      const saleDate = new Date();
      saleDate.setDate(now.getDate() - i * 2);

      const prod = saleProducts[i % saleProducts.length];
      const targetCustomer = customers[i % customers.length];
      const qty = 1 + (i % 3);
      const price = Number(prod.salePrice);
      const subtotal = qty * price;

      const sale = await prisma.sale.create({
        data: {
          saleNumber: `VEN-${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, '0')}${String(saleDate.getDate()).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
          userId,
          client: targetCustomer.name,
          customerId: targetCustomer.id,
          discount: 0,
          total: subtotal,
          paymentMethod: i % 2 === 0 ? "EFECTIVO" : "TRANSFERENCIA",
          status: "COMPLETED",
          companyId,
          createdAt: saleDate,
          details: {
            create: [
              {
                productId: prod.id,
                quantity: qty,
                unitPrice: price,
                subtotal,
                discount: 0,
                total: subtotal,
                companyId,
              }
            ]
          }
        }
      });
      createdSaleIds.push(sale.id);
    }

    // 8. FINANZAS: INGRESOS Y GASTOS DEMO
    const inc1 = await prisma.income.create({
      data: {
        description: `Venta mayorista de productos y asesorías ${suffix}`,
        amount: 2850000,
        category: IncomeCategory.SALES,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        companyId,
      }
    });
    createdIncomeIds.push(inc1.id);

    const inc2 = await prisma.income.create({
      data: {
        description: `Servicios de maquillaje y spa corporativo ${suffix}`,
        amount: 950000,
        category: IncomeCategory.SERVICES,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        companyId,
      }
    });
    createdIncomeIds.push(inc2.id);

    const exp1 = await prisma.expense.create({
      data: {
        description: `Pago de servicios públicos y arrendamiento ${suffix}`,
        amount: 650000,
        category: ExpenseCategory.UTILITIES,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        companyId,
      }
    });
    createdExpenseIds.push(exp1.id);

    const exp2 = await prisma.expense.create({
      data: {
        description: `Campaña publicitaria en Instagram y Google Ads ${suffix}`,
        amount: 420000,
        category: ExpenseCategory.MARKETING,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        companyId,
      }
    });
    createdExpenseIds.push(exp2.id);

    // 9. RECURSOS HUMANOS (RRHH): CARGOS, EMPLEADOS Y NÓMINA DEMO
    const position1 = await prisma.position.create({
      data: {
        name: `Asesor Comercial y Ventas ${suffix}`,
        baseSalary: 1450000,
        companyId,
      }
    });
    createdPositionIds.push(position1.id);

    const position2 = await prisma.position.create({
      data: {
        name: `Especialista en Belleza y Maquillaje ${suffix}`,
        baseSalary: 1800000,
        companyId,
      }
    });
    createdPositionIds.push(position2.id);

    const emp1 = await prisma.employee.create({
      data: {
        firstName: "Mariana",
        lastName: `López Restrepo ${suffix}`,
        documentId: `DOC-${suffix}-01`,
        email: `mariana_${suffix}@gns-demo.com`,
        phone: "3154567890",
        address: "Calle 100 #15-30",
        department: "Ventas",
        positionId: position1.id,
        hireDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        status: EmployeeStatus.ACTIVE,
        bankName: "Bancolombia",
        bankAccount: "987-654321-01",
        companyId,
      }
    });
    createdEmployeeIds.push(emp1.id);

    const emp2 = await prisma.employee.create({
      data: {
        firstName: "Andrés Felipe",
        lastName: `Morales ${suffix}`,
        documentId: `DOC-${suffix}-02`,
        email: `andres_${suffix}@gns-demo.com`,
        phone: "3189876543",
        address: "Carrera 15 #80-45",
        department: "Servicios & Estética",
        positionId: position2.id,
        hireDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        status: EmployeeStatus.ACTIVE,
        bankName: "Davivienda",
        bankAccount: "123-456789-02",
        companyId,
      }
    });
    createdEmployeeIds.push(emp2.id);

    const payroll = await prisma.payroll.create({
      data: {
        code: `NOM-${suffix}`,
        periodStart: new Date(now.getFullYear(), now.getMonth(), 1),
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        paymentDate: now,
        status: PayrollStatus.PAID,
        totalAmount: 3250000,
        companyId,
        details: {
          create: [
            {
              employeeId: emp1.id,
              baseSalary: 1450000,
              additions: 100000,
              deductions: 50000,
              netPay: 1500000,
              companyId,
            },
            {
              employeeId: emp2.id,
              baseSalary: 1800000,
              additions: 50000,
              deductions: 100000,
              netPay: 1750000,
              companyId,
            }
          ]
        }
      }
    });
    createdPayrollIds.push(payroll.id);

    // 10. USUARIOS DE PRUEBA (Para roles de venta/caja en la empresa)
    const userRole = await prisma.role.findFirst({ where: { name: 'USER' } });
    if (userRole) {
      const demoPasswordHash = await bcrypt.hash('Demo123*', 10);
      const demoUser = await prisma.user.upsert({
        where: { email: `vendedor_${suffix}@gns-demo.com` },
        update: {
          companyId,
          roleId: userRole.id,
        },
        create: {
          name: `Asesor Demo ${suffix}`,
          email: `vendedor_${suffix}@gns-demo.com`,
          password: demoPasswordHash,
          roleId: userRole.id,
          companyId,
          position: "Vendedor / Cajero",
          preferences: { plainPassword: 'Demo123*' },
        }
      }).catch(() => null);
      if (demoUser?.id) createdUserIds.push(demoUser.id);
    }

    // 11. REGISTRAR IDENTIFICADOR INTERNO DEL LOTE DE PRUEBA EN AUDITLOG
    await prisma.auditLog.create({
      data: {
        companyId,
        userId,
        module: "DEMO_DATA",
        action: "BATCH_CREATED",
        entity: "DemoBatch",
        description: `Lote de datos de demostración generado con sufijo ${suffix}`,
        newValues: {
          batchSuffix: suffix,
          generatedAt: new Date().toISOString(),
          groupIds: createdGroupIds,
          categoryIds: createdCategoryIds,
          supplierIds: createdSupplierIds,
          customerIds: createdCustomerIds,
          leadIds: createdLeadIds,
          opportunityIds: createdOpportunityIds,
          activityIds: createdActivityIds,
          contactIds: createdContactIds,
          quoteIds: createdQuoteIds,
          productIds: createdProductIds,
          saleIds: createdSaleIds,
          incomeIds: createdIncomeIds,
          expenseIds: createdExpenseIds,
          positionIds: createdPositionIds,
          employeeIds: createdEmployeeIds,
          payrollIds: createdPayrollIds,
          userIds: createdUserIds
        }
      }
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      message: isSuperAdmin
        ? "Se generaron exitosamente 100 productos, proveedores, ventas, finanzas, nómina y CRM para SuperAdmin."
        : "Se generaron exitosamente 20 productos de demostración con sus grupos, categorías, ventas, finanzas, RRHH, usuario de prueba y CRM."
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || "Error al generar datos de prueba" };
  }
}

/**
 * Elimina los datos de la empresa:
 * - mode === 'ONLY_DEMO': Elimina ÚNICAMENTE los registros pertenecientes al lote de prueba (dejando intactos productos/proveedores creados manualmente).
 * - mode === 'ALL': Vacía todo el catálogo y transacciones de la empresa (conservando cuentas de usuario).
 * Requiere la verificación de contraseña del Admin / SuperAdmin.
 */
export async function clearDemoData({
  targetCompanyId,
  mode = 'ONLY_DEMO',
  password
}: {
  targetCompanyId?: number;
  mode?: 'ONLY_DEMO' | 'ALL';
  password?: string;
}) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");

    const userId = Number(session.user.id);
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!currentUser || !currentUser.password) {
      throw new Error("Usuario no válido para autorizar la operación");
    }

    const isAdmin = currentUser.role?.name === 'ADMIN' || currentUser.role?.name === 'SUPERADMIN';
    if (!isAdmin) {
      throw new Error("Solo un Administrador o SuperAdmin puede autorizar la eliminación de datos.");
    }

    if (!password || password.trim() === '') {
      throw new Error("Debes ingresar tu contraseña de administrador para autorizar la eliminación.");
    }

    const isPasswordCorrect = await bcrypt.compare(password, currentUser.password);
    if (!isPasswordCorrect) {
      throw new Error("Contraseña incorrecta. Se requiere la contraseña del administrador para autorizar la eliminación.");
    }

    const companyId = targetCompanyId || (await resolveActionCompanyId());
    if (!companyId) throw new Error("Compañía no encontrada");

    // Protección estricta: solo permitir eliminación de registros pertenecientes a lotes de prueba
    if (mode !== 'ONLY_DEMO') {
      return {
        success: false,
        error: "Por seguridad de la plataforma, los datos reales de la empresa no pueden ser eliminados masivamente. Solo se permite limpiar lotes de prueba."
      };
    }

    // 1. Obtener los identificadores de lote de prueba guardados en AuditLog
    const demoBatches = await prisma.auditLog.findMany({
      where: {
        companyId,
        module: "DEMO_DATA",
        action: "BATCH_CREATED"
      }
    });

    const productIds = new Set<number>();
    const categoryIds = new Set<number>();
    const groupIds = new Set<number>();
    const supplierIds = new Set<number>();
    const customerIds = new Set<number>();
    const leadIds = new Set<number>();
    const opportunityIds = new Set<number>();
    const activityIds = new Set<number>();
    const contactIds = new Set<number>();
    const quoteIds = new Set<number>();
    const saleIds = new Set<number>();
    const incomeIds = new Set<number>();
    const expenseIds = new Set<number>();
    const positionIds = new Set<number>();
    const employeeIds = new Set<number>();
    const payrollIds = new Set<number>();
    const userIds = new Set<number>();
    const suffixes: string[] = [];

    demoBatches.forEach(batch => {
      const val = batch.newValues as any;
      if (val) {
        if (val.batchSuffix) suffixes.push(val.batchSuffix);
        val.productIds?.forEach((id: number) => productIds.add(id));
        val.categoryIds?.forEach((id: number) => categoryIds.add(id));
        val.groupIds?.forEach((id: number) => groupIds.add(id));
        val.supplierIds?.forEach((id: number) => supplierIds.add(id));
        val.customerIds?.forEach((id: number) => customerIds.add(id));
        val.leadIds?.forEach((id: number) => leadIds.add(id));
        val.opportunityIds?.forEach((id: number) => opportunityIds.add(id));
        val.activityIds?.forEach((id: number) => activityIds.add(id));
        val.contactIds?.forEach((id: number) => contactIds.add(id));
        val.quoteIds?.forEach((id: number) => quoteIds.add(id));
        val.saleIds?.forEach((id: number) => saleIds.add(id));
        val.incomeIds?.forEach((id: number) => incomeIds.add(id));
        val.expenseIds?.forEach((id: number) => expenseIds.add(id));
        val.positionIds?.forEach((id: number) => positionIds.add(id));
        val.employeeIds?.forEach((id: number) => employeeIds.add(id));
        val.payrollIds?.forEach((id: number) => payrollIds.add(id));
        val.userIds?.forEach((id: number) => userIds.add(id));
      }
    });

    await prisma.$transaction(async (tx) => {
      // Eliminar detalles de ventas y ventas demo
      if (saleIds.size > 0 || productIds.size > 0) {
        await tx.saleDetail.deleteMany({
          where: {
            companyId,
            OR: [
              saleIds.size > 0 ? { saleId: { in: Array.from(saleIds) } } : {},
              productIds.size > 0 ? { productId: { in: Array.from(productIds) } } : {},
            ]
          }
        }).catch(() => {});
      }

      if (saleIds.size > 0) {
        await tx.sale.deleteMany({
          where: { companyId, id: { in: Array.from(saleIds) } }
        }).catch(() => {});
      }

      // CRM: Cotizaciones, Actividades, Contactos, Oportunidades, Leads demo
      if (quoteIds.size > 0) {
        await tx.quote.deleteMany({ where: { companyId, id: { in: Array.from(quoteIds) } } }).catch(() => {});
      }
      if (activityIds.size > 0) {
        await tx.activity.deleteMany({ where: { companyId, id: { in: Array.from(activityIds) } } }).catch(() => {});
      }
      if (contactIds.size > 0) {
        await tx.contact.deleteMany({ where: { companyId, id: { in: Array.from(contactIds) } } }).catch(() => {});
      }
      if (opportunityIds.size > 0) {
        await tx.opportunity.deleteMany({ where: { companyId, id: { in: Array.from(opportunityIds) } } }).catch(() => {});
      }
      if (leadIds.size > 0) {
        await tx.lead.deleteMany({ where: { companyId, id: { in: Array.from(leadIds) } } }).catch(() => {});
      }

      // Nómina y RRHH demo
      if (payrollIds.size > 0) {
        await tx.payrollDetail?.deleteMany({ where: { companyId, payrollId: { in: Array.from(payrollIds) } } }).catch(() => {});
        await tx.payroll?.deleteMany({ where: { companyId, id: { in: Array.from(payrollIds) } } }).catch(() => {});
      }
      await tx.payroll?.deleteMany({ where: { companyId, code: { startsWith: 'NOM-' } } }).catch(() => {});

      if (employeeIds.size > 0) {
        await tx.employeeNovelty?.deleteMany({ where: { companyId, employeeId: { in: Array.from(employeeIds) } } }).catch(() => {});
        await tx.employee?.deleteMany({ where: { companyId, id: { in: Array.from(employeeIds) } } }).catch(() => {});
      }
      await tx.employee?.deleteMany({ where: { companyId, email: { contains: '@gns-demo.com' } } }).catch(() => {});

      if (positionIds.size > 0) {
        await tx.position?.deleteMany({ where: { companyId, id: { in: Array.from(positionIds) } } }).catch(() => {});
      }

      // Finanzas demo
      if (incomeIds.size > 0) {
        await tx.income.deleteMany({ where: { companyId, id: { in: Array.from(incomeIds) } } }).catch(() => {});
      }
      if (expenseIds.size > 0) {
        await tx.expense.deleteMany({ where: { companyId, id: { in: Array.from(expenseIds) } } }).catch(() => {});
      }

      // Productos de demostración (SOLO los IDs de demostración)
      if (productIds.size > 0) {
        await tx.product.deleteMany({ where: { companyId, id: { in: Array.from(productIds) } } }).catch(() => {});
      }

      // Categorías de demostración
      if (categoryIds.size > 0) {
        await tx.category.deleteMany({ where: { companyId, id: { in: Array.from(categoryIds) } } }).catch(() => {});
      }

      // Grupos de productos de demostración
      if (groupIds.size > 0) {
        await tx.productGroup.deleteMany({ where: { companyId, id: { in: Array.from(groupIds) } } }).catch(() => {});
      }

      // Proveedores de demostración
      if (supplierIds.size > 0) {
        await tx.supplier.deleteMany({ where: { companyId, id: { in: Array.from(supplierIds) } } }).catch(() => {});
      }

      // Clientes de demostración
      if (customerIds.size > 0) {
        await tx.customer.deleteMany({ where: { companyId, id: { in: Array.from(customerIds) } } }).catch(() => {});
      }

      // Usuarios demo temporales
      await tx.user.deleteMany({ where: { companyId, email: { contains: '@gns-demo.com' } } }).catch(() => {});

      // Eliminar los registros de seguimiento del lote de prueba
      await tx.auditLog.deleteMany({
        where: { companyId, module: "DEMO_DATA" }
      });
    });

    revalidatePath("/", "layout");
    return {
      success: true,
      message: "Se han eliminado exitosamente todos los datos de prueba. Todos tus productos, clientes y registros creados manualmente se conservan intactos."
    };
  } catch (error: any) {
    console.error('[CLEAR_DEMO_DATA_ERROR]', error);
    return { success: false, error: error.message || "Error al procesar la eliminación de datos." };
  }
}

/**
 * Limpieza global del sistema (Deshabilitada para protección de datos de producción).
 */
export async function clearGlobalSystemData({ password }: { password?: string } = {}) {
  return {
    success: false,
    error: "Por política de seguridad y protección de datos, el vaciado global transaccional está deshabilitado. Solo se permite limpiar lotes de prueba por empresa."
  };
}
