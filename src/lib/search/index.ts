import type { Product, ShoppingIntent, StyleTag } from '@/types';
import { CATALOG } from './catalog';

// ─── Relevance scoring ────────────────────────────────────────────────────────

function scoreProduct(product: Product, intent: ShoppingIntent): number {
  let score = 0;

  // Category match — highest weight
  if (intent.category && product.category === intent.category) score += 40;

  // Subcategory / keyword match
  if (intent.subcategories?.length) {
    for (const sub of intent.subcategories) {
      if (product.subcategory.includes(sub)) { score += 15; break; }
    }
  }

  // Color match
  if (intent.colors?.length) {
    for (const color of intent.colors) {
      if (product.colors.some(c => c.toLowerCase().includes(color.toLowerCase()))) {
        score += 20;
        break;
      }
    }
  }

  // Style tag match
  if (intent.styles?.length) {
    const matches = product.styles.filter(s => intent.styles!.includes(s as StyleTag));
    score += matches.length * 10;
  }

  // Brand match
  if (intent.brands?.length) {
    if (intent.brands.some(b => product.brand.toLowerCase().includes(b.toLowerCase()))) {
      score += 20;
    }
  }

  // Price range
  if (intent.maxPrice !== undefined && product.price <= intent.maxPrice) score += 10;
  if (intent.minPrice !== undefined && product.price >= intent.minPrice) score += 5;

  // Keyword match against title, brand, description
  if (intent.keywords?.length) {
    const haystack = `${product.title} ${product.brand} ${product.description ?? ''}`.toLowerCase();
    for (const kw of intent.keywords) {
      if (haystack.includes(kw.toLowerCase())) score += 8;
    }
  }

  return score;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Filter and rank products from the catalog based on shopping intent.
 * Returns up to `limit` products sorted by relevance score descending.
 */
export function searchProducts(intent: ShoppingIntent, limit = 15): Product[] {
  const scored = CATALOG.map(product => ({
    product,
    score: scoreProduct(product, intent),
  }));

  // Filter out products above max price
  const filtered = scored.filter(({ product }) => {
    if (intent.maxPrice !== undefined && product.price > intent.maxPrice) return false;
    return true;
  });

  // Sort by score descending, then by rating descending as tiebreaker
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.product.rating ?? 0) - (a.product.rating ?? 0);
  });

  // Return at least some results even if scores are low
  const results = filtered.slice(0, limit);
  if (results.length === 0) return CATALOG.slice(0, limit);
  return results.map(r => r.product);
}
