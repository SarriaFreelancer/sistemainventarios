import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE: Eliminar una notificación específica
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    const userId = Number(session.user.id);

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });

    // Guardar la hora de limpieza en las preferencias del usuario
    const userObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true }
    });
    const currentPrefs = (userObj?.preferences as any) || {};
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...currentPrefs,
          notificationsClearedAt: new Date()
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/notifications/[id]]', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
