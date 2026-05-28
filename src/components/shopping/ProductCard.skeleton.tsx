export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
      <div className="aspect-square bg-slate-800 animate-pulse" />
      <div className="flex flex-col gap-2.5 p-3.5">
        <div className="h-3.5 w-full rounded bg-slate-700 animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-slate-700 animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-slate-700 animate-pulse" />
        <div className="h-3 w-1/4 rounded bg-slate-700 animate-pulse" />
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-8 rounded-lg bg-slate-700 animate-pulse" />
          <div className="flex-1 h-8 rounded-lg bg-slate-700 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
