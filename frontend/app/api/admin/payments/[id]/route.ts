import { NextResponse } from 'next/server';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

function extractToken(cookiesHeader?: string) {
  if (!cookiesHeader) return null;
  return cookiesHeader.split(/; */).find(c=>c.startsWith('auth_token='))?.split('=')[1] || null;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const token = req.headers.get('authorization')?.replace('Bearer ','') || extractToken(req.headers.get('cookie') || '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/payments/${params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json().catch(()=>({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[PAYMENTS][DETAIL] error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
