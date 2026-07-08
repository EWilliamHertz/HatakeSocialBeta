import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathString = params.path.join('/');
  const scryfallUrl = `https://backs.scryfall.io/${pathString}`;

  try {
    const response = await fetch(scryfallUrl, {
      headers: {
        'User-Agent': 'HatakeSocialBeta/1.0',
        'Accept': 'image/jpeg, image/png'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch back image' }, { status: response.status });
    }

    const imgBuffer = await response.arrayBuffer();

    return new NextResponse(imgBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error proxying back image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
