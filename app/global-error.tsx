'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100 font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">Error Global del Sistema</h1>
            <p className="text-sm text-slate-400">
              {error?.message || 'Se produjo una falla en la aplicación.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex items-center gap-2 rounded-xl bg-violet-600 text-white font-semibold text-sm px-5 py-2.5 hover:bg-violet-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Reintentar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
