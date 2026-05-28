"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface ToggleProps {
  defaultChecked?: boolean
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ defaultChecked = false, checked: controlled, onChange, disabled }: ToggleProps) {
  const [internal, setInternal] = useState(defaultChecked)
  const checked = controlled !== undefined ? controlled : internal

  const toggle = () => {
    if (disabled) return
    const next = !checked
    setInternal(next)
    onChange?.(next)
  }

  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={toggle}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#83aff0] focus:ring-offset-2",
        checked ? "bg-[#83aff0]" : "bg-gray-200",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}
