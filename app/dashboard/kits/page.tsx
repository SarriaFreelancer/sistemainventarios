import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { getSessionCompanyId } from "@/lib/session";
import { redirect } from "next/navigation";
import { KitsClient } from "./kits-client";
import { getKits } from "@/app/actions/kit-actions";

export const metadata = {
  title: "Inventario → Kits · GNS",
  description: "Gestión de paquetes comerciales y kits de productos del inventario.",
};

export default async function KitsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/auth/login");

  const companyId = await getSessionCompanyId();
  const whereTenant = companyId ? { companyId } : {};

  // Traer kits procesados con su stock dinámico
  const kitsRes = await getKits();
  const initialKits = kitsRes.success && kitsRes.kits ? kitsRes.kits : [];

  // Traer productos, categorías y grupos de la empresa
  const [products, categories, groups, settings] = await Promise.all([
    prisma.product.findMany({
      where: whereTenant,
      include: { category: true, productGroup: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: whereTenant,
      orderBy: { name: "asc" },
    }),
    prisma.productGroup.findMany({
      where: whereTenant,
      orderBy: { name: "asc" },
    }),
    companyId
      ? prisma.companySetting.findUnique({ where: { companyId } })
      : prisma.companySetting.findFirst(),
  ]);

  const serializedProducts = products.map((p) => ({
    id: String(p.id),
    code: p.code,
    name: p.name,
    unitCost: Number(p.unitCost),
    salePrice: Number(p.salePrice),
    quantityAvailable: p.quantityAvailable,
    status: p.status,
    categoryId: p.categoryId ? String(p.categoryId) : null,
    productGroupId: p.productGroupId ? String(p.productGroupId) : null,
    category: p.category ? { id: String(p.category.id), name: p.category.name } : null,
    productGroup: p.productGroup ? { id: String(p.productGroup.id), name: p.productGroup.name } : null,
  }));

  const serializedCategories = categories.map((c) => ({
    id: String(c.id),
    name: c.name,
  }));

  const serializedGroups = groups.map((g) => ({
    id: String(g.id),
    name: g.name,
  }));

  const isCombosEnabled = settings?.enableCombos ?? false;

  return (
    <div className="p-4 sm:p-6">
      <KitsClient
        initialCombos={initialKits}
        products={serializedProducts}
        categories={serializedCategories}
        groups={serializedGroups}
        isCombosEnabled={isCombosEnabled}
        role={session.user.role}
      />
    </div>
  );
}
