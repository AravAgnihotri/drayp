'use client';

import type { RankedProduct } from '@/types';
import ProductCard from './ProductCard';

interface Props {
  products: RankedProduct[];
}

export default function ProductGrid({ products }: Props) {
  if (!products.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
