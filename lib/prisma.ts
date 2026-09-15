import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const isClientUpToDate = (client?: PrismaClient): boolean => {
  if (!client) return false;
  const anyClient = client as any;
  const fields = anyClient._runtimeDataModel?.models?.Company?.fields;
  if (Array.isArray(fields)) {
    return fields.some((f: any) => f.name === 'isTrial');
  }
  return true;
};

export const prisma = (globalForPrisma.prisma && isClientUpToDate(globalForPrisma.prisma))
  ? globalForPrisma.prisma
  : new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
