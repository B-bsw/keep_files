import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/auth/verify`, {
      method: 'POST',
      headers: {
        'x-access-key': key,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.valid) {
        const res = NextResponse.json({ success: true });
        res.cookies.set('access_key', key, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 1 week
        });
        return res;
      }
    } else if (response.status === 503) {
      return NextResponse.json({ success: false, message: 'Database is currently down. Please try again later.' }, { status: 503 });
    }
    
    return NextResponse.json({ success: false, message: 'Invalid Key' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Unable to connect to the API server.' }, { status: 503 });
  }
}
