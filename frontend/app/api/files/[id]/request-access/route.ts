import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const accessKey = cookieStore.get('access_key')?.value;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const id = (await params).id;
  
  try {
    const res = await fetch(`${apiUrl}/files/${id}/request-access`, {
      method: 'POST',
      headers: {
        'x-access-key': accessKey || '',
      },
    });

    if (!res.ok) {
        return NextResponse.json({ error: 'Failed to request access' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to request access' }, { status: 500 });
  }
}
