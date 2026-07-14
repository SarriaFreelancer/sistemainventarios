import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const c = await prisma.customer.count();
  console.log('customers:', c);
} catch (e) {
  console.error('error:', e);
} finally {
  await prisma.$disconnect();
}
