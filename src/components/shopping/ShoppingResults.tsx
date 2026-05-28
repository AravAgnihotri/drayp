'use client';

import { useState } from 'react';
import type { ShoppingResult } from '@/types';
import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCard.skeleton';
import TryOnModal from './TryOnModal';

interface Props {
  results: ShoppingResult[];
  query: string;
  loading?: boolean;
}

const INITIAL_COUNT = 6;

export default function ShoppingResults({ results, query, loading = false }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [tryOnTarget, setTryOnTarget] = useState<ShoppingResult | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const displayed = showAll ? results : results.slice(0, INITIAL_COUNT);
  const hasMore = !showAll && results.length > INITIAL_COUNT;

  const handleSave = async (result: ShoppingResult) => {
    setSavedIds(prev => new Set(Array.from(prev).concat(result.id)));
    await fetch('/api/saved-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: result.id,
        title: result.title,
        price: result.price,
        price_formatted: result.priceFormatted,
        source: result.source,
        link: result.link,
        image_url: result.imageUrl,
        fit_score: result.fitScore ?? null,
        rating: result.rating ?? null,
      }),
    }).catch(() => {
      // Revert optimistic update on failure
      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(result.id);
        return next;
      });
    });
  };

  const handleUnsave = async (productId: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    await fetch(`/api/saved-items/${productId}`, { method: 'DELETE' }).catch(() => {
      // Revert optimistic update on failure
      setSavedIds(prev => new Set(Array.from(prev).concat(productId)));
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12px] text-slate-500">Searching for {query}…</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-[12px] text-slate-500">
          Found {results.length} item{results.length !== 1 ? 's' : ''} matching your style
        </p>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {displayed.map((result, i) => (
            <ProductCard
              key={result.id}
              result={result}
              index={i}
              isSaved={savedIds.has(result.id)}
              onSave={handleSave}
              onUnsave={handleUnsave}
              onTryOn={setTryOnTarget}
            />
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors py-1"
          >
            Show {results.length - INITIAL_COUNT} more
          </button>
        )}
      </div>

      {tryOnTarget && (
        <TryOnModal result={tryOnTarget} onClose={() => setTryOnTarget(null)} />
      )}
    </>
  );
}
