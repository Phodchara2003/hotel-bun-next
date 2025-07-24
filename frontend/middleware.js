import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if it's an admin route
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value;
    const userData = request.cookies.get('user_data')?.value;
    
    console.log('Middleware: Checking admin access for:', pathname);
    console.log('Middleware: Token present:', !!token);
    console.log('Middleware: User data present:', !!userData);
    
    if (!token || !userData) {
      // No token or user data, redirect to login
      console.log('Middleware: No authentication data, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Parse user data to check role
    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        console.log('Middleware: User is not admin, redirecting to homepage');
        return NextResponse.redirect(new URL('/', request.url));
      }
      console.log('Middleware: Admin access granted for:', user.email);
    } catch (error) {
      console.log('Middleware: Error parsing user data, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // For login/register pages, redirect if already authenticated
  if ((pathname === '/login' || pathname === '/register') && 
      request.cookies.get('auth_token')?.value && 
      request.cookies.get('user_data')?.value) {
    try {
      const user = JSON.parse(request.cookies.get('user_data')?.value);
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/bookings', request.url));
      }
    } catch (error) {
      // If error parsing, continue to login page
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/register']
};
