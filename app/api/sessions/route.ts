import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/auth';
import { getActiveSessionsForAdmin, removeSessionById, removeAllCompanySessions } from '@/app/actions/session-actions';

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role?.name || (session.user as any).role || (session.user as any).roleName;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await getActiveSessionsForAdmin();
  if (!result || !result.success) {
    return NextResponse.json({ error: result?.error || 'Failed to fetch sessions' }, { status: 400 });
  }

  return NextResponse.json(result.data);
}

export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any).role?.name || (session.user as any).role || (session.user as any).roleName;
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { sessionId, companyId, all, sessionToken } = body; 
    
    // sessionToken is used to exclude the caller's own token from being deleted if provided
    const excludeToken = sessionToken;

    if (all && companyId) {
      const result = await removeAllCompanySessions(companyId, excludeToken);
      if (result.success) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    } else if (sessionId) {
      const result = await removeSessionById(sessionId);
      if (result.success) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
