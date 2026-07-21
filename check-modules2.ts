import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const modules = await prisma.module.findMany();
  console.log('All modules in DB:', modules.map(m => m.name).join(', '));
  await prisma.$disconnect();
}
run().catch(console.error);
