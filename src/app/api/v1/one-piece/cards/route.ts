import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const apiKeyQuery = url.searchParams.get('apiKey');
  
  let apiKey = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7);
  } else if (apiKeyQuery) {
    apiKey = apiKeyQuery;
  }
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
  }

  const apiKeyRecord = await db.apiKey.findUnique({ where: { key: apiKey } });
  if (!apiKeyRecord || apiKeyRecord.game !== 'ONE_PIECE') {
    return NextResponse.json({ error: 'Unauthorized: Invalid API Key for One Piece' }, { status: 403 });
  }

  // Increment hits
  await db.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { hits: { increment: 1 } }
  });

  try {
    const cards = await db.cardReference.findMany({
      where: { game: 'ONE_PIECE' }
    });
    return NextResponse.json({ success: true, count: cards.length, data: cards });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
