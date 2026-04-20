import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  valueClassName?: string
}

export function StatCard({ label, value, sub, valueClassName }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <p className={cn("mt-2 font-dm-mono text-3xl font-bold text-gray-900", valueClassName)}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}
