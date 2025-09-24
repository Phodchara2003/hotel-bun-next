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
      // Allow admin, staff, and manager to access admin routes
      if (!['admin', 'staff', 'manager'].includes(user.role)) {
        console.log('Middleware: User is not admin/staff/manager, redirecting to homepage');
        return NextResponse.redirect(new URL('/', request.url));
      }
      console.log('Middleware: Admin/Staff/Manager access granted for:', user.email, 'Role:', user.role);
    } catch (error) {
      console.log('Middleware: Error parsing user data, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Check if it's a manager route
  if (pathname.startsWith('/manager')) {
    const token = request.cookies.get('auth_token')?.value;
    const userData = request.cookies.get('user_data')?.value;
    
    console.log('Middleware: Checking manager access for:', pathname);
    
    if (!token || !userData) {
      console.log('Middleware: No authentication data, redirecting to login');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    try {
      const user = JSON.parse(userData);
      // Only managers can access manager routes
      if (user.role !== 'manager') {
        console.log('Middleware: User is not manager, redirecting based on role');
        if (['admin', 'staff'].includes(user.role)) {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
      console.log('Middleware: Manager access granted for:', user.email);
    } catch (error) {
      console.log('Middleware: Error parsing user data, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // For login/register pages, redirect if already authenticated
  if ((pathname === '/login' || pathname === '/register')) {
    const token = request.cookies.get('auth_token')?.value;
    const userData = request.cookies.get('user_data')?.value;
    
    // Only redirect if BOTH token and userData exist and are valid
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        // Additional check to ensure user object is valid
        if (user && user.role && user.id) {
          if (user.role === 'manager') {
            return NextResponse.redirect(new URL('/manager', request.url));
          } else if (['admin', 'staff'].includes(user.role)) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
          } else {
            return NextResponse.redirect(new URL('/', request.url));
          }
        }
      } catch (error) {
        // If error parsing, continue to login page (don't redirect)
        console.log('Middleware: Error parsing user data for login redirect, allowing access to login page');
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/manager/:path*', '/login', '/register']
};
