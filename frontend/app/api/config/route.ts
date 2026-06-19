import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const accessKey = cookieStore.get('access_key')?.value;
  const auth = cookieStore.get('auth')?.value;
  const apiUrl = process.env.PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  return NextResponse.json({
    apiUrl,
    accessKey: accessKey || '',
    auth: auth || ''
  });
}
