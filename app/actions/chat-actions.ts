"use server";

import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function getCompanyUsers() {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  const user = session.user as any;
  const companyId = user.companyId;

  if (!companyId) return { success: false, error: "Usuario sin empresa" };

  try {
    // Because the `User` model has a status field? Wait, let's look at User schema earlier. 
    // The User model doesn't have `status`, it has `isLocked`. Let's use `isLocked: false`.
    const users = await prisma.user.findMany({
      where: { 
        companyId: Number(companyId),
        id: { not: Number(user.id) },
        isLocked: false
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        position: true
      }
    });
    return { success: true, data: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Error al cargar usuarios" };
  }
}

export async function getOrCreateConversation(targetUserId: number) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  const currentUserId = Number((session.user as any).id);
  const companyId = (session.user as any).companyId;

  if (!companyId) return { success: false, error: "Usuario sin empresa" };

  try {
    const existingConvos = await prisma.chatConversation.findMany({
      where: {
        companyId: Number(companyId),
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: targetUserId } } }
        ]
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true, email: true } } }
        }
      }
    });

    if (existingConvos.length > 0) {
      return { success: true, data: existingConvos[0] };
    }

    const newConvo = await prisma.chatConversation.create({
      data: {
        companyId: Number(companyId),
        participants: {
          create: [
            { userId: currentUserId },
            { userId: targetUserId }
          ]
        }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, image: true, email: true } } }
        }
      }
    });

    return { success: true, data: newConvo };
  } catch (error) {
    console.error("Error getting conversation:", error);
    return { success: false, error: "Error al obtener la conversación" };
  }
}

export async function getMessages(conversationId: number) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  const currentUserId = Number((session.user as any).id);

  try {
    const participant = await prisma.chatParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: currentUserId } }
    });

    if (!participant) {
      return { success: false, error: "No eres parte de esta conversación" };
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    await prisma.chatParticipant.update({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
      data: { lastReadAt: new Date() }
    });

    return { success: true, data: messages };
  } catch (error) {
    console.error("Error loading messages:", error);
    return { success: false, error: "Error al cargar mensajes" };
  }
}

export async function sendMessage(conversationId: number, content: string) {
  const session = await getAuthSession();
  if (!session?.user) return { success: false, error: "No autorizado" };

  const currentUserId = Number((session.user as any).id);

  if (!content.trim()) return { success: false, error: "Mensaje vacío" };

  try {
    const participant = await prisma.chatParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: currentUserId } }
    });

    if (!participant) {
      return { success: false, error: "No eres parte de esta conversación" };
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: currentUserId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    // Create a lean message payload without the potentially large base64 image
    const pusherPayload = {
      ...message,
      sender: {
        id: message.sender.id,
        name: message.sender.name
      }
    };

    // Trigger Pusher events (wrapped in try-catch so Pusher network errors don't prevent message sending)
    try {
      await pusher.trigger(`private-chat-${conversationId}`, "new-message", pusherPayload);

      const participants = await prisma.chatParticipant.findMany({
        where: { conversationId }
      });
      
      for (const p of participants) {
        if (p.userId !== currentUserId) {
          await pusher.trigger(`private-user-${p.userId}`, "new-message", {
            ...pusherPayload,
            conversationId
          });
        }
      }
    } catch (pusherError) {
      console.error("Pusher notification error (message saved successfully):", pusherError);
    }

    return { success: true, data: message };
  } catch (error: any) {
    console.error("Error sending message:", error, error?.body);
    let detail = String(error?.message || error);
    try {
      if (error?.body) {
        detail = typeof error.body === 'object' ? JSON.stringify(error.body) : String(error.body);
      }
    } catch (e) {}
    return { success: false, error: "Error interno: " + detail };
  }
}
