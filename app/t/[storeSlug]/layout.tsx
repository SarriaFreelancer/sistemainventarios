import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicStoreData } from '@/app/actions/store-actions';
import { CartProvider } from '@/components/store/cart-context';
import { StoreHeader } from '@/components/store/store-header';

export async function generateMetadata(props: { params: Promise<{ storeSlug: string }> }) {
  const params = await props.params;
  const data = await getPublicStoreData(params.storeSlug);
  if (!data || !data.store) {
    return { title: 'Tienda Virtual | GNS' };
  }
  return {
    title: `${data.store.name} · Tienda Virtual`,
    description: data.store.description || `Catálogo y pedidos online de ${data.store.name}`,
  };
}

export default async function PublicStoreLayout(props: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const params = await props.params;
  const data = await getPublicStoreData(params.storeSlug);

  if (data.notFound) {
    notFound();
  }

  const storeInfo = data.store || {
    slug: params.storeSlug,
    name: 'Tienda Virtual',
  };

  return (
    <CartProvider storeSlug={params.storeSlug}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
        <StoreHeader store={storeInfo} />
        <main className="flex-1">{props.children}</main>
        <footer className="border-t border-border/80 py-8 text-center text-xs text-muted-foreground bg-muted/20">
          <p>© {new Date().getFullYear()} {storeInfo.name} — Potenciado por GNS SarriaTech</p>
        </footer>
      </div>
    </CartProvider>
  );
}
