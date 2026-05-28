import { cn } from "@/lib/utils"

export type OrderStatus = "delivered" | "in-transit" | "returned" | "pending"

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  delivered:  { label: "Delivered",  className: "bg-[#e8f1fd] text-[#2d5ca8]" },
  "in-transit": { label: "In transit", className: "bg-[#E6F1FB] text-[#0C447C]" },
  returned:   { label: "Returned",   className: "bg-[#FAEEDA] text-[#633806]" },
  pending:    { label: "Pending",    className: "bg-gray-100 text-gray-600" },
}

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: base } = STATUS_CONFIG[status]
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      base,
      className
    )}>
      {label}
    </span>
  )
}
