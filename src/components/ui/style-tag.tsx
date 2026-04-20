"use client"

import { cn } from "@/lib/utils"

interface StyleTagProps {
  label: string
  selected?: boolean
  onClick?: () => void
}

export function StyleTag({ label, selected = false, onClick }: StyleTagProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-[#0F6E56] bg-[#E1F5EE] text-[#0F6E56]"
          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
      )}
    >
      {label}
    </button>
  )
}
