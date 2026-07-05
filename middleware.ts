import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Global middleware for authentication.
 * Allows public paths (auth routes, static assets) without a session.
 * Redirects unauthenticated users to the login page.
 */
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Public routes that do not require authentication
  const publicPaths = ['/auth', '/api/auth', '/_next', '/static'];
  if (publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Authenticated – continue to the requested page
  return NextResponse.next();
}

// Apply the middleware to all pages except API routes and static files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

