import { getAuthSession } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Calculator, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Recursos Humanos · GNS',
};

export default async function RRHHPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/auth/login');

  const rrhhModules = [
    {
      title: 'Directorio de Empleados',
      description: 'Gestión de información personal, cargos y salarios base del equipo.',
      href: '/dashboard/rrhh/empleados',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Gestión de Nómina',
      description: 'Cálculo de pagos, deducciones, aprobación y registro de nómina.',
      href: '/dashboard/rrhh/nomina',
      icon: Calculator,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Recursos Humanos (RRHH)</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Administra la información de tu personal y automatiza el cálculo y pago de nóminas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {rrhhModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link 
              key={module.title}
              href={module.href}
              className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${module.bgColor} ${module.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {module.description}
                </p>
              </div>
              <div className="mt-6 flex items-center text-sm font-medium text-primary">
                Ingresar al módulo
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
