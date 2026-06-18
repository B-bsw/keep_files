import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login';
  const authCookie = request.cookies.get('auth')?.value;
  const accessKey = request.cookies.get('access_key')?.value;

  if (!authCookie && !accessKey) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';
    
    const headers: HeadersInit = {};
    if (authCookie) {
      headers['Cookie'] = `auth=${authCookie}`;
    } else if (accessKey) {
      headers['x-access-key'] = accessKey;
    }

    const response = await fetch(`${apiUrl}/auth/verify`, {
      method: 'POST',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valid) {
        // Valid key/token
        if (isLoginPage || request.nextUrl.pathname === '/admin') {
          return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
      }
    }
    
    // Invalid key/token
    if (!isLoginPage) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.cookies.delete('access_key');
      redirectResponse.cookies.delete('auth');
      return redirectResponse;
    }
  } catch (error) {
    // If backend is down, we might just let it pass or redirect to login.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
