import { PrismaClient } from '@prisma-tenant/client';
const prisma = new PrismaClient({
  datasources: {
    db: { url: "mysql://root:root@localhost:3306/inventario_produccion" }
  }
});
async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE Product ADD COLUMN type ENUM('SALE', 'RAW_MATERIAL', 'FINISHED_GOOD', 'SUPPLY', 'SERVICE', 'FIXED_ASSET') NOT NULL DEFAULT 'SALE';`);
    console.log("Successfully added column type to Product");
  } catch (err: any) {
    if (err.message.includes('Duplicate column name')) {
      console.log("Column type already exists.");
    } else {
      console.error(err);
    }
  }
}
main().finally(() => prisma.$disconnect());
