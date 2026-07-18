import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Creando tabla Server...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`Server\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`engine\` ENUM('MYSQL', 'POSTGRESQL', 'SQLSERVER') NOT NULL,
      \`host\` VARCHAR(191) NOT NULL,
      \`port\` INTEGER NOT NULL,
      \`username\` VARCHAR(191) NOT NULL,
      \`password\` VARCHAR(191) NOT NULL,
      \`ssl\` BOOLEAN NOT NULL DEFAULT false,
      \`active\` BOOLEAN NOT NULL DEFAULT true,
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log("Agregando columnas a Company...");
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`Company\`
        ADD COLUMN \`active\` BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN \`currentVersion\` VARCHAR(191) NULL,
        ADD COLUMN \`databaseName\` VARCHAR(191) NULL,
        ADD COLUMN \`databaseType\` ENUM('SHARED', 'DEDICATED') NULL,
        ADD COLUMN \`planId\` VARCHAR(191) NULL,
        ADD COLUMN \`serverId\` VARCHAR(191) NULL;
    `);
  } catch (e) {
    console.log("Columnas de Company probablemente ya existen o hubo un error:", e.message);
  }

  console.log("Completado exitosamente");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
