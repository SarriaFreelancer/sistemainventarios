import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicStoreData } from '@/app/actions/store-actions';
import { CheckoutClient } from '@/components/store/checkout-client';

export const metadata = {
  title: 'Finalizar Pedido · Tienda Virtual GNS',
  description: 'Ingresa tus datos de entrega y confirma tu pedido online.',
};

export default async function CheckoutPage(props: {
  params: Promise<{ storeSlug: string }>;
}) {
  const params = await props.params;
  const data = await getPublicStoreData(params.storeSlug);

  if (!data || !data.store || !data.success) {
    notFound();
  }

  return <CheckoutClient store={data.store as any} />;
}
