import { NextResponse } from 'next/server';
import { platformDb } from '@/lib/db-manager';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, amount } = body;

    const companyId = session.user.companyId ? parseInt(session.user.companyId, 10) : null;
    
    if (!companyId) {
      return NextResponse.json({ message: 'Usuario sin empresa asociada' }, { status: 400 });
    }

    // Verify company exists
    const company = await platformDb.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ message: 'Empresa no encontrada' }, { status: 404 });
    }

    const orderReference = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = await platformDb.subscriptionPayment.create({
      data: {
        companyId: company.id,
        planId,
        amount,
        currency: 'COP',
        boldReference: orderReference,
        status: 'PENDING'
      }
    });

    // Forzamos la llave nueva por si el servidor no fue reiniciado y tiene la vieja en memoria
    const integrityKey = "PqnitYB0OzVsxRVJMPs7sg";
    const amountStr = amount.toString(); 
    const hashString = `${orderReference}${amountStr}COP${integrityKey}`;
    const hash = crypto.createHash('sha256').update(hashString).digest('hex');

    console.log("==== BOLD DEBUG ====");
    console.log("orderReference:", orderReference);
    console.log("amountStr:", amountStr);
    console.log("integrityKey:", integrityKey);
    console.log("hashString:", hashString);
    console.log("Generated hash:", hash);
    console.log("====================");

    return NextResponse.json({ 
      ok: true, 
      orderId: orderReference, 
      hash, 
      amountStr 
    });

  } catch (error: any) {
    console.error('Error generando orden:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
