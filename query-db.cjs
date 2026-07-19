const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  console.log(JSON.stringify(companies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
