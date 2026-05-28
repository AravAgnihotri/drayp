'use client';

import Image from 'next/image';
import { Bookmark, ExternalLink, Sparkles, Star } from 'lucide-react';
import type { ShoppingResult } from '@/types';

interface Props {
  result: ShoppingResult;
  isSaved?: boolean;
  onSave?: (result: ShoppingResult) => void;
  onUnsave?: (productId: string) => void;
  onTryOn?: (result: ShoppingResult) => void;
  index?: number;
}

function FitBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-green-500 text-white'
      : score >= 60
        ? 'bg-amber-500 text-white'
        : 'bg-slate-600/80 text-slate-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>
      {score} fit
    </span>
  );
}

export default function ProductCard({
  result,
  isSaved = false,
  onSave,
  onUnsave,
  onTryOn,
  index = 0,
}: Props) {
  const skimlinksId = process.env.NEXT_PUBLIC_SKIMLINKS_ID;
  const shopUrl = skimlinksId
    ? `https://go.skimlinks.com/?id=${skimlinksId}&url=${encodeURIComponent(result.link)}`
    : result.link;

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) onUnsave?.(result.id);
    else onSave?.(result);
  };

  return (
    <div
      className="group relative flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.06}s`, animationFillMode: 'both' }}
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-900 overflow-hidden">
        <Image
          src={result.imageUrl}
          alt={result.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
        />

        {/* Save / bookmark */}
        <button
          onClick={handleSaveToggle}
          aria-label={isSaved ? 'Remove from saved' : 'Save item'}
          className="absolute top-2.5 left-2.5 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <Bookmark
            className={`w-3.5 h-3.5 transition-colors ${
              isSaved ? 'fill-brand-400 text-brand-400' : 'text-white'
            }`}
          />
        </button>

        {/* Fit score badge */}
        {result.fitScore !== undefined && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <FitBadge score={result.fitScore} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-3.5">
        <h3 className="text-[13px] font-medium text-white leading-snug line-clamp-2">
          {result.title}
        </h3>

        <div>
          <span className="text-[15px] font-bold text-white">{result.priceFormatted}</span>
          <p className="text-[11px] text-slate-500 mt-0.5">{result.source}</p>
        </div>

        {result.rating !== undefined && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] text-slate-400">
              {result.rating.toFixed(1)}
              {result.reviewCount != null && (
                <span className="text-slate-600"> ({result.reviewCount.toLocaleString()})</span>
              )}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-[12px] font-semibold py-2 transition-all duration-200 shadow-sm"
          >
            Shop Now
            <ExternalLink className="w-3 h-3" />
          </a>
          {onTryOn && (
            <button
              onClick={() => onTryOn(result)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-violet-500 hover:bg-violet-400 text-white text-[12px] font-semibold py-2 transition-all duration-200 shadow-sm shadow-violet-500/30"
            >
              <Sparkles className="w-3 h-3" />
              Try On
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
