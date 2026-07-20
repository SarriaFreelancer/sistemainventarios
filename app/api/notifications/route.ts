import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

// GET: Obtener notificaciones del usuario
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !session?.user?.companyId) {
      return NextResponse.json({ success: false, data: [] }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: Number(session.user.id),
        companyId: Number(session.user.companyId),
      },
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
