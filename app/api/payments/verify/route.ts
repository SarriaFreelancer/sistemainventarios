import { NextResponse } from 'next/server';
import { platformDb } from '@/lib/db-manager';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId) {
      return NextResponse.json({ message: 'Missing orderId' }, { status: 400 });
    }

    // Find the payment record
    const payment = await platformDb.subscriptionPayment.findFirst({
      where: { boldReference: orderId },
      include: { company: true }
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    if (status === 'APPROVED' || status === 'success') {
      // Begin transaction to activate company and add modules
      await platformDb.$transaction(async (tx) => {
        // 1. Mark payment as COMPLETED
        await tx.subscriptionPayment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' }
        });

        // 2. Activate Company
        await tx.company.update({
          where: { id: payment.companyId },
          data: { status: 'ACTIVE' }
        });

        // 3. Enable modules (fetch all active modules to enable them by default)
        const allModules = await tx.module.findMany({ where: { isActive: true } });
        
        // Remove existing relations (just in case)
        await tx.companyModule.deleteMany({
          where: { companyId: payment.companyId }
        });
        
        // Create new relations
        if (allModules.length > 0) {
          await tx.companyModule.createMany({
            data: allModules.map(m => ({
              companyId: payment.companyId,
              moduleId: m.id
            }))
          });
        }
      });

      return NextResponse.json({ ok: true, message: 'Account activated successfully' });
    } else {
      // If payment failed, just update the payment status
      await platformDb.subscriptionPayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });
      return NextResponse.json({ ok: false, message: 'Payment failed' });
    }
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
