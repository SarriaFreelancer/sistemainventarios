const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, companyId: true, isLocked: true }
  });
  console.log(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
