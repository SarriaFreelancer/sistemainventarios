import { platformDb } from "./lib/db-manager";

async function createTable() {
  try {
    console.log("Creando tabla SubscriptionPayment...");
    await platformDb.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`SubscriptionPayment\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`companyId\` INT NOT NULL,
        \`planId\` VARCHAR(191) NOT NULL,
        \`amount\` DOUBLE NOT NULL,
        \`currency\` VARCHAR(191) NOT NULL DEFAULT 'COP',
        \`boldReference\` VARCHAR(191) NOT NULL,
        \`status\` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
        \`boldTransactionId\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        UNIQUE INDEX \`SubscriptionPayment_boldReference_key\`(\`boldReference\`),
        INDEX \`SubscriptionPayment_companyId_idx\`(\`companyId\`),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // We don't necessarily add the foreign key manually to avoid strict errors if there are discrepancies,
    // but Prisma expects it. Let's try adding it:
    try {
      await platformDb.$executeRawUnsafe(`
        ALTER TABLE \`SubscriptionPayment\` ADD CONSTRAINT \`SubscriptionPayment_companyId_fkey\` FOREIGN KEY (\`companyId\`) REFERENCES \`Company\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
      console.log("Foreign key agregada con éxito.");
    } catch (fkError: any) {
      if (fkError.message.includes("Duplicate") || fkError.message.includes("already exists")) {
        console.log("La Foreign Key ya existe.");
      } else {
        console.log("Warning al agregar Foreign Key:", fkError.message);
      }
    }

    console.log("¡Tabla SubscriptionPayment creada correctamente!");
    process.exit(0);
  } catch (error) {
    console.error("Error creando tabla:", error);
    process.exit(1);
  }
}

createTable();
