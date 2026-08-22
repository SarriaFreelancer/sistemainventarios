import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId) {
      return NextResponse.json({ message: 'Missing orderId' }, { status: 400 });
    }

    // Find the payment record
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { boldReference: orderId },
      include: { company: true }
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    console.log(`==== VERIFICANDO PAGO BOLD ====`);
    console.log(`OrderId: ${orderId} | Status recibido: ${status}`);

    if (status === 'APPROVED' || status === 'success') {
      // Begin transaction to activate company and add modules
      await prisma.$transaction(async (tx) => {
        // 1. Mark payment as COMPLETED
        await tx.subscriptionPayment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' }
        });

        // 2. Activate Company
        const rawPlanId = payment.planId ? payment.planId.toLowerCase() : 'basico';
        await tx.company.update({
          where: { id: payment.companyId },
          data: {
            status: 'ACTIVE',
            planId: payment.planId
          }
        });

        // 3. Enable modules according to plan settings or active modules
        const modulesSetting = await tx.setting.findUnique({
          where: { key: `plan_${rawPlanId}_modules` }
        });

        let moduleIdsToAssign: number[] = [];
        if (modulesSetting?.value) {
          try {
            moduleIdsToAssign = JSON.parse(modulesSetting.value);
          } catch (e) {}
        }

        if (moduleIdsToAssign.length === 0) {
          const allModules = await tx.module.findMany({ where: { isActive: true } });
          moduleIdsToAssign = allModules.map(m => m.id);
        }

        // Remove existing relations
        await tx.companyModule.deleteMany({
          where: { companyId: payment.companyId }
        });

        // Create new relations
        if (moduleIdsToAssign.length > 0) {
          await tx.companyModule.createMany({
            data: moduleIdsToAssign.map(id => ({
              companyId: payment.companyId,
              moduleId: id
            }))
          });
        }
      });

      console.log(`✔ EMPRESA #${payment.companyId} ACTIVADA EXITOSAMENTE POR PAGO ${orderId}`);
      console.log(`================================`);
      return NextResponse.json({ ok: true, message: 'Account activated successfully' });
    } else {
      console.log(`❌ PAGO FALLIDO O RECHAZADO PARA ORDEN ${orderId}`);
      console.log(`================================`);
      // If payment failed, just update the payment status
      await prisma.subscriptionPayment.update({
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
