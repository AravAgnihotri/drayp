'use client';

import Image from 'next/image';
import { ExternalLink, Star } from 'lucide-react';
import type { RankedProduct } from '@/types';
import FitScoreBadge from './FitScoreBadge';

interface Props {
  product: RankedProduct;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      className="group relative flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all duration-300 hover-glow card-shine animate-fade-in-up"
      style={{ animationDelay: `${index * 0.06}s`, animationFillMode: 'both' }}
    >
      <div className="relative aspect-[4/5] bg-slate-900 overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {discount > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-rose-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
            -{discount}%
          </div>
        )}
        <div className="absolute top-2.5 right-2.5">
          <FitScoreBadge score={product.fitScore} label={product.fitLabel} size="sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 p-3.5">
        <div>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-[0.1em]">{product.brand}</p>
          <h3 className="text-[13px] font-medium text-white leading-snug mt-0.5 line-clamp-2">
            {product.title}
          </h3>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-white">${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span className="text-[11px] text-slate-500 line-through">${product.originalPrice.toFixed(2)}</span>
          )}
        </div>

        {product.rating && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] text-slate-400">
              {product.rating.toFixed(1)}
              {product.reviewCount && (
                <span className="text-slate-600"> ({product.reviewCount.toLocaleString()})</span>
              )}
            </span>
          </div>
        )}

        <FitScoreBadge score={product.fitScore} label={product.fitLabel} />

        <p className="text-[12px] text-slate-400 leading-relaxed border-t border-white/[0.06] pt-2.5">
          {product.reason}
        </p>

        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 hover:border-brand-500/40 text-brand-300 hover:text-brand-200 text-[13px] font-medium py-2.5 px-3 transition-all duration-200"
        >
          Shop at {product.retailer}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
