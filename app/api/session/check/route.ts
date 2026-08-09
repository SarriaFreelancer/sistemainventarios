import { NextRequest, NextResponse } from 'next/server';
import { isSessionTokenValid } from '@/lib/session-core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('sessionToken');

  if (!token) {
    return NextResponse.json({ valid: false, reason: 'NO_TOKEN' }, { status: 400 });
  }

  const result = await isSessionTokenValid(token);
  return NextResponse.json(result);
}
