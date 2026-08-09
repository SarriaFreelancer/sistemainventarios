import { NextRequest, NextResponse } from 'next/server';
import { removeSessionByToken } from '@/lib/session-core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    if (sessionToken) {
      await removeSessionByToken(sessionToken);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
