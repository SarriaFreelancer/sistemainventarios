import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook de Bold recibido:', body);

    // Extraer datos del webhook basados en el esquema de Eventos de Bold
    let order_id = "";
    let status = "";

    // Manejar el formato de Evento (ej. type: "SALE_APPROVED", data.metadata.reference)
    if (body.type && body.data) {
      order_id = body.data.metadata?.reference || body.data.reference_id || body.data.payment_id;
      if (body.type === "SALE_APPROVED") status = "APPROVED";
      else if (body.type === "SALE_REJECTED") status = "REJECTED";
      else status = body.type; // Fallback
    } else {
      // Formato alternativo (fallback basado en schemas anteriores)
      const data = body.payload || body;
      order_id = data.reference_id;
      status = data.status;
    }

    if (!order_id) {
      return NextResponse.json({ message: 'Reference ID no encontrado en el payload' }, { status: 400 });
    }

    // Buscar el pago en la base de datos
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { boldReference: order_id }
    });

    if (!payment) {
      return NextResponse.json({ message: 'Pago no encontrado' }, { status: 404 });
    }

    // Actualizar estado del pago
    const newStatus = (status === 'APPROVED' || status === 'PAID') ? 'COMPLETED' : (status === 'REJECTED' ? 'REJECTED' : payment.status);

    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: newStatus }
    });

    // Si el pago es aprobado, activar la empresa y asignar módulos
    if (newStatus === 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        const company = await tx.company.findUnique({ where: { id: payment.companyId } });
        const rawPlanId = company?.planId ? company.planId.toLowerCase() : 'basico';

        await tx.company.update({
          where: { id: payment.companyId },
          data: { status: 'ACTIVE' }
        });

        // Fetch modules for this plan from settings
        const modulesSetting = await tx.setting.findUnique({
          where: { key: `plan_${rawPlanId}_modules` }
        });

        let moduleIdsToAssign: number[] = [];
        if (modulesSetting?.value) {
          try {
            moduleIdsToAssign = JSON.parse(modulesSetting.value);
          } catch (e) {}
        } else {
          // Fallback if settings are not configured yet
          const allModules = await tx.module.findMany({ where: { isActive: true } });
          moduleIdsToAssign = allModules.map(m => m.id);
        }

        await tx.companyModule.deleteMany({
          where: { companyId: payment.companyId }
        });

        if (moduleIdsToAssign.length > 0) {
          await tx.companyModule.createMany({
            data: moduleIdsToAssign.map(id => ({
              companyId: payment.companyId,
              moduleId: id
            }))
          });
        }
      });
      console.log(`Empresa ${payment.companyId} activada exitosamente por pago ${order_id}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Error procesando webhook de Bold:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
