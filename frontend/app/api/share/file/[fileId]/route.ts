import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function authHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth')?.value;
  const accessKey = cookieStore.get('access_key')?.value;
  return authCookie ? { Cookie: `auth=${authCookie}` } : { 'x-access-key': accessKey || '' };
}

const apiUrl = () => process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(_: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const res = await fetch(`${apiUrl()}/share/file/${fileId}`, { headers: await authHeaders() });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const { searchParams } = new URL(request.url);
  const linkId = searchParams.get('linkId');
  const res = await fetch(`${apiUrl()}/share/${linkId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
