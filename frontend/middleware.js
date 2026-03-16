import { NextResponse } from 'next/server';

// Routes that require the user to be logged in (any role)
const USER_PROTECTED = [
  '/booking',
  '/booking-step',
  '/booking-confirmation',
  '/booking-details',
  '/booking-success',
  '/bookings',
  '/payment',
  '/payment-step',
  '/profile',
  '/dashboard',
  '/notifications',
  '/reviews',
];

// Roles allowed inside /admin
const ADMIN_ROLES = ['admin', 'staff', 'manager', 'super_admin'];

function parseUser(request) {
  try {
    const raw = request.cookies.get('user_data')?.value;
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id && user?.role ? user : null;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const user = parseUser(request);
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!ADMIN_ROLES.includes(user.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  // ── User-protected routes ─────────────────────────────────────────────────
  const isUserProtected = USER_PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  if (isUserProtected) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const user = parseUser(request);
    if (!user) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // ── Login / Register — redirect if already authenticated ─────────────────
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      const user = parseUser(request);
      if (user) {
        if (ADMIN_ROLES.includes(user.role)) {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/booking',
    '/booking/:path*',
    '/bookings',
    '/bookings/:path*',
    '/payment',
    '/payment/:path*',
    '/payment-step',
    '/profile',
    '/profile/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/notifications',
    '/notifications/:path*',
    '/reviews/:path*',
    '/login',
    '/register',
  ],
};
