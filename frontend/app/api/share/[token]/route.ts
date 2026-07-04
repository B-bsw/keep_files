import { NextResponse } from 'next/server';

const apiUrl = () => process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await fetch(`${apiUrl()}/share/${token}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const res = await fetch(`${apiUrl()}/share/${token}/access`, { method: 'POST' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
