// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log cookies for debugging
  console.log('Middleware - Request path:', request.nextUrl.pathname);
  
  // Log all cookies in a more readable format
  const cookies = request.cookies.getAll();
  console.log('Middleware - Cookies:', cookies.map(c => `${c.name}=${c.value.substring(0, 20)}...`));
  
  // Check for auth token specifically
  const authToken = request.cookies.get('auth-token');
  console.log('Middleware - Auth token present:', !!authToken);
  
  // Continue to the next middleware or to the requested page
  return NextResponse.next();
}

// Run this middleware on more paths to debug authentication
export const config = {
  matcher: ['/', '/admin/:path*', '/api/auth/:path*'],
};
