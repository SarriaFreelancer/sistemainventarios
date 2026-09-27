import { Metadata } from "next";
import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import { getEnterpriseMasterDashboardData, getBranches } from "@/app/actions/branch-actions";
import { EnterpriseClient } from "./enterprise-client";

export const metadata: Metadata = {
  title: "GNS Enterprise - Consolidado Multi-Sedes",
  description: "Dashboard maestro consolidado para redes de negocios y empresas con múltiples sedes.",
};

export default async function EnterpriseDashboardPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const userObj = session.user as any;
  const isEnterpriseActive = userObj.role === 'SUPERADMIN' || userObj.companyPlan === 'ENTERPRISE' || userObj.companyPlan === 'enterprise';
  const isSecondaryBranchUser = userObj.branch && !userObj.branch?.isMain;

  if (!isEnterpriseActive || isSecondaryBranchUser) {
    redirect("/dashboard");
  }

  // Cargar datos iniciales
  const [dashboardRes, branchesRes] = await Promise.all([
    getEnterpriseMasterDashboardData({ period: "month" }),
    getBranches(),
  ]);

  const initialData = dashboardRes.success && dashboardRes.data ? dashboardRes.data : null;
  const initialBranches = (branchesRes.success && branchesRes.branches) ? branchesRes.branches : [];

  return (
    <div className="space-y-6">
      <EnterpriseClient
        initialData={initialData}
        initialBranches={initialBranches}
        sessionUser={session.user}
      />
    </div>
  );
}
