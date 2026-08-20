import { getWarehouses, getWarehouseOverviewData } from "@/app/actions/warehouse-actions";
import { getDatabaseClient } from "@/lib/db-manager";
import { getAuthSession } from "@/auth";
import WarehousesManagerClient from "./warehouses-client";

export default async function WarehousesPage() {
  const session = await getAuthSession();
  const companyId = session?.user?.companyId ? Number(session.user.companyId) : 1;

  const [warehousesRes, overviewRes] = await Promise.all([
    getWarehouses(),
    getWarehouseOverviewData()
  ]);

  const db = await getDatabaseClient(companyId);
  const products = await db.product.findMany({
    where: { companyId },
    select: { id: true, name: true, code: true, quantityAvailable: true, salePrice: true }
  });

  return (
    <div className="p-6 space-y-6">
      <WarehousesManagerClient
        initialWarehouses={warehousesRes.warehouses || []}
        initialTransfers={overviewRes.transfers || []}
        initialStocks={overviewRes.stocks || []}
        initialTimelines={overviewRes.timelines || []}
        allProducts={products}
      />
    </div>
  );
}
