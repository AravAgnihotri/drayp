'use client';

import type { FitLabel } from '@/types';

interface Props {
  score: number;
  label: FitLabel;
  size?: 'sm' | 'md';
}

const colorMap: Record<FitLabel, string> = {
  Excellent: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30',
  Good:      'bg-lime-500/20 text-lime-400 ring-lime-500/30',
  Average:   'bg-amber-500/20 text-amber-400 ring-amber-500/30',
  Poor:      'bg-red-500/20 text-red-400 ring-red-500/30',
  'N/A':     'bg-zinc-700/50 text-zinc-400 ring-zinc-600/30',
};

const barColorMap: Record<FitLabel, string> = {
  Excellent: 'bg-emerald-400',
  Good:      'bg-lime-400',
  Average:   'bg-amber-400',
  Poor:      'bg-red-400',
  'N/A':     'bg-zinc-500',
};

export default function FitScoreBadge({ score, label, size = 'md' }: Props) {
  const isSmall = size === 'sm';

  return (
    <div className="flex flex-col gap-1">
      <div className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ring-1
        font-medium tracking-wide
        ${colorMap[label]}
        ${isSmall ? 'text-xs' : 'text-xs'}
      `}>
        <span className="font-bold">{score}</span>
        <span>{label} Fit</span>
      </div>
      {!isSmall && (
        <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColorMap[label]}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
