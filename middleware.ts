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
  if (
    request.nextUrl.pathname === '/' || 
    publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Si intenta acceder a una ruta protegida (dashboard, etc.)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const companyStatus = token.companyStatus as string | undefined;
    const role = token.role as string | undefined;

    if (companyStatus === "SUSPENDED" || companyStatus === "INACTIVE") {
      const url = request.nextUrl.clone();
      if (role === "ADMIN" || role === "SUPERADMIN") {
        url.pathname = '/';
        url.hash = '#planes';
      } else {
        url.pathname = '/auth/login';
        url.searchParams.set('error', 'suspended');
      }
      return NextResponse.redirect(url);
    }
  }

  // Authenticated – continue to the requested page
  return NextResponse.next();
}

// Apply the middleware to all pages except API routes and static files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

