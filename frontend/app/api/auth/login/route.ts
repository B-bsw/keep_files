import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword: key })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const res = NextResponse.json({ success: true });
        
        const setCookies = response.headers.getSetCookie();
        for (const cookie of setCookies) {
          res.headers.append('Set-Cookie', cookie);
        }
        
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
