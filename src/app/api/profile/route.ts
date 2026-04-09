import { NextRequest, NextResponse } from 'next/server';
import { getProfile, saveProfile } from '@/lib/profile/store';

export async function GET() {
  const profile = getProfile();
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = saveProfile(body);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[profile] error:', err);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
