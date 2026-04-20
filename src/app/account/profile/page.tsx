"use client"

import { useState } from "react"
import { Edit2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const UNIT_OPTIONS = ["Imperial (in, lb)", "Metric (cm, kg)"]

export default function ProfilePage() {
  const [units, setUnits] = useState(UNIT_OPTIONS[0])
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your personal information</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Avatar card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] text-xl font-bold text-white">
              JD
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">John Doe</h2>
              <p className="text-sm text-gray-400">Member since January 2024</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto gap-1.5 border-gray-200 text-gray-600">
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </div>

        {/* Details card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Account Details</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {/* Email */}
            <li className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Email</p>
                <p className="mt-0.5 text-sm text-gray-800">john.doe@example.com</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600">
                Change
              </Button>
            </li>

            {/* Location */}
            <li className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Location</p>
                <p className="mt-0.5 text-sm text-gray-800">Calgary, AB</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600">
                Change
              </Button>
            </li>

            {/* Plan */}
            <li className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Plan</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-sm text-gray-800">Drayp Pro</p>
                  <span className="inline-flex items-center rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-semibold text-[#085041]">
                    Active
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600">
                Manage
              </Button>
            </li>

            {/* Units */}
            <li className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Measurement Units</p>
                <p className="mt-0.5 text-xs text-gray-400">Used in Body Lab and fit predictions</p>
              </div>
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
              >
                {UNIT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[#0F6E56] text-white hover:bg-[#085041]">
            Save changes
          </Button>
        </div>
      </div>

      {/* Toast */}
      <div className={cn(
        "fixed bottom-6 right-6 flex items-center gap-2.5 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg transition-all duration-300",
        saved ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"
      )}>
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#1D9E75]" />
        Profile saved successfully
      </div>
    </div>
  )
}
