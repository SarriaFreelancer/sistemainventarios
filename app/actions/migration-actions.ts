"use server";

import { platformDb, monolithDb, encryptPassword } from "@/lib/db-manager";
import crypto from 'crypto';
import { exec } from "child_process";
import util from "util";
import { getAuthSession } from "@/auth";
import { PrismaClient as TenantClient } from "@prisma-tenant/client";

const execPromise = util.promisify(exec);

function decryptPasswordLocal(encrypted: string): string {
  const secretKey = process.env.ENCRYPTION_KEY;
  if (!secretKey) return encrypted;
  
  try {
    const parts = encrypted.split(':');
    if (parts.length !== 2) return encrypted;
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    return encrypted;
  }
}

export async function getCompaniesForMigration() {
  const session = await getAuthSession();
  if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN')) return [];
  
  const isSuperAdmin = session.user.role === 'SUPERADMIN';
  const whereClause = isSuperAdmin ? {} : { id: Number(session.user.companyId) };

  return await platformDb.company.findMany({
    where: whereClause,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, serverId: true, databaseName: true, databaseType: true }
  });
}

export async function migrateCompany(companyId: string, serverId: string, databaseType: "SHARED" | "DEDICATED", customDbName?: string) {
  const session = await getAuthSession();
  if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN')) {
    return { success: false, error: 'No autorizado' };
  }

  // Security check for ADMIN
  if (session.user.role === 'ADMIN' && Number(companyId) !== Number(session.user.companyId)) {
    return { success: false, error: 'No autorizado para migrar otras empresas' };
  }

  let tenantDb: any = null;
  let sourceDb: any = monolithDb;
  let isReMigration = false;

  try {
    const oldCompanyId = Number(companyId); // El id anterior era Int

    // 1. Obtener la empresa original desde Platform (o Monolito, pero ya la pasamos a Platform)
    const company = await platformDb.company.findUnique({
      where: { id: oldCompanyId }
    });
    if (!company) throw new Error("Empresa no encontrada");

    // 2. Obtener el servidor destino
    const server = await platformDb.server.findUnique({
      where: { id: serverId }
    });
    if (!server) throw new Error("Servidor no encontrado");

    // 3. Determinar el nombre de la BD
    let databaseName = customDbName;
    if (databaseType === 'SHARED') {
      databaseName = 'shared_sarriatech'; // Nombre por defecto para las compartidas
    } else if (!databaseName) {
      databaseName = `tenant_${companyId}`;
    }

    // 4. Ejecutar Prisma DB Push en el servidor de destino para crear la BD y las tablas
    const password = decryptPasswordLocal(server.password);
    const connectionUrl = `mysql://${server.username}:${encodeURIComponent(password)}@${server.host}:${server.port}/${databaseName}`;

    // Ejecutamos db push (creará la DB si no existe)
    console.log(`Ejecutando push a ${databaseName}...`);
    const { stdout, stderr } = await execPromise(`npx prisma db push --schema=prisma/tenant/schema.prisma --accept-data-loss`, {
      env: {
        ...process.env,
        TENANT_DATABASE_URL: connectionUrl
      }
    });
    console.log("Prisma push result:", stdout);

    // 5. Transferencia de datos
    console.log("Instanciando cliente del nuevo tenant...");
    tenantDb = new TenantClient({
      datasources: { db: { url: connectionUrl } }
    });

    // 5. Instanciar Base de Datos de Origen
    let searchCompanyId: any = oldCompanyId; // Por defecto busca Int
    
    if (company.serverId) {
      // Re-migración: la empresa ya estaba en un Tenant DB
      const oldServer = await platformDb.server.findUnique({ where: { id: company.serverId } });
      if (oldServer && company.databaseName) {
        isReMigration = true;
        searchCompanyId = String(company.id); // En TenantDB, companyId es String
        const oldPass = decryptPasswordLocal(oldServer.password);
        const oldUrl = `mysql://${oldServer.username}:${encodeURIComponent(oldPass)}@${oldServer.host}:${oldServer.port}/${company.databaseName}`;
        sourceDb = new TenantClient({ datasources: { db: { url: oldUrl } } });
      }
    }

    console.log(`Extrayendo datos de la empresa desde el ${isReMigration ? 'Tenant Origen' : 'Monolito'}...`);
    
    // Obtenemos todos los datos (orden de dependencias)
    const [
      customers,
      suppliers,
      productGroups,
    ] = await Promise.all([
      sourceDb.customer.findMany({ where: { companyId: searchCompanyId } }), 
      sourceDb.supplier.findMany({ where: { companyId: searchCompanyId } }),
      sourceDb.productGroup.findMany({ where: { companyId: searchCompanyId } })
    ]);

    // Función de formateo: Si viene del monolito hay que castear companyId a String. Si viene de Tenant, ya lo es.
    const formatData = (items: any[]) => items.map(item => ({...item, companyId: String(company.id)}));

    if (customers.length > 0) {
      await tenantDb.customer.createMany({ data: formatData(customers), skipDuplicates: true });
    }
    if (suppliers.length > 0) {
      await tenantDb.supplier.createMany({ data: formatData(suppliers), skipDuplicates: true });
    }
    if (productGroups.length > 0) {
      await tenantDb.productGroup.createMany({ data: formatData(productGroups), skipDuplicates: true });
    }

    // Categorias y Productos
    const categories = await sourceDb.category.findMany({ where: { companyId: searchCompanyId } });
    if (categories.length > 0) {
      await tenantDb.category.createMany({ data: formatData(categories), skipDuplicates: true });
    }

    const products = await sourceDb.product.findMany({ where: { companyId: searchCompanyId } });
    if (products.length > 0) {
      await tenantDb.product.createMany({ data: formatData(products), skipDuplicates: true });
    }

    // Ventas
    const sales = await sourceDb.sale.findMany({ where: { companyId: searchCompanyId } });
    if (sales.length > 0) {
      await tenantDb.sale.createMany({ data: formatData(sales), skipDuplicates: true });
    }

    const saleDetails = await sourceDb.saleDetail.findMany({ where: { companyId: searchCompanyId } });
    if (saleDetails.length > 0) {
      await tenantDb.saleDetail.createMany({ data: formatData(saleDetails), skipDuplicates: true });
    }

    // 6. Actualizar registro en Platform DB para apuntar a la nueva base de datos
    await platformDb.company.update({
      where: { id: company.id },
      data: {
        serverId: server.id,
        databaseName,
        databaseType: databaseType as any
      }
    });

    console.log(`Migración de ${company.name} completada exitosamente.`);
    return { success: true };

  } catch (error: any) {
    console.error("Error en migración:", error);
    return { success: false, error: error.message || "Fallo en la migración" };
  } finally {
    if (tenantDb) {
      await tenantDb.$disconnect();
    }
    if (isReMigration && sourceDb) {
      await sourceDb.$disconnect();
    }
  }
}
