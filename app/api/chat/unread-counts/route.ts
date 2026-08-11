import { NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/chat/unread-counts
 * Returns unread message counts and last message preview per sender
 * for the currently authenticated user, based on ChatParticipant.lastReadAt.
 */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Find all conversations this user participates in, with their lastReadAt
    const participations = await prisma.chatParticipant.findMany({
      where: { userId },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });

    if (participations.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const results: { senderId: string; count: number; lastMessage: string }[] = [];

    for (const participation of participations) {
      const since = participation.lastReadAt ?? new Date(0);

      // Count messages from others after lastReadAt
      const unreadMessages = await prisma.chatMessage.findMany({
        where: {
          conversationId: participation.conversationId,
          senderId: { not: userId },
          createdAt: { gt: since },
        },
        select: {
          senderId: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (unreadMessages.length === 0) continue;

      // Group by senderId
      const grouped: Record<string, { count: number; lastMessage: string }> = {};
      for (const msg of unreadMessages) {
        const key = String(msg.senderId);
        if (!grouped[key]) grouped[key] = { count: 0, lastMessage: '' };
        grouped[key].count += 1;
        grouped[key].lastMessage = msg.content; // last wins (ordered asc)
      }

      for (const [senderId, val] of Object.entries(grouped)) {
        const existing = results.find((r) => r.senderId === senderId);
        if (existing) {
          existing.count += val.count;
          existing.lastMessage = val.lastMessage;
        } else {
          results.push({ senderId, count: val.count, lastMessage: val.lastMessage });
        }
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('[UNREAD_COUNTS_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
