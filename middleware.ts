import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// In-memory rate limiting map for basic protection against DDoS / brute force
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 120; // 120 peticiones por minuto por IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  if (now - userLimit.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  userLimit.count += 1;
  return userLimit.count <= MAX_REQUESTS_PER_WINDOW;
}

/**
 * Global middleware for authentication & cyber-security hardening.
 */
export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  // Aplicar Rate Limiting
  if (!checkRateLimit(ip)) {
    return new NextResponse('Too Many Requests - Rate limit exceeded. Please wait a minute.', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '60',
      },
    });
  }

  const isHttps = request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
    // Use secureCookie only in production (HTTPS). In development always false
    // so localhost works correctly even after using ngrok.
    secureCookie: process.env.NODE_ENV === 'production',
  });

  // Response base helper para adjuntar cabeceras de seguridad
  const addSecurityHeaders = (res: NextResponse) => {
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return res;
  };

  // Public routes that do not require authentication
  const publicPaths = ['/auth', '/api/auth', '/_next', '/static'];
  if (
    request.nextUrl.pathname === '/' || 
    publicPaths.some((p) => request.nextUrl.pathname.startsWith(p))
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return addSecurityHeaders(NextResponse.redirect(url));
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
      return addSecurityHeaders(NextResponse.redirect(url));
    }
  }

  // Authenticated – continue to the requested page with security headers
  return addSecurityHeaders(NextResponse.next());
}

// Apply the middleware to all pages except API routes and static files
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


