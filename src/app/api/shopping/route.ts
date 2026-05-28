import { NextRequest, NextResponse } from 'next/server';
import { searchSerperShopping } from '@/lib/search/serper';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, filters } = body as { query: string; filters?: { minPrice?: number; maxPrice?: number; category?: string } };

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!process.env.SERPER_API_KEY) {
      return NextResponse.json({ error: 'Shopping search unavailable' }, { status: 503 });
    }

    const results = await searchSerperShopping(query, filters);
    return NextResponse.json(results.slice(0, 6));
  } catch (err) {
    console.error('[api/shopping] error:', err);
    return NextResponse.json({ error: 'Shopping search failed' }, { status: 500 });
  }
}
