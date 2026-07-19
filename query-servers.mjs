import { PrismaClient } from '@prisma-platform/client';
const prisma = new PrismaClient();

async function main() {
  const servers = await prisma.server.findMany();
  console.log(JSON.stringify(servers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
