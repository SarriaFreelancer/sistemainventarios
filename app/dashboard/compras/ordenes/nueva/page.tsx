import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { getSessionCompanyId } from "@/lib/session";
import { redirect } from "next/navigation";
import { PurchaseOrderForm } from "../components/PurchaseOrderForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Nueva Orden de Compra · GNS",
};

export default async function NewPurchaseOrderPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/auth/login");

  const companyId = await getSessionCompanyId();
  const companyFilter = companyId ? { companyId } : {};

  // Traer proveedores activos para la lista desplegable
  const suppliers = await prisma.supplier.findMany({
    where: { ...companyFilter, status: "ACTIVE" },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/compras/ordenes"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Emitir Orden de Compra</h1>
          <p className="text-muted-foreground">Crea una orden formal (PO) para enviar a tu proveedor.</p>
        </div>
      </div>

      <PurchaseOrderForm suppliers={suppliers} />
    </div>
  );
}
