'use client';

import type { FitLabel } from '@/types';

interface Props {
  score: number;
  label: FitLabel;
  size?: 'sm' | 'md';
}

const styles: Record<FitLabel, { badge: string; bar: string }> = {
  Excellent: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    bar: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  },
  Good: {
    badge: 'bg-lime-500/15 text-lime-400 border-lime-500/25',
    bar: 'bg-gradient-to-r from-lime-500 to-lime-400',
  },
  Average: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    bar: 'bg-gradient-to-r from-amber-500 to-amber-400',
  },
  Poor: {
    badge: 'bg-red-500/15 text-red-400 border-red-500/25',
    bar: 'bg-gradient-to-r from-red-500 to-red-400',
  },
  'N/A': {
    badge: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    bar: 'bg-slate-500',
  },
};

export default function FitScoreBadge({ score, label, size = 'md' }: Props) {
  const s = styles[label];
  const isSmall = size === 'sm';

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${s.badge}`}>
        <span>{score}</span>
        <span className="opacity-80">{label} Fit</span>
      </div>
      {!isSmall && (
        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${s.bar}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
