import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  const accessKey = cookieStore.get('access_key')?.value;
  const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/files`, {
      headers: {
        ...(authCookie ? { 'Cookie': `auth=${authCookie}` } : { 'x-access-key': accessKey || '' }),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      try {
        const errJson = JSON.parse(errText);
        return NextResponse.json(errJson, { status: res.status });
      } catch {
        return NextResponse.json({ error: 'Failed to fetch files', details: errText }, { status: res.status });
      }
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Cannot connect to API server' }, { status: 503 });
  }
}
