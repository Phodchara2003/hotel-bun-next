import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

function extractToken(cookiesHeader?: string) {
  if (!cookiesHeader) return null;
  const parts = cookiesHeader.split(/; */);
  for (const p of parts) {
    if (p.startsWith('auth_token=')) return p.split('=')[1];
  }
  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = url.searchParams.get('page') || '1';
  const limit = url.searchParams.get('limit') || '20';
  const status = url.searchParams.get('status');
  const token = req.headers.get('authorization')?.replace('Bearer ','') || extractToken(req.headers.get('cookie') || '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const qs = new URLSearchParams({ page, limit });
  if (status) qs.set('status', status);
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/payments?${qs.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[PAYMENTS][LIST] error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
