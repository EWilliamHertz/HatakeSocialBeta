import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('hatake_session');
  return NextResponse.json({ success: true });
}
