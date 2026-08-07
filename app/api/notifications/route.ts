import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// GET: Obtener notificaciones del usuario (sincronizando ventas pendientes)
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, data: [] }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const userCompanyId = session.user.companyId ? Number(session.user.companyId) : undefined;

    // 1. Sincronizar automáticamente ventas PENDING activas que no tengan notificación registrada para este usuario
    try {
      const pendingSalesWhere: any = { status: 'PENDING' };
      if (userCompanyId) {
        pendingSalesWhere.companyId = userCompanyId;
      }

      const activePendingSales = await prisma.sale.findMany({
        where: pendingSalesWhere,
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      for (const sale of activePendingSales) {
        const notifExists = await prisma.notification.findFirst({
          where: {
            userId,
            message: { contains: sale.saleNumber }
          }
        });

        if (!notifExists) {
          await prisma.notification.create({
            data: {
              userId,
              companyId: sale.companyId ?? userCompanyId ?? 1,
              title: '⚠️ Venta Pendiente Registrada',
              message: `Se encuentra pendiente la venta ${sale.saleNumber} por $${sale.total.toLocaleString('es-CO')}. Completa el cobro en el módulo de Ventas.`,
              type: 'WARNING',
              isRead: false
            }
          });
        }
      }
    } catch (syncErr) {
      console.error('[SYNC_PENDING_NOTIFS_ERROR]', syncErr);
    }

    // 2. Obtener notificaciones actualizadas
    const whereClause: any = { userId };
    if (userCompanyId) {
      whereClause.companyId = userCompanyId;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    console.error('[GET /api/notifications]', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

// PATCH: Marcar todas las notificaciones como leídas
export async function PATCH() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: Number(session.user.id), isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/notifications]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// DELETE: Eliminar todas las notificaciones del usuario
export async function DELETE() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    await prisma.notification.deleteMany({
      where: { userId: Number(session.user.id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/notifications]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
