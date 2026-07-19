import { NextResponse } from 'next/server';
import { platformDb } from '@/lib/db-manager';
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
    const payment = await platformDb.subscriptionPayment.findFirst({
      where: { boldReference: order_id }
    });

    if (!payment) {
      return NextResponse.json({ message: 'Pago no encontrado' }, { status: 404 });
    }

    // Actualizar estado del pago
    const newStatus = (status === 'APPROVED' || status === 'PAID') ? 'COMPLETED' : (status === 'REJECTED' ? 'REJECTED' : payment.status);
    
    await platformDb.subscriptionPayment.update({
      where: { id: payment.id },
      data: { status: newStatus }
    });

    // Si el pago es aprobado, activar la empresa y asignar módulos
    if (newStatus === 'COMPLETED') {
      await platformDb.$transaction(async (tx) => {
        await tx.company.update({
          where: { id: payment.companyId },
          data: { status: 'ACTIVE' }
        });
        
        const allModules = await tx.module.findMany({ where: { isActive: true } });
        await tx.companyModule.deleteMany({
          where: { companyId: payment.companyId }
        });
        
        if (allModules.length > 0) {
          await tx.companyModule.createMany({
            data: allModules.map(m => ({
              companyId: payment.companyId,
              moduleId: m.id
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
