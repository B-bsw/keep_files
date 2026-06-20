import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function getAuth() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  const accessKey = cookieStore.get('access_key')?.value;
  const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';
  return { authCookie, accessKey, apiUrl };
}

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { authCookie, accessKey, apiUrl } = await getAuth();

  try {
    const res = await fetch(`${apiUrl}/files/upload/session/${sessionId}`, {
      headers: {
        ...(authCookie ? { Cookie: `auth=${authCookie}` } : { 'x-access-key': accessKey || '' }),
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to query session' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { authCookie, accessKey, apiUrl } = await getAuth();

  try {
    const res = await fetch(`${apiUrl}/files/upload/session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        ...(authCookie ? { Cookie: `auth=${authCookie}` } : { 'x-access-key': accessKey || '' }),
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to cancel session' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const { authCookie, accessKey, apiUrl } = await getAuth();

  const contentRange = request.headers.get('Content-Range') || '';

  try {
    const body = await request.arrayBuffer();
    const res = await fetch(`${apiUrl}/files/upload/session/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Range': contentRange,
        ...(authCookie ? { Cookie: `auth=${authCookie}` } : { 'x-access-key': accessKey || '' }),
      },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to upload chunk' }, { status: 500 });
  }
}
