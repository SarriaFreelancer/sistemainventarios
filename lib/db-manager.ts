import { PrismaClient as PlatformClient } from '@prisma-platform/client';
import { PrismaClient as TenantClient } from '@prisma-tenant/client';
import crypto from 'crypto';

// The global platform client
export const platformDb = new PlatformClient();

// Cache for tenant clients to avoid connection exhaustion
const tenantClients = new Map<string, TenantClient>();

function decryptPassword(encrypted: string): string {
  const secretKey = process.env.ENCRYPTION_KEY;
  if (!secretKey) return encrypted; // Si no hay llave, asumimos texto plano por ahora (transición)
  
  try {
    const parts = encrypted.split(':');
    if (parts.length !== 2) return encrypted; // No está en el formato cifrado
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Error decrypting password', error);
    return encrypted; // Fallback
  }
}

export function encryptPassword(text: string): string {
  const secretKey = process.env.ENCRYPTION_KEY;
  if (!secretKey) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function getTenantDb(companyId: string): Promise<TenantClient> {
  // 1. Obtener la compañía y su servidor desde la Platform DB
  const company = await platformDb.company.findUnique({
    where: { id: Number(companyId) },
    include: { server: true }
  });

  if (!company) {
    throw new Error(`Empresa no encontrada: ${companyId}`);
  }

  const { server, databaseName } = company;
  
  if (!server) {
    throw new Error(`La empresa ${companyId} no tiene un servidor asignado.`);
  }

  const cacheKey = `${server.id}_${databaseName}`;

  // 2. Revisar caché
  if (tenantClients.has(cacheKey)) {
    return tenantClients.get(cacheKey)!;
  }

  // 3. Construir URL de conexión
  const password = decryptPassword(server.password);
  
  // mysql://USER:PASSWORD@HOST:PORT/DATABASE
  // TODO: Add support for postgresql / sqlserver depending on server.engine
  const connectionUrl = `mysql://${server.username}:${encodeURIComponent(password)}@${server.host}:${server.port}/${databaseName}`;

  // 4. Instanciar PrismaClient para el tenant
  const client = new TenantClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });

  // 5. Guardar en caché y retornar
  tenantClients.set(cacheKey, client);
  
  return client;
}

// Fallback al monolito original
import { PrismaClient as MonolithicClient } from '@prisma/client';
// Hacemos el singleton del monolito
const globalForMonolith = globalThis as unknown as { monolithDb: MonolithicClient | undefined };
export const monolithDb = globalForMonolith.monolithDb ?? new MonolithicClient();
if (process.env.NODE_ENV !== 'production') globalForMonolith.monolithDb = monolithDb;

/**
 * Función centralizada que los módulos de negocio llamarán.
 * Determina si la empresa ya fue migrada a la arquitectura Tenant o si sigue en el Monolito.
 */
export async function getDatabaseClient(companyId: string | number) {
  const cId = Number(companyId);
  const company = await platformDb.company.findUnique({
    where: { id: cId }
  });

  // Si tiene serverId asignado, significa que ya fue migrada y utiliza un Tenant (Dedicated/Shared)
  if (company && company.serverId) {
    return await getTenantDb(String(cId));
  }

  // De lo contrario, retorna la conexión a la base de datos monolítica actual
  return monolithDb;
}
