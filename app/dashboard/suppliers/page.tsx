import { prisma } from '@/lib/prisma';
import { SuppliersClient } from '@/components/supplier-dialogs';
import { getSessionCompanyId } from '@/lib/session';

export const metadata = {
  title: 'Proveedores · GNS',
  description: 'Organiza las marcas y proveedores de productos.',
};

export default async function SuppliersPage() {
  const companyId = await getSessionCompanyId();

  const suppliers = await prisma.supplier.findMany({
    where: companyId ? { companyId } : {},
    orderBy: { companyName: 'asc' },
    include: { _count: { select: { products: true } } }
  });

  const serialized = suppliers.map(s => ({
    id: String(s.id),
    companyName: s.companyName,
    contactName: s.contactName,
    phone: s.phone,
    email: s.email,
    address: s.address,
    city: s.city,
    country: s.country,
    status: s.status,
    code: s.code ?? '',
    _count: { products: s._count.products },
  }));

  return (
    <div className="p-4 sm:p-6">
      <SuppliersClient suppliers={serialized} />
    </div>
  );
}
