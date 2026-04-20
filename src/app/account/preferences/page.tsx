"use client"

import { useState, useCallback } from "react"
import { CheckCircle2 } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { StyleTag } from "@/components/ui/style-tag"
import { SizeTag } from "@/components/ui/size-tag"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STYLE_OPTIONS = [
  "Minimal", "Smart casual", "Streetwear", "Workwear",
  "Outdoors", "Luxury", "Vintage", "Athletic",
]

const TOP_SIZES   = ["XS", "S", "M", "L", "XL", "XXL"]
const BOTTOM_SIZES = ["28", "30", "32", "34", "36", "38"]

const SCORE_OPTIONS = ["75%+", "80%+", "85%+", "90%+", "95%+"]

type NotifSetting = {
  label: string
  desc: string
  type: "toggle" | "select"
  key: string
}

const NOTIF_SETTINGS: NotifSetting[] = [
  { label: "New match alerts",        desc: "Get notified when Drayp finds a new item for you", type: "toggle", key: "alerts" },
  { label: "Fit score threshold",     desc: "Only surface items above this fit score",           type: "select", key: "threshold" },
  { label: "Auto-rank by budget",     desc: "Sort recommendations by your set price range",      type: "toggle", key: "budget" },
  { label: "Sustainability filter",   desc: "Prefer certified sustainable brands",               type: "toggle", key: "sustainability" },
  { label: "Virtual try-on by default", desc: "Show 3D avatar preview when available",         type: "toggle", key: "tryon" },
]

export default function PreferencesPage() {
  const [selectedStyles, setSelectedStyles] = useState<Set<string>>(
    new Set(["Minimal", "Smart casual", "Outdoors"])
  )
  const [selectedTop,    setSelectedTop]    = useState("S")
  const [selectedBottom, setSelectedBottom] = useState("32")
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    alerts: true, budget: false, sustainability: true, tryon: true,
  })
  const [scoreThreshold, setScoreThreshold] = useState("85%+")
  const [saved, setSaved] = useState(false)

  const toggleStyle = useCallback((style: string) => {
    setSelectedStyles((prev) => {
      const next = new Set(prev)
      next.has(style) ? next.delete(style) : next.add(style)
      return next
    })
  }, [])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">Customise how Drayp shops for you</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Style preferences */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Style Preferences</h2>
            <p className="mt-0.5 text-xs text-gray-400">Select all that apply</p>
          </div>
          <div className="flex flex-wrap gap-2 p-5">
            {STYLE_OPTIONS.map((style) => (
              <StyleTag
                key={style}
                label={style}
                selected={selectedStyles.has(style)}
                onClick={() => toggleStyle(style)}
              />
            ))}
          </div>
        </div>

        {/* Preferred sizes */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Preferred Sizes</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="text-sm font-medium text-gray-700">Tops</span>
              <div className="flex flex-wrap gap-1.5">
                {TOP_SIZES.map((s) => (
                  <SizeTag key={s} label={s} selected={selectedTop === s} onClick={() => setSelectedTop(s)} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="text-sm font-medium text-gray-700">Bottoms</span>
              <div className="flex flex-wrap gap-1.5">
                {BOTTOM_SIZES.map((s) => (
                  <SizeTag key={s} label={s} selected={selectedBottom === s} onClick={() => setSelectedBottom(s)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification & AI settings */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Notification &amp; AI Settings</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {NOTIF_SETTINGS.map((setting) => (
              <li key={setting.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{setting.label}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{setting.desc}</p>
                </div>
                {setting.type === "toggle" ? (
                  <Toggle
                    defaultChecked={toggles[setting.key]}
                    onChange={(v) => setToggles((p) => ({ ...p, [setting.key]: v }))}
                  />
                ) : (
                  <select
                    value={scoreThreshold}
                    onChange={(e) => setScoreThreshold(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                  >
                    {SCORE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="gap-2 bg-[#0F6E56] text-white hover:bg-[#085041]"
          >
            Save changes
          </Button>
        </div>
      </div>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-6 right-6 flex items-center gap-2.5 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg transition-all duration-300",
          saved ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"
        )}
      >
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#1D9E75]" />
        Preferences saved successfully
      </div>
    </div>
  )
}
