import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/actions/auth';

// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard', '/user'];

export default async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-base-path', req.nextUrl.basePath);

  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route =>
    path.startsWith(route),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const user = await getSession();

  // 4. Redirect to /login if the user is not authenticated
  if (!user) {
    return NextResponse.redirect(new URL('/api/auth/discord', req.nextUrl));
  }

  // 5. Redirect to /dashboard if the user is authenticated
  if (!req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }
  if (!req.nextUrl.pathname.startsWith('/user')) {
    return NextResponse.redirect(new URL(`/user/@${user.userId}`, req.nextUrl));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
