// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log cookies for debugging
  console.log('Middleware - Request path:', request.nextUrl.pathname);
  console.log('Middleware - Cookies:', request.cookies.getAll());
  
  // Continue to the next middleware or to the requested page
  return NextResponse.next();
}

// Only run this middleware on specific paths
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/login'],
};
