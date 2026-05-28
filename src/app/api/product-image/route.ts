import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url: string };
    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();

    // Try og:image first (highest quality, intended for sharing)
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    if (ogMatch?.[1]) {
      const imgUrl = ogMatch[1].trim();
      return NextResponse.json({ imageUrl: imgUrl });
    }

    // Fallback: find a plausible product image src
    const candidates = Array.from(html.matchAll(/<img[^>]+src=["']([^"']{10,})["'][^>]*>/gi)).map(
      m => m[1],
    );

    const productImg = candidates.find(src =>
      /\.(jpg|jpeg|png|webp)/i.test(src) &&
      /product|main|hero|large|primary|featured/i.test(src),
    );

    const resolvedUrl = productImg
      ? productImg.startsWith('//')
        ? `https:${productImg}`
        : productImg
      : null;

    return NextResponse.json({ imageUrl: resolvedUrl });
  } catch {
    // Silently fall back — caller will use the Serper thumbnail
    return NextResponse.json({ imageUrl: null });
  }
}
