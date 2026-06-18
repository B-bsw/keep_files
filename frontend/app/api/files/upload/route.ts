import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  const accessKey = cookieStore.get('access_key')?.value;
  const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';

  try {
    const formData = await request.formData();
    const res = await fetch(`${apiUrl}/files/upload`, {
      method: 'POST',
      headers: {
        ...(authCookie ? { 'Cookie': `auth=${authCookie}` } : { 'x-access-key': accessKey || '' }),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
