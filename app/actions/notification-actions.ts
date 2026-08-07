"use server";

import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/auth';
import { revalidatePath } from 'next/cache';

// INTERNAL USE ONLY
export async function createNotification(
  userId: number,
  companyId: number,
  title: string,
  message: string,
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'
) {
  // Check if notifications are explicitly disabled for the company
  const settings = await prisma.companySetting.findUnique({
    where: { companyId }
  });
  
  if (settings?.enableNotifications === false) return;

  await prisma.notification.create({
    data: {
      userId,
      companyId,
      title,
      message,
      type
    }
  });
}

// Fetch notifications for the current user
export async function getUserNotifications() {
  const session = await getAuthSession();
  if (!session?.user?.id || !session?.user?.companyId) return { success: false, data: [] };

  try {
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: Number(session.user.id),
        companyId: Number(session.user.companyId)
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to 50 recent
    });
    
    return { success: true, data: notifications };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

// Delete a single notification
export async function deleteNotification(id: number) {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.notification.deleteMany({
      where: { 
        id,
        userId: Number(session.user.id) // Ensure they own it
      }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Clear all notifications for user
export async function clearAllNotifications() {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.notification.deleteMany({
      where: { userId: Number(session.user.id) }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Mark notifications as read
export async function markNotificationsAsRead() {
  const session = await getAuthSession();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.notification.updateMany({
      where: { 
        userId: Number(session.user.id),
        isRead: false
      },
      data: { isRead: true }
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
