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
  if (!session || session.user.role !== 'SUPERADMIN') return [];
  
  return await platformDb.company.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, serverId: true, databaseName: true, databaseType: true }
  });
}

export async function migrateCompany(companyId: string, serverId: string, databaseType: "SHARED" | "DEDICATED", customDbName?: string) {
  const session = await getAuthSession();
  if (!session || session.user.role !== 'SUPERADMIN') {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const oldCompanyId = Number(companyId); // El id anterior era Int

    // 1. Obtener la empresa original desde Platform (o Monolito, pero ya la pasamos a Platform)
    const company = await platformDb.company.findUnique({
      where: { id: String(companyId) }
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
    const tenantDb = new TenantClient({
      datasources: { db: { url: connectionUrl } }
    });

    console.log("Extrayendo datos de la empresa desde el monolito...");
    
    // Obtenemos todos los datos (orden de dependencias)
    const [
      customers,
      suppliers,
      productGroups,
    ] = await Promise.all([
      monolithDb.customer.findMany({ where: { companyId: oldCompanyId } }), 
      monolithDb.supplier.findMany({ where: { companyId: oldCompanyId } }),
      monolithDb.productGroup.findMany({ where: { companyId: oldCompanyId } })
    ]);

    // Insertar en Tenant (simplificado para la fase 1, asumiendo id's idénticos para no romper relacionales si usamos createMany)
    // Para migrar sin perder IDs (autoincrementales), en MySQL se puede insertar el ID si el ORM lo permite (Prisma permite insert explicit IDs)
    
    if (customers.length > 0) {
      await tenantDb.customer.createMany({ data: customers.map(c => ({...c, companyId: company.id})), skipDuplicates: true });
    }
    if (suppliers.length > 0) {
      await tenantDb.supplier.createMany({ data: suppliers.map(s => ({...s, companyId: company.id})), skipDuplicates: true });
    }
    if (productGroups.length > 0) {
      await tenantDb.productGroup.createMany({ data: productGroups.map(pg => ({...pg, companyId: company.id})), skipDuplicates: true });
    }

    // Categorias y Productos
    const categories = await monolithDb.category.findMany({ where: { companyId: oldCompanyId } });
    if (categories.length > 0) {
      await tenantDb.category.createMany({ data: categories.map(c => ({...c, companyId: company.id})), skipDuplicates: true });
    }

    const products = await monolithDb.product.findMany({ where: { companyId: oldCompanyId } });
    if (products.length > 0) {
      // Necesitamos limpiar campos que ya no están o cambiar tipos si hubieron cambios en el nuevo schema tenant
      const cleanProducts = products.map((p: any) => {
        return {
          ...p,
          companyId: company.id
        }
      });
      await tenantDb.product.createMany({ data: cleanProducts, skipDuplicates: true });
    }

    // Ventas
    const sales = await monolithDb.sale.findMany({ where: { companyId: oldCompanyId } });
    if (sales.length > 0) {
      await tenantDb.sale.createMany({ data: sales.map(s => ({...s, companyId: company.id})), skipDuplicates: true });
    }

    const saleDetails = await monolithDb.saleDetail.findMany({ where: { companyId: oldCompanyId } });
    if (saleDetails.length > 0) {
      await tenantDb.saleDetail.createMany({ data: saleDetails.map(sd => ({...sd, companyId: company.id})), skipDuplicates: true });
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
  }
}
