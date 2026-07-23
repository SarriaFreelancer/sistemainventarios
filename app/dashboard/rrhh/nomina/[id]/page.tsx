import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, DollarSign, Calendar, FileText } from 'lucide-react';
import { PayrollActions } from './components/PayrollActions';

export const metadata = {
  title: 'Detalle de Nómina · RRHH',
};

export default async function PayrollDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const payrollId = parseInt(params.id);

  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId, companyId: companyId || undefined },
    include: {
      details: {
        include: { 
          employee: {
            include: { position: true }
          }
        },
        orderBy: { employee: { firstName: 'asc' } }
      }
    }
  });

  if (!payroll) redirect('/dashboard/rrhh/nomina');

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'APPROVED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PAID': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'Borrador (Revisión)';
      case 'APPROVED': return 'Aprobada (Pendiente Pago)';
      case 'PAID': return 'Pagada';
      case 'CANCELLED': return 'Anulada';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/rrhh/nomina"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              Nómina {payroll.code}
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(payroll.status)}`}>
                {getStatusLabel(payroll.status)}
              </span>
            </h1>
            <p className="mt-1 text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período: {new Date(payroll.periodStart).toLocaleDateString()} al {new Date(payroll.periodEnd).toLocaleDateString()}
            </p>
          </div>
        </div>
        <PayrollActions payrollId={payroll.id} status={payroll.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <User className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Empleados</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{payroll.details.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium">Total Nómina</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(payroll.totalAmount)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium">Fecha de Pago</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {payroll.paymentDate ? new Date(payroll.paymentDate).toLocaleDateString() : 'Pendiente'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h2 className="text-lg font-semibold text-foreground">Detalle de Empleados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Empleado</th>
                <th className="px-6 py-4 font-medium">Cargo</th>
                <th className="px-6 py-4 font-medium text-right">Salario Base</th>
                <th className="px-6 py-4 font-medium text-right text-emerald-500">Adiciones</th>
                <th className="px-6 py-4 font-medium text-right text-rose-500">Deducciones</th>
                <th className="px-6 py-4 font-medium text-right text-emerald-500">Neto a Pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payroll.details.map((detail) => (
                <tr key={detail.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">
                    {detail.employee.firstName} {detail.employee.lastName}
                    <div className="text-xs text-muted-foreground font-normal">{detail.employee.documentId}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {detail.employee.position?.name || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(detail.baseSalary)}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-500 font-medium">
                    + {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(detail.additions)}
                  </td>
                  <td className="px-6 py-4 text-right text-rose-500 font-medium">
                    - {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(detail.deductions)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(detail.netPay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
