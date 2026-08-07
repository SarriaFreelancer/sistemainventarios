"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { resolveActionCompanyId, resolveActionUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

import { ProductType, CustomerStatus } from "@prisma/client";

export async function generateDemoData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    const companyId = await resolveActionCompanyId();
    if (!companyId) throw new Error("Compañía no encontrada");
    const userId = await resolveActionUserId(session.user.id);

    const suffix = Date.now().toString().slice(-4);

    // 1. GRUPOS (10 Grupos)
    const groupDefs = [
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
    ];

    const createdGroups: any[] = [];
    for (const g of groupDefs) {
      const group = await prisma.productGroup.create({
        data: { name: g.name, code: g.code, status: 'ACTIVE', companyId }
      });
      createdGroups.push(group);
    }

    const getGroupIdByCode = (codePrefix: string) => {
      const found = createdGroups.find(g => g.code.startsWith(codePrefix));
      return found ? found.id : createdGroups[0].id;
    };

    // 2. CATEGORÍAS (20 Categorías)
    const categoryDefs = [
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
    }

    const getCatIdByCode = (codePrefix: string) => {
      const found = createdCategories.find(c => c.code.startsWith(codePrefix));
      return found ? found.id : createdCategories[0].id;
    };

    // 3. PROVEEDORES
    const supplier = await prisma.supplier.create({
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

    // 4. CLIENTE
    const customer = await prisma.customer.create({
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

    // 5. CATÁLOGO DE 105 PRODUCTOS REALES
    const rawProducts = [
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
      { code: `P-${suffix}-039`, name: 'Lote Champú Nutritivo Orgánico (Balde 20L)', price: 650000, cost: 310000, catCode: 'CAT-SHA', groupCode: 'GRP-CAP', type: ProductType.FINISHED_GOOD, qty: 8 },
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

      // MATERIA PRIMA (RAW_MATERIAL) - 20
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
      { code: `P-${suffix}-071`, name: 'Aceite de Coco Nucifera Virgen Extra (Kg)', price: 48000, cost: 48000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 90 },
      { code: `P-${suffix}-072`, name: 'Óxidos de Hierro Mineral Pigmento Rojo (Kg)', price: 95000, cost: 95000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 22 },
      { code: `P-${suffix}-073`, name: 'Extracto Oleoso de Romero Silvestre (Litro)', price: 82000, cost: 82000, catCode: 'CAT-ING', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 38 },
      { code: `P-${suffix}-074`, name: 'Conservante Natural Eco-Certificado (500ml)', price: 135000, cost: 135000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 27 },
      { code: `P-${suffix}-075`, name: 'Filtro Solar UV Bisoctrizol Polvo (500g)', price: 210000, cost: 210000, catCode: 'CAT-ACT', groupCode: 'GRP-MPR', type: ProductType.RAW_MATERIAL, qty: 15 },

      // INSUMO / SUMINISTRO (SUPPLY) - 15
      { code: `P-${suffix}-076`, name: 'Frasco Gotero Vidrio Ámbar 30ml con Ppipeta (Caja x 100)', price: 120000, cost: 120000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 150 },
      { code: `P-${suffix}-077`, name: 'Pote Acrílico Transparente 50g Tapa Dorada (Caja x 100)', price: 165000, cost: 165000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 110 },
      { code: `P-${suffix}-078`, name: 'Envase Airless Blanco 50ml para Sérum (Caja x 50)', price: 140000, cost: 140000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 85 },
      { code: `P-${suffix}-079`, name: 'Tubo Colapsable para Labial 5ml (Caja x 200)', price: 180000, cost: 180000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 95 },
      { code: `P-${suffix}-080`, name: 'Válvula Atomizadora Spray Dorada 24/410 (Caja x 200)', price: 130000, cost: 130000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 140 },
      { code: `P-${suffix}-081`, name: 'Etiqueta Térmica Autoadhesiva 50x30mm (Rollo x 1000)', price: 28000, cost: 28000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 300 },
      { code: `P-${suffix}-082`, name: 'Caja de Cartón Rígido Dorado con Imán (Paquete x 50)', price: 210000, cost: 210000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 45 },
      { code: `P-${suffix}-083`, name: 'Cinta Embellecedora Satinada Negra 25mm (Rollo 100m)', price: 35000, cost: 35000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 80 },
      { code: `P-${suffix}-084`, name: 'Bolsa Ecológica de Lienzo con Logo (Paquete x 100)', price: 250000, cost: 250000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 60 },
      { code: `P-${suffix}-085`, name: 'Papel Seda Protector Impreso con Marca (Paquete 500 h.)', price: 68000, cost: 68000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 70 },
      { code: `P-${suffix}-086`, name: 'Frasco Espumador 150ml con Bomba Lather (Caja x 50)', price: 155000, cost: 155000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 90 },
      { code: `P-${suffix}-087`, name: 'Tapa Rosca de Aluminio 28mm (Caja x 500)', price: 95000, cost: 95000, catCode: 'CAT-FRS', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 120 },
      { code: `P-${suffix}-088`, name: 'Sello de Seguridad Termoencogible para Frasco (Millar)', price: 45000, cost: 45000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 200 },
      { code: `P-${suffix}-089`, name: 'Cinta de Embalaje Transparente 48mmx100m (Paquete x 12)', price: 54000, cost: 54000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 110 },
      { code: `P-${suffix}-090`, name: 'Bolsa Burbuja de Protección para Envíos (Caja x 200)', price: 78000, cost: 78000, catCode: 'CAT-CAJ', groupCode: 'GRP-SUM', type: ProductType.SUPPLY, qty: 130 },

      // SERVICIO (SERVICE) - 8
      { code: `P-${suffix}-091`, name: 'Sesión de Maquillaje Profesional para Novias', price: 250000, cost: 80000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-092`, name: 'Diagnóstico Capilar 3D con Microcámara', price: 80000, cost: 20000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-093`, name: 'Taller de Auto-Maquillaje Personalizado (2h)', price: 150000, cost: 40000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-094`, name: 'Servicio de Limpieza Facial Profunda Hydrafacial', price: 180000, cost: 50000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-095`, name: 'Asesoría de Colorimetría y Visagismo Facial', price: 120000, cost: 30000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-096`, name: 'Tratamiento Restaurador de Keratina en Cabina', price: 220000, cost: 70000, catCode: 'CAT-SPA', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-097`, name: 'Mantenimiento Preventivo de Mezcladoras Cosméticas', price: 350000, cost: 120000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },
      { code: `P-${suffix}-098`, name: 'Curso Intensivo Formulaciones Cosméticas Naturales', price: 450000, cost: 150000, catCode: 'CAT-CON', groupCode: 'GRP-SER', type: ProductType.SERVICE, qty: 999 },

      // ACTIVO FIJO (FIXED_ASSET) - 7
      { code: `P-${suffix}-099`, name: 'Mezcladora Industrial de Cremas 50L Stainless Steel', price: 8500000, cost: 8500000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 2 },
      { code: `P-${suffix}-100`, name: 'Llenadora Neumática de Líquidos y Viscosos 500ml', price: 4200000, cost: 4200000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 3 },
      { code: `P-${suffix}-101`, name: 'Autoclave Digital de Esterilización Cosmética 24L', price: 3100000, cost: 3100000, catCode: 'CAT-MAQ', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 4 },
      { code: `P-${suffix}-102`, name: 'Mueble Exhibidor de Cristal Templado con Iluminación LED', price: 1850000, cost: 1850000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 6 },
      { code: `P-${suffix}-103`, name: 'Silla Reclinable Hidráulica para Maquillaje y Spa', price: 1450000, cost: 1450000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 8 },
      { code: `P-${suffix}-104`, name: 'Sistema de Cómputo All-in-One POS de Registro 21"', price: 2900000, cost: 2900000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 5 },
      { code: `P-${suffix}-105`, name: 'Lámpara LED Profesional de Anillo con Soporte 18"', price: 480000, cost: 480000, catCode: 'CAT-MOB', groupCode: 'GRP-ACT', type: ProductType.FIXED_ASSET, qty: 10 },
    ];

    const createdProducts = [];
    for (let i = 0; i < rawProducts.length; i++) {
      const raw = rawProducts[i];
      const categoryId = getCatIdByCode(raw.catCode);

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
          companyId,
        },
      });
      createdProducts.push(p);
    }

    // 6. HISTORIAL DE 10 VENTAS HISTÓRICAS
    const now = new Date();
    const saleProducts = createdProducts.filter(p => p.type === ProductType.SALE || p.type === ProductType.FINISHED_GOOD);
    
    for (let i = 1; i <= 10; i++) {
      const saleDate = new Date();
      saleDate.setDate(now.getDate() - i * 2);

      const prod = saleProducts[i % saleProducts.length];
      const qty = 1 + (i % 3);
      const price = Number(prod.salePrice);
      const subtotal = qty * price;

      await prisma.sale.create({
        data: {
          saleNumber: `VEN-${saleDate.getFullYear()}${String(saleDate.getMonth() + 1).padStart(2, '0')}${String(saleDate.getDate()).padStart(2, '0')}-${String(i).padStart(3, '0')}`,
          userId,
          client: customer.name,
          customerId: customer.id,
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
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: error.message || "Error al generar datos de prueba" };
  }
}

export async function clearDemoData(targetCompanyId?: number) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) throw new Error("No autenticado");
    
    const isSuperAdmin = session.user.role === 'SUPERADMIN';
    const companyId = targetCompanyId || (await resolveActionCompanyId());
    if (!companyId) throw new Error("Compañía no encontrada");

    // Limpieza completa por empresa conservando usuarios, licencias y la empresa misma
    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { companyId } });
      await tx.auditLog.deleteMany({ where: { companyId } });
      await tx.saleDetail.deleteMany({ where: { companyId } });
      await tx.sale.deleteMany({ where: { companyId } });
      await tx.opportunity.deleteMany({ where: { companyId } });
      await tx.customer.deleteMany({ where: { companyId } });
      await tx.product.deleteMany({ where: { companyId } });
      await tx.category.deleteMany({ where: { companyId } });
      await tx.productGroup.deleteMany({ where: { companyId } });
      await tx.supplier.deleteMany({ where: { companyId } });
      await tx.invoiceCounter.deleteMany({ where: { companyId } });
      
      // Borrar empleados y posiciones de demostración/RRHH de la empresa si existen
      await tx.employee?.deleteMany({ where: { companyId } }).catch(() => {});
      await tx.position?.deleteMany({ where: { companyId } }).catch(() => {});
    });

    revalidatePath("/", "layout");
    return { success: true, message: "Datos transaccionales y de catálogo limpiados correctamente. Las cuentas de usuario y licencias fueron conservadas." };
  } catch (error: any) {
    console.error('[CLEAR_DEMO_DATA_ERROR]', error);
    return { success: false, error: error.message };
  }
}

export async function clearGlobalSystemData() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || session.user.role !== 'SUPERADMIN') {
      return { success: false, error: "Solo el SUPERADMIN puede ejecutar una limpieza global del sistema." };
    }

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.saleDetail.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.opportunity.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.productGroup.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.invoiceCounter.deleteMany();
    await prisma.employee?.deleteMany().catch(() => {});
    await prisma.position?.deleteMany().catch(() => {});

    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

    revalidatePath("/", "layout");
    return { success: true, message: "Se han eliminado todos los productos, ventas y registros de todas las empresas. Todas las cuentas de usuario y empresas se conservan activas para seguir iniciando sesión." };
  } catch (error: any) {
    console.error('[CLEAR_GLOBAL_DATA_ERROR]', error);
    return { success: false, error: error.message };
  }
}
