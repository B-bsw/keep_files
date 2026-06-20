import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  const accessKey = cookieStore.get('access_key')?.value;
  const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';

  try {
    const body = await request.json();
    const res = await fetch(`${apiUrl}/files/upload/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authCookie ? { Cookie: `auth=${authCookie}` } : { 'x-access-key': accessKey || '' }),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to create upload session' }, { status: 500 });
  }
}
