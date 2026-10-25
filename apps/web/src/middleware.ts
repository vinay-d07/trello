import { NextResponse, type NextRequest } from 'next/server';

const AUTH_PAGES = ['/login', '/register'];

/**
 * Optimistic route guard: only checks that a session cookie exists. The API
 * remains the source of truth and verifies the token on every request.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = req.cookies.has('access_token');
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (!hasSession && !isAuthPage) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/projects', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
