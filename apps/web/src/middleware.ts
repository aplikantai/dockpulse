import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only process API requests that will be rewritten to the backend
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Extract tenant slug from hostname (subdomain)
    const hostname = request.headers.get('host') || '';
    const subdomain = hostname.split('.')[0];

    // Skip for localhost and main domains
    if (subdomain && subdomain !== 'localhost' && subdomain !== 'app' && subdomain !== 'www') {
      // Create new headers with x-tenant-id
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-tenant-id', subdomain);

      // Continue with the request but with updated headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: '/api/:path*',
};
