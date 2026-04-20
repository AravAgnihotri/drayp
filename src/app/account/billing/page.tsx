"use client"

import { Check, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"

const PLAN_FEATURES = [
  "Unlimited AI recommendations",
  "3D Body Lab avatar",
  "Advanced fit metrics & history",
  "Priority matching (new drops)",
  "Sustainability filters",
]

export default function BillingPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your subscription and payment method</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Current plan */}
        <div className="rounded-xl border border-[#5DCAA5] bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-[#E1F5EE] px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#0F6E56]">Drayp Pro</h2>
                <p className="mt-0.5 text-xs text-[#1D9E75]">Your current plan</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#0F6E56] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                Active
              </span>
            </div>
          </div>

          <div className="px-5 py-5">
            <ul className="space-y-2.5 mb-5">
              {PLAN_FEATURES.map((feat) => (
                <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#E1F5EE]">
                    <Check className="h-2.5 w-2.5 text-[#0F6E56]" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>

            <div className="flex items-end justify-between border-t border-gray-100 pt-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="font-dm-mono text-3xl font-bold text-gray-900">$14</span>
                  <span className="text-sm text-gray-400">/month</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">Next billing date: May 1, 2025</p>
              </div>
              <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 text-xs">
                Change plan
              </Button>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Payment Method</h2>
          </div>
          <div className="flex items-center justify-between px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-14 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <CreditCard className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Visa ending in <span className="font-dm-mono">4242</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Expires 09 / 27</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 text-xs">
              Replace
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Danger Zone</h2>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">Cancel subscription</p>
              <p className="mt-0.5 text-xs text-gray-400">You'll keep access until the end of your billing period</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 text-xs hover:bg-red-50 hover:border-red-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
