import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login';
  const accessKey = request.cookies.get('access_key')?.value;

  // We do not have full verification here without calling the backend
  // but if they don't have the cookie at all, block them.
  if (!accessKey && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If they have access key and are on login page, let them go, but if it's invalid they will get errors later
  if (accessKey && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
