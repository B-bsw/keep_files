import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function authHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  const accessKey = cookieStore.get('access_key')?.value;
  return authCookie ? { Cookie: `auth=${authCookie}` } : { 'x-access-key': accessKey || '' };
}

const apiUrl = () => process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const res = await fetch(`${apiUrl()}/folders/${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${apiUrl()}/folders/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${apiUrl()}/folders/${id}/breadcrumb`, { headers: await authHeaders() });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
