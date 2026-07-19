import { PrismaClient } from '@prisma-platform/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("Altering Server.engine ENUM in MySQL...");
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Server 
      MODIFY engine ENUM('MYSQL', 'POSTGRESQL', 'SQLSERVER', 'ORACLE', 'AZURE_SQL', 'AWS_SQL') NOT NULL;
    `);
    console.log("Enum altered successfully!");
  } catch (error) {
    console.error("Error altering enum:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
