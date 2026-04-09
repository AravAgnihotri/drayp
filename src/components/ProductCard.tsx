'use client';

import Image from 'next/image';
import { ExternalLink, Star } from 'lucide-react';
import type { RankedProduct } from '@/types';
import FitScoreBadge from './FitScoreBadge';

interface Props {
  product: RankedProduct;
}

export default function ProductCard({ product }: Props) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 animate-slide-up">
      {/* Product image */}
      <div className="relative aspect-[4/5] bg-zinc-800 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </div>
        )}
        <div className="absolute top-2 right-2">
          <FitScoreBadge score={product.fitScore} label={product.fitLabel} size="sm" />
        </div>
      </div>

      {/* Product info */}
      <div className="flex flex-col gap-3 p-3">
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{product.brand}</p>
          <h3 className="text-sm font-semibold text-white leading-tight mt-0.5 line-clamp-2">
            {product.title}
          </h3>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-white">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-xs text-zinc-500 line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-zinc-400">
              {product.rating.toFixed(1)}
              {product.reviewCount && (
                <span className="text-zinc-600"> ({product.reviewCount.toLocaleString()})</span>
              )}
            </span>
          </div>
        )}

        {/* Fit score bar */}
        <FitScoreBadge score={product.fitScore} label={product.fitLabel} />

        {/* Reason */}
        <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-2">
          {product.reason}
        </p>

        {/* CTA */}
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold py-2 px-3 transition-colors duration-150"
        >
          Shop at {product.retailer}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
