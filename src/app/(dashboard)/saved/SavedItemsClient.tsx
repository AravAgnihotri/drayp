'use client';

import { useState } from 'react';
import type { ShoppingResult } from '@/types';
import ProductCard from '@/components/shopping/ProductCard';
import TryOnModal from '@/components/shopping/TryOnModal';
import { Bookmark } from 'lucide-react';

interface Props {
  initialItems: ShoppingResult[];
}

export default function SavedItemsClient({ initialItems }: Props) {
  const [items, setItems] = useState<ShoppingResult[]>(initialItems);
  const [tryOnTarget, setTryOnTarget] = useState<ShoppingResult | null>(null);

  const handleUnsave = async (productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
    await fetch(`/api/saved-items/${productId}`, { method: 'DELETE' }).catch(() => {
      // Revert on failure
      setItems(initialItems);
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">No saved items yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Save items from your Drayp recommendations to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <ProductCard
            key={item.id}
            result={item}
            index={i}
            isSaved
            onUnsave={handleUnsave}
            onTryOn={setTryOnTarget}
          />
        ))}
      </div>

      {tryOnTarget && (
        <TryOnModal result={tryOnTarget} onClose={() => setTryOnTarget(null)} />
      )}
    </>
  );
}
