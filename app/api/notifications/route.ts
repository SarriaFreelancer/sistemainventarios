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
    const userRole = session.user.role;
    const userCompanyId = session.user.companyId ? Number(session.user.companyId) : undefined;
    const isAdminOrSuper = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

    // 1. Sincronizar automáticamente ventas PENDING activas:
    // - Si es USER regular: solo sincroniza ventas pendientes creadas por este usuario (userId === sale.userId)
    // - Si es ADMIN o SUPERADMIN: sincroniza ventas pendientes de TODOS los usuarios de la empresa
    try {
      const pendingSalesWhere: any = { status: 'PENDING' };
      if (userCompanyId) {
        pendingSalesWhere.companyId = userCompanyId;
      }
      if (!isAdminOrSuper) {
        pendingSalesWhere.userId = userId;
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
          const isOwnSale = sale.userId === userId;
          const msg = !isOwnSale && isAdminOrSuper
            ? `Se encuentra pendiente la venta ${sale.saleNumber} por $${sale.total.toLocaleString('es-CO')} registrada por un usuario.`
            : `Se encuentra pendiente tu venta ${sale.saleNumber} por $${sale.total.toLocaleString('es-CO')}. Completa el cobro en el módulo de Ventas.`;

          await prisma.notification.create({
            data: {
              userId,
              companyId: sale.companyId ?? userCompanyId ?? 1,
              title: '⚠️ Venta Pendiente Registrada',
              message: msg,
              type: 'WARNING',
              isRead: false
            }
          });
        }
      }
    } catch (syncErr) {
      console.error('[SYNC_PENDING_NOTIFS_ERROR]', syncErr);
    }

    // 1b. Sincronizar automáticamente productos con stock bajo o agotado
    try {
      const lowStockProductsWhere: any = {
        quantityAvailable: { lte: 5 },
        type: { not: 'SERVICE' }
      };
      if (userCompanyId) {
        lowStockProductsWhere.companyId = userCompanyId;
      }

      const lowStockProducts = await prisma.product.findMany({
        where: lowStockProductsWhere,
        orderBy: { quantityAvailable: 'asc' },
        take: 20
      });

      for (const prod of lowStockProducts) {
        const title = prod.quantityAvailable <= 0 ? '⚠️ Stock Agotado' : '⚠️ Stock Bajo';
        const notifExists = await prisma.notification.findFirst({
          where: {
            userId,
            title,
            message: { contains: `"${prod.name}"` }
          }
        });

        if (!notifExists) {
          const msg = prod.quantityAvailable <= 0
            ? `El producto "${prod.name}" no tiene unidades disponibles (Stock: 0).`
            : `El producto "${prod.name}" tiene pocas unidades disponibles (Stock: ${prod.quantityAvailable}).`;

          await prisma.notification.create({
            data: {
              userId,
              companyId: prod.companyId ?? userCompanyId ?? 1,
              title,
              message: msg,
              type: prod.quantityAvailable <= 0 ? 'ERROR' : 'WARNING',
              isRead: false
            }
          });
        }
      }
    } catch (stockSyncErr) {
      console.error('[SYNC_STOCK_NOTIFS_ERROR]', stockSyncErr);
    }

    // 2. Limpieza automática de notificaciones resueltas (ventas completadas/anuladas o stock repuesto)
    const whereClause: any = { userId };
    if (userCompanyId) {
      whereClause.companyId = userCompanyId;
    }

    try {
      const userNotifs = await prisma.notification.findMany({
        where: whereClause,
        select: { id: true, title: true, message: true }
      });

      for (const notif of userNotifs) {
        // a) Si es notificación de venta: verificar si la venta ya no está en PENDING
        const saleMatch = notif.message.match(/VEN-\d{8}-\d{3,4}/);
        if (saleMatch) {
          const saleNumber = saleMatch[0];
          const sale = await prisma.sale.findFirst({
            where: { saleNumber },
            select: { status: true }
          });
          if (!sale || sale.status !== 'PENDING') {
            await prisma.notification.delete({ where: { id: notif.id } });
          }
        }

        // b) Si es notificación de stock bajo o agotado: verificar si el stock ya fue repuesto (> 5)
        if (notif.title.includes('Stock Bajo') || notif.title.includes('Stock Agotado')) {
          const prodMatch = notif.message.match(/"([^"]+)"/);
          if (prodMatch) {
            const prodName = prodMatch[1];
            const prod = await prisma.product.findFirst({
              where: { name: prodName, ...(userCompanyId ? { companyId: userCompanyId } : {}) },
              select: { quantityAvailable: true }
            });
            if (prod && prod.quantityAvailable > 5) {
              await prisma.notification.delete({ where: { id: notif.id } });
            }
          }
        }
      }
    } catch (cleanErr) {
      console.error('[CLEAN_RESOLVED_NOTIFS_ERROR]', cleanErr);
    }

    // 3. Obtener notificaciones actualizadas
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
