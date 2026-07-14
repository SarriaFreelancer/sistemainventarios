import { prisma } from '@/lib/prisma';
import { SuppliersClient } from '@/components/supplier-dialogs';
import { getAuthSession } from '@/auth';

export const metadata = {
  title: 'Proveedores · Dulche Dorelle',
  description: 'Organiza las marcas y proveedores de productos.',
};

export default async function SuppliersPage() {
  const session = await getAuthSession();
  const companyId = session?.user?.companyId;

  const suppliers = await prisma.supplier.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { companyName: 'asc' },
    include: { _count: { select: { products: true } } }
  });

  const serialized = suppliers.map(s => ({
    id: s.id,
    companyName: s.companyName,
    contactName: s.contactName,
    phone: s.phone,
    email: s.email,
    address: s.address,
    city: s.city,
    country: s.country,
    status: s.status,
    _count: { products: s._count.products },
  }));

  return (
    <div className="p-4 sm:p-6">
      <SuppliersClient suppliers={serialized} />
    </div>
  );
}
