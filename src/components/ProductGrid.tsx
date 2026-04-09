'use client';

import type { RankedProduct } from '@/types';
import ProductCard from './ProductCard';

interface Props {
  products: RankedProduct[];
}

export default function ProductGrid({ products }: Props) {
  if (!products.length) return null;

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
