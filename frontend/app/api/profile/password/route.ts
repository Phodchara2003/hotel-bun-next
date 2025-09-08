import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth) return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${BACKEND_URL}/profile/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': auth },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[PROFILE][PASSWORD][POST] error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
