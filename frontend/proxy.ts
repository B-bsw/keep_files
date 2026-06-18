import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login';
  const accessKey = request.cookies.get('access_key')?.value;

  if (!accessKey) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'x-access-key': accessKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valid) {
        // Valid key
        if (isLoginPage || request.nextUrl.pathname === '/admin') {
          return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
      }
    }
    
    // Invalid key
    if (!isLoginPage) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.cookies.delete('access_key');
      return redirectResponse;
    }
  } catch (error) {
    // If backend is down, we might just let it pass or redirect to login.
    // We'll let it pass to not break the UI, the client will show "API down" error.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
