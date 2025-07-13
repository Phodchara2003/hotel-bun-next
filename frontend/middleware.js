import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if it's an admin route
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      // No token, redirect to login
      console.log('No token found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // For now, just let it pass through
    // The component will handle the auth check
    console.log('Token found, allowing access to admin route');
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
