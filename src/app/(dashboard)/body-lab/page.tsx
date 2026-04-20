"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Upload } from "lucide-react"
import { FitBar } from "@/components/ui/fit-bar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const DEFAULT_MEASUREMENTS = [
  { label: "Chest",     key: "chest",     value: "38 in" },
  { label: "Waist",     key: "waist",     value: "32 in" },
  { label: "Hips",      key: "hips",      value: "39 in" },
  { label: "Inseam",    key: "inseam",    value: "31 in" },
  { label: "Shoulders", key: "shoulders", value: "17.5 in" },
  { label: "Height",    key: "height",    value: "5′11″" },
]

const FIT_PREDICTIONS = [
  { label: "Shoulder fit",    value: 96 },
  { label: "Torso length",    value: 91 },
  { label: "Leg proportions", value: 87 },
]

function AvatarSVG() {
  return (
    <svg viewBox="0 0 120 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <circle cx="60" cy="28" r="20" stroke="#1D9E75" strokeWidth="2.5" fill="#E1F5EE" />
      <line x1="60" y1="48" x2="60" y2="62" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 64 Q60 70 82 64 L84 130 Q60 136 36 130 Z" stroke="#1D9E75" strokeWidth="2.5" fill="#E1F5EE" strokeLinejoin="round" />
      <path d="M38 72 Q20 100 16 130" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M82 72 Q100 100 104 130" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M48 130 Q44 172 40 210" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M72 130 Q76 172 80 210" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <line x1="18" y1="72" x2="102" y2="72" stroke="#5DCAA5" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="18" cy="72" r="2" fill="#5DCAA5" />
      <circle cx="102" cy="72" r="2" fill="#5DCAA5" />
      <line x1="36" y1="108" x2="84" y2="108" stroke="#5DCAA5" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="36" cy="108" r="2" fill="#5DCAA5" />
      <circle cx="84" cy="108" r="2" fill="#5DCAA5" />
    </svg>
  )
}

export default function BodyLabPage() {
  const supabase = createClient()
  const [lastUpdated, setLastUpdated] = useState("March 15, 2025")

  // TODO: load real measurements from body_measurements table
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("body_measurements")
        .select("updated_at")
        .eq("user_id", user.id)
        .single()
      if (data?.updated_at) {
        setLastUpdated(new Date(data.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }))
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Body Lab</h1>
          <span className="inline-flex items-center rounded-full bg-[#1D9E75] px-2 py-0.5 text-[10px] font-semibold text-white">
            New
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Your body measurements and fit predictions</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Avatar card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">3D Avatar</h2>
            <p className="mt-0.5 text-xs text-gray-400">Last updated {lastUpdated}</p>
          </div>
          <div className="flex flex-col items-center p-6">
            <div className="mb-6 h-56 w-40">
              <AvatarSVG />
            </div>
            <div className="flex w-full gap-3">
              <Button size="sm" className="flex-1 gap-2 bg-[#0F6E56] text-white hover:bg-[#085041]">
                <RefreshCw className="h-3.5 w-3.5" />
                Update measurements
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2 border-gray-200">
                <Upload className="h-3.5 w-3.5" />
                Upload photo
              </Button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Measurements */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Body Measurements</h2>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-b-xl bg-gray-100">
              {DEFAULT_MEASUREMENTS.map((m) => (
                <div key={m.key} className="bg-white px-5 py-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{m.label}</p>
                  <p className="mt-1 font-dm-mono text-lg font-semibold text-gray-900">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fit Prediction */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Fit Prediction</h2>
            </div>
            <div className="space-y-5 p-5">
              {FIT_PREDICTIONS.map((p) => (
                <FitBar key={p.label} label={p.label} value={p.value} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
