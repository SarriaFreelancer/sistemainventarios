"use server";

import { getAuthSession } from "@/auth";

/**
 * Returns the current session's companyId.
 * If the user is SUPERADMIN (no companyId), returns undefined.
 * Returns null if not authenticated.
 */
export async function getSessionCompanyId(): Promise<number | undefined | null> {
  const session = await getAuthSession();
  if (!session?.user) return null;
  return session.user.companyId ? Number(session.user.companyId) : undefined;
}
