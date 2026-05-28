import { createHash } from 'crypto';
import type { ShoppingResult } from '@/types';

interface SerperShoppingItem {
  title: string;
  price: string;
  source: string;
  link: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  rating?: number;
  ratingCount?: number;
}

export interface ShoppingFilters {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
}

function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
}

function stableId(title: string, source: string): string {
  return createHash('md5').update(`${title}||${source}`).digest('hex').slice(0, 16);
}

export async function searchSerperShopping(
  query: string,
  filters?: ShoppingFilters,
): Promise<ShoppingResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    console.warn('[serper] SERPER_API_KEY not set — add it to .env.local and restart the dev server');
    return [];
  }

  console.log(`[serper] searching: "${query}"`);

  const response = await fetch('https://google.serper.dev/shopping', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, gl: 'us', num: 20 }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Serper API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const items: SerperShoppingItem[] = data.shopping ?? [];
  console.log(`[serper] received ${items.length} raw items`);

  let results: ShoppingResult[] = items
    .filter(item => item.title && item.price)
    .map(item => {
      const price = parsePrice(item.price);
      const imageUrl = item.imageUrl ?? item.thumbnailUrl ?? '';
      return {
        id: stableId(item.title, item.source),
        title: item.title,
        price,
        priceFormatted: item.price.startsWith('$') ? item.price : `$${price.toFixed(2)}`,
        source: item.source ?? '',
        link: item.link ?? '',
        imageUrl,
        rating: item.rating,
        reviewCount: item.ratingCount,
        fitScore: undefined,
      };
    });

  if (filters?.minPrice != null) results = results.filter(r => r.price >= filters.minPrice!);
  if (filters?.maxPrice != null) results = results.filter(r => r.price <= filters.maxPrice!);

  return results;
}
