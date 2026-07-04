import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function authHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  const accessKey = cookieStore.get('access_key')?.value;
  return authCookie ? { Cookie: `auth=${authCookie}` } : { 'x-access-key': accessKey || '' };
}

const apiUrl = () => process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parentId') || 'root';
  const res = await fetch(`${apiUrl()}/folders?parentId=${parentId}`, { headers: await authHeaders() });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${apiUrl()}/folders`, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
