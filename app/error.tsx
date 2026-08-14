'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-border shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Ocurrió un error inesperado</h1>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Ha ocurrido un error en la aplicación.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="gap-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition font-semibold text-sm px-5 py-2.5"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="rounded-xl border border-border text-foreground hover:bg-muted transition font-semibold text-sm px-5 py-2.5"
          >
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
