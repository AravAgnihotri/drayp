import { cn } from "@/lib/utils"

interface FitBarProps {
  label: string
  value: number
  className?: string
}

export function FitBar({ label, value, className }: FitBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-dm-mono font-medium text-gray-900">{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#83aff0] transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
