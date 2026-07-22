import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { getSessionCompanyId } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Settings, Save, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Configuración de Compras · GNS',
};

export default async function PurchaseConfigPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');
  
  const companyId = await getSessionCompanyId();
  const effectiveCompanyId = companyId || 1;

  let config = await prisma.purchaseApprovalConfig.findUnique({
    where: { companyId: effectiveCompanyId },
  });

  if (!config) {
    config = await prisma.purchaseApprovalConfig.create({
      data: {
        companyId: effectiveCompanyId,
        requireApproval: true,
        levels: 1,
      },
    });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración de Compras</h1>
          <p className="mt-1 text-muted-foreground">
            Ajusta las políticas y niveles de aprobación de compras.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-500/10 text-gray-500">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Aprobaciones de Solicitudes</h2>
            <p className="text-sm text-muted-foreground mt-1">Configura si las compras requieren aprobación antes de convertirse en Órdenes de Compra.</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="requireApproval" 
              name="requireApproval"
              defaultChecked={config.requireApproval}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="requireApproval" className="flex flex-col">
              <span className="font-medium text-foreground">Requerir Aprobación</span>
              <span className="text-sm text-muted-foreground mt-1">
                Todas las solicitudes de compra pasarán a estado "Pendiente" y deberán ser aprobadas por un usuario autorizado.
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-border/50">
            <label htmlFor="levels" className="block text-sm font-medium text-foreground">Niveles de Aprobación</label>
            <div className="mt-2 flex items-center gap-4 max-w-xs">
              <input 
                type="number" 
                id="levels" 
                name="levels" 
                defaultValue={config.levels} 
                min={1} 
                max={5}
                className="block w-full rounded-xl border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground">Nivel(es)</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Define cuántas firmas o aprobaciones se requieren en cadena.
            </p>
          </div>

          <div className="pt-8 flex justify-end">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 gap-2">
              <Save className="h-4 w-4" />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
