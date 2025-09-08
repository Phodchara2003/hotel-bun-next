import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Test GET works' });
}

export async function PUT() {
  return NextResponse.json({ message: 'Test PUT works' });
}

export async function POST() {
  return NextResponse.json({ message: 'Test POST works' });
}
