const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    include: {
      users: {
        select: { id: true, email: true, name: true }
      }
    }
  });
  console.log("=== COMPANIES ===");
  console.log(JSON.stringify(companies, null, 2));

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, companyId: true }
  });
  console.log("=== ALL USERS ===");
  console.log(JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
