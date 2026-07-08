import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const pathString = params.path.join('/');
  const scryfallUrl = `https://svgs.scryfall.io/card-symbols/${pathString}`;

  try {
    const response = await fetch(scryfallUrl, {
      headers: {
        'User-Agent': 'HatakeSocialBeta/1.0',
        'Accept': 'image/svg+xml'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch SVG' }, { status: response.status });
    }

    const svgBuffer = await response.arrayBuffer();

    return new NextResponse(svgBuffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error proxying SVG:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
