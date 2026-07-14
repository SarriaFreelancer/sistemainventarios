import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { redirect } from 'next/navigation';
import { CustomerStatus, OpportunityStage } from '@prisma/client';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import { CrmCustomerTable } from '@/components/crm/crm-customer-table';
import { CrmKanban } from '@/components/crm/crm-kanban';
import { CrmPageHeader } from '@/components/crm/crm-page-header';

export const metadata = {
  title: 'CRM · Dulche Dorelle',
  description: 'Gestión de clientes y oportunidades comerciales.',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
          <p className="mt-3 text-4xl font-extrabold text-foreground">{value}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${accent}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-6 w-1.5 rounded-full bg-gradient-to-b from-violet-400 to-purple-600" />
      <h2 className="text-xl font-bold text-foreground">{children}</h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CrmPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const companyId = session.user.companyId ?? undefined;

  // ── Parallel data fetching ──────────────────────────────────────────────────
  const [customers, opportunities, pipelineAgg] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        city: true,
        status: true,
      },
    }),
    prisma.opportunity.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
      },
    }),
    prisma.opportunity.aggregate({
      where: {
        companyId,
        stage: {
          notIn: [OpportunityStage.LOST],
        },
      },
      _sum: { estimatedValue: true },
      _count: true,
    }),
  ]);

  // ── Derived KPIs ─────────────────────────────────────────────────────────
  const totalCustomers = customers.length;
  const activeOpportunities = opportunities.filter(
    (o) => o.stage !== OpportunityStage.LOST && o.stage !== OpportunityStage.WON,
  ).length;
  const pipelineValue = pipelineAgg._sum.estimatedValue ?? 0;

  // ── Serialize for client components ──────────────────────────────────────
  const customerRows = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    city: c.city,
    status: c.status as CustomerStatus,
  }));

  const customerOptions = customers.map((c) => ({ id: c.id, name: c.name }));

  const opportunityCards = opportunities.map((o) => ({
    id: o.id,
    title: o.title,
    customerName: o.customer.name,
    estimatedValue: Number(o.estimatedValue),
    probability: o.probability,
    stage: o.stage as OpportunityStage,
  }));

  return (
    <div className="space-y-8 p-4 sm:p-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <CrmPageHeader
        customerOptions={customerOptions}
      />

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Clientes"
          value={totalCustomers.toString()}
          subtitle="Clientes registrados en tu CRM"
          icon={<Users className="h-6 w-6 text-violet-600 dark:text-violet-400" />}
          accent="bg-violet-100 dark:bg-violet-950"
        />
        <KpiCard
          title="Oportunidades Activas"
          value={activeOpportunities.toString()}
          subtitle="Negocios en seguimiento activo"
          icon={<TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          accent="bg-blue-100 dark:bg-blue-950"
        />
        <KpiCard
          title="Valor Total Pipeline"
          value={new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: 'compact',
          }).format(pipelineValue)}
          subtitle="Suma estimada de oportunidades activas"
          icon={<DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
          accent="bg-emerald-100 dark:bg-emerald-950"
        />
      </div>

      {/* ── Customers Table ───────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle>Clientes</SectionTitle>
        </div>
        <CrmCustomerTable
          customers={customerRows}
          customerOptions={customerOptions}
        />
      </div>

      {/* ── Kanban Pipeline ───────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle>Pipeline de Oportunidades</SectionTitle>
        </div>
        <CrmKanban
          opportunities={opportunityCards}
          customers={customerOptions}
        />
      </div>
    </div>
  );
}
