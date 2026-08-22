import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Obtener notificaciones del usuario y sincronizar nuevos eventos (respetando eliminaciones)
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

    // Obtener preferencias del usuario
    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });
    const preferences = (userObj?.preferences as any) || {};
    const clearedAt: Date | null = preferences.notificationsClearedAt
      ? new Date(preferences.notificationsClearedAt)
      : null;
    const dismissedTitles: string[] = preferences.dismissedNotificationTitles || [];

    const notifWhere: any = { userId };
    if (userCompanyId) notifWhere.companyId = userCompanyId;

    const existingNotifs = await prisma.notification.findMany({ where: notifWhere });
    const existingSignatures = new Set(existingNotifs.map(n => `${n.title}::${n.message}`));

    // Sincronizar stock bajo nuevo o actualizado después de clearedAt
    const lowStockWhere: any = {
      quantityAvailable: { lte: 10 },
      type: { not: 'SERVICE' },
    };
    if (userCompanyId) lowStockWhere.companyId = userCompanyId;
    if (clearedAt) lowStockWhere.updatedAt = { gt: clearedAt };

    const lowStockProducts = await prisma.product.findMany({
      where: lowStockWhere,
      take: 15
    });

    const stockToCreate: any[] = [];
    for (const prod of lowStockProducts) {
      const title = prod.quantityAvailable <= 0 ? '⚠️ Stock Agotado' : '⚠️ Stock Bajo';
      const message = prod.quantityAvailable <= 0
        ? `El producto "${prod.name}" no tiene unidades disponibles (Stock: 0).`
        : `El producto "${prod.name}" tiene pocas unidades disponibles (Stock: ${prod.quantityAvailable}).`;
      const signature = `${title}::${message}`;

      if (!existingSignatures.has(signature) && !dismissedTitles.includes(signature)) {
        stockToCreate.push({
          userId,
          companyId: prod.companyId ?? userCompanyId ?? 1,
          title,
          message,
          type: prod.quantityAvailable <= 0 ? 'ERROR' : 'WARNING',
          isRead: false
        });
        existingSignatures.add(signature);
      }
    }

    if (stockToCreate.length > 0) {
      await prisma.notification.createMany({ data: stockToCreate });
    }

    // Auto-remover notificaciones de productos que ya fueron reabastecidos (> 10)
    const stockProdNames = [...new Set(
      existingNotifs
        .filter(n => n.title.includes('Stock Bajo') || n.title.includes('Stock Agotado'))
        .map(n => n.message.match(/"([^"]+)"/)?.[1])
        .filter(Boolean) as string[]
    )];

    if (stockProdNames.length > 0) {
      const replenished = await prisma.product.findMany({
        where: {
          name: { in: stockProdNames },
          quantityAvailable: { gt: 10 },
          ...(userCompanyId ? { companyId: userCompanyId } : {})
        },
        select: { name: true }
      });
      const repNames = new Set(replenished.map(p => p.name));
      const repIds = existingNotifs
        .filter(n => {
          const match = n.message.match(/"([^"]+)"/);
          return match && repNames.has(match[1]);
        })
        .map(n => n.id);

      if (repIds.length > 0) {
        await prisma.notification.deleteMany({ where: { id: { in: repIds } } });
      }
    }

    const notifications = await prisma.notification.findMany({
      where: notifWhere,
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
    const userId = Number(session.user.id);

    await prisma.notification.deleteMany({ where: { userId } });

    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });
    const currentPrefs = (userObj?.preferences as any) || {};
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: { ...currentPrefs, notificationsClearedAt: new Date() }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/notifications]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
