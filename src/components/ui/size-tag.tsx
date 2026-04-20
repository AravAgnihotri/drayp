"use client"

import { cn } from "@/lib/utils"

interface SizeTagProps {
  label: string
  selected?: boolean
  onClick?: () => void
}

export function SizeTag({ label, selected = false, onClick }: SizeTagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-[2.25rem] items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
        selected
          ? "border-[#0F6E56] bg-[#E1F5EE] text-[#0F6E56]"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
      )}
    >
      {label}
    </button>
  )
}
