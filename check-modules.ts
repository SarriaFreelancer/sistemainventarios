import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const superadminRole = await prisma.role.findFirst({ where: { name: 'SUPERADMIN' } });
  if (!superadminRole) {
    console.log('No SUPERADMIN role');
    return;
  }
  const modules = await prisma.roleModule.findMany({
    where: { roleId: superadminRole.id },
    include: { module: true }
  });
  console.log('Modules for SUPERADMIN:', modules.map(m => m.module.name).join(', '));
  await prisma.$disconnect();
}
run().catch(console.error);
