import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const accessKey = cookieStore.get('access_key')?.value;
  const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001';
  const id = (await params).id;

  try {
    const res = await fetch(`${apiUrl}/files/${id}/download`, {
      headers: {
        'x-access-key': accessKey || '',
      },
    });

    if (!res.ok) throw new Error('Failed to get download URL');
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get download URL' }, { status: 500 });
  }
}
