import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicStoreData } from '@/app/actions/store-actions';
import { PublicCatalogClient } from '@/components/store/public-catalog-client';
import { Store, Clock, AlertTriangle } from 'lucide-react';

export default async function PublicStorePage(props: {
  params: Promise<{ storeSlug: string }>;
}) {
  const params = await props.params;
  const data = await getPublicStoreData(params.storeSlug);

  if (data.notFound) {
    notFound();
  }

  // Tienda Pausada o Suspendida
  if (!data.success) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shadow-sm">
          {data.isPaused ? <Clock className="h-10 w-10 text-amber-500" /> : <AlertTriangle className="h-10 w-10 text-rose-500" />}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-foreground">
            {data.isPaused ? 'Tienda en Pausa Temporal' : 'Tienda no disponible'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {data.error || 'Esta tienda virtual no está recibiendo pedidos en este momento. Por favor regresa más tarde.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PublicCatalogClient
      store={data.store as any}
      products={data.products as any}
      categories={data.categories as any}
    />
  );
}
