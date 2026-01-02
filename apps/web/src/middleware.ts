import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  const pathname = request.nextUrl.pathname;

  // Check if this is the main domain (dockpulse.com without subdomain)
  const isMainDomain = hostname === 'dockpulse.com' || hostname === 'www.dockpulse.com' || hostname.startsWith('localhost');

  // Redirect subdomains to their proper sections
  if (pathname === '/') {
    if (hostname.includes('app.dockpulse.com')) {
      // app.dockpulse.com → redirect to /dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (hostname.includes('admin.dockpulse.com')) {
      // admin.dockpulse.com → redirect to /admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // dockpulse.com and www.dockpulse.com → show landing page (no redirect)
  }

  // Process API requests - add tenant header
  if (pathname.startsWith('/api/')) {
    // Skip for localhost and main domains
    const skipSubdomains = ['localhost', 'app', 'www', 'admin', 'api', 'dockpulse'];
    if (!isMainDomain && subdomain && !skipSubdomains.includes(subdomain)) {
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
  matcher: ['/', '/api/:path*'],
};
