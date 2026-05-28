"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { SizeTag } from "@/components/ui/size-tag"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ── Constants ─────────────────────────────────────────────────────────────────

const STYLE_TAGS = [
  "Minimalist", "Streetwear", "Old Money", "Business Casual", "Smart Casual",
  "Athleisure", "Bohemian", "Preppy", "Y2K", "Dark Academia",
  "Coastal Grandmother", "Quiet Luxury", "Workwear", "Techwear", "Vintage",
  "Grunge", "Classic", "Avant-Garde", "Romantic", "Sporty",
]

const COLORS: Array<{ name: string; hex: string }> = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Beige", hex: "#F5F0DC" },
  { name: "Olive", hex: "#6B7C4F" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Slate Blue", hex: "#6A7FA8" },
  { name: "Blush Pink", hex: "#FFB6C1" },
  { name: "Lavender", hex: "#C9C0E8" },
  { name: "Cobalt", hex: "#0047AB" },
  { name: "Charcoal", hex: "#36454F" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Mustard", hex: "#FFDB58" },
  { name: "Terracotta", hex: "#E2725B" },
  { name: "Sand", hex: "#C2B280" },
  { name: "Emerald", hex: "#50C878" },
  { name: "Dusty Rose", hex: "#DCAE96" },
]

const BRANDS = [
  "Zara", "H&M", "ASOS", "Arket", "COS", "& Other Stories", "Ralph Lauren",
  "Tommy Hilfiger", "Calvin Klein", "Levi's", "Nike", "New Balance", "Adidas",
  "Stone Island", "CP Company", "Represent", "Acne Studios", "Our Legacy",
  "A.P.C.", "Carhartt WIP", "Stüssy", "Supreme", "Off-White", "Fear of God",
  "Essentials", "Balenciaga", "Gucci", "Prada", "Miu Miu", "Jacquemus",
  "Isabel Marant", "Sandro", "Maje", "AllSaints", "Reiss", "Ted Baker",
  "Hugo Boss", "Paul Smith", "Barbour", "Patagonia", "Arc'teryx", "Lululemon",
  "Reformation", "Everlane", "Quince", "Uniqlo", "Massimo Dutti", "Ami Paris",
  "Toteme", "Vince",
]

const TOP_SIZES    = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"]
const BOTTOM_SIZES = ["26", "28", "30", "32", "34", "36", "38", "40+"]
const BUDGET_OPTIONS = ["Under $50", "$50–$150", "$150–$300", "$300–$600", "$600+"]
const GENDER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Men's", value: "mens" },
  { label: "Women's", value: "womens" },
  { label: "Non-binary / All", value: "nonbinary" },
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface Prefs {
  gender: string | null
  budget_range: string | null
  style_tags: string[]
  favorite_colors: string[]
  favorite_brands: string[]
  size_top: string | null
  size_bottom: string | null
  shoe_size: string | null
}

const EMPTY: Prefs = {
  gender: null,
  budget_range: null,
  style_tags: [],
  favorite_colors: [],
  favorite_brands: [],
  size_top: null,
  size_bottom: null,
  shoe_size: null,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return r * 0.299 + g * 0.587 + b * 0.114 > 180
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PreferencesPage() {
  const [prefs, setPrefs]       = useState<Prefs>(EMPTY)
  const [brandQuery, setBrandQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Load from Supabase
  useEffect(() => {
    fetch("/api/user-profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setPrefs({
            gender:          d.profile.gender          ?? null,
            budget_range:    d.profile.budget_range    ?? null,
            style_tags:      d.profile.style_tags      ?? [],
            favorite_colors: d.profile.favorite_colors ?? [],
            favorite_brands: d.profile.favorite_brands ?? [],
            size_top:        d.profile.size_top        ?? null,
            size_bottom:     d.profile.size_bottom     ?? null,
            shoe_size:       d.profile.shoe_size       ?? null,
          })
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  const set = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/user-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? "Save failed. Please try again.")
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const brandSuggestions = brandQuery.length > 0
    ? BRANDS.filter(
        (b) => b.toLowerCase().includes(brandQuery.toLowerCase()) && !prefs.favorite_brands.includes(b)
      ).slice(0, 6)
    : []

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">Customise how Drayp shops for you</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── Shopping section & budget ─────────────────────────────────── */}
        <Section title="Shopping" subtitle="Your primary section and budget">
          <Row label="Shopping section">
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((o) => (
                <PillButton
                  key={o.value}
                  active={prefs.gender === o.value}
                  onClick={() => set("gender", prefs.gender === o.value ? null : o.value)}
                >
                  {o.label}
                </PillButton>
              ))}
            </div>
          </Row>
          <Row label="Typical budget per item">
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((b) => (
                <PillButton
                  key={b}
                  active={prefs.budget_range === b}
                  onClick={() => set("budget_range", prefs.budget_range === b ? null : b)}
                >
                  {b}
                </PillButton>
              ))}
            </div>
          </Row>
        </Section>

        {/* ── Sizes ────────────────────────────────────────────────────── */}
        <Section title="Sizes" subtitle="Used to filter results and flag poor fits">
          <Row label="Tops">
            <div className="flex flex-wrap gap-1.5">
              {TOP_SIZES.map((s) => (
                <SizeTag
                  key={s}
                  label={s}
                  selected={prefs.size_top === s}
                  onClick={() => set("size_top", prefs.size_top === s ? null : s)}
                />
              ))}
            </div>
          </Row>
          <Row label="Bottoms (waist)">
            <div className="flex flex-wrap gap-1.5">
              {BOTTOM_SIZES.map((s) => (
                <SizeTag
                  key={s}
                  label={s}
                  selected={prefs.size_bottom === s}
                  onClick={() => set("size_bottom", prefs.size_bottom === s ? null : s)}
                />
              ))}
            </div>
          </Row>
          <Row label="Shoe size">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={prefs.shoe_size ?? ""}
              onChange={(e) => set("shoe_size", e.target.value || null)}
              placeholder="e.g. 42"
              className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#83aff0]"
            />
          </Row>
        </Section>

        {/* ── Style vibe ───────────────────────────────────────────────── */}
        <Section title="Style" subtitle="Your aesthetic — pick as many as you like">
          <div className="px-5 pb-5 pt-2">
            <div className="flex flex-wrap gap-2">
              {STYLE_TAGS.map((tag) => {
                const active = prefs.style_tags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => set("style_tags", toggle(prefs.style_tags, tag))}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                      active
                        ? "border-[#3a70c0] bg-[#eef4fd] text-[#3a70c0]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    )}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        </Section>

        {/* ── Colours ──────────────────────────────────────────────────── */}
        <Section title="Colour palette" subtitle="Colours you gravitate towards">
          <div className="px-5 pb-5 pt-3">
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => {
                const active = prefs.favorite_colors.includes(c.name)
                return (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => set("favorite_colors", toggle(prefs.favorite_colors, c.name))}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
                    style={{
                      backgroundColor: c.hex,
                      border: "2px solid",
                      borderColor: active ? "#3a70c0" : "transparent",
                      outline: active ? "2px solid #83aff0" : "2px solid transparent",
                      outlineOffset: "1px",
                    }}
                  >
                    {active && (
                      <CheckCircle2
                        className="h-4 w-4"
                        style={{ color: isLight(c.hex) ? "#1e3a5f" : "#ffffff" }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </Section>

        {/* ── Brands ───────────────────────────────────────────────────── */}
        <Section title="Favourite brands" subtitle="Up to 10 brands">
          <div className="px-5 pb-5 pt-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={brandQuery}
                onChange={(e) => { setBrandQuery(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search brands…"
                disabled={prefs.favorite_brands.length >= 10}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#83aff0] disabled:opacity-50"
              />
              {showSuggestions && brandSuggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {brandSuggestions.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onMouseDown={() => {
                        set("favorite_brands", [...prefs.favorite_brands, b])
                        setBrandQuery("")
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Selected chips */}
            {prefs.favorite_brands.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prefs.favorite_brands.map((brand) => (
                  <span
                    key={brand}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 pl-3 pr-2 py-1 text-sm text-gray-700"
                  >
                    {brand}
                    <button
                      type="button"
                      onClick={() => set("favorite_brands", prefs.favorite_brands.filter((b) => b !== brand))}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {prefs.favorite_brands.length >= 10 && (
              <p className="text-xs text-gray-400">Maximum 10 brands selected.</p>
            )}
          </div>
        </Section>

        {/* ── Save ─────────────────────────────────────────────────────── */}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-[#3a70c0] text-white hover:bg-[#2d5ca8] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
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
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#83aff0]" />
        Preferences saved
      </div>
    </div>
  )
}

// ── Small layout components ───────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <span className="w-40 flex-shrink-0 text-sm font-medium text-gray-700">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
        active
          ? "border-[#3a70c0] bg-[#eef4fd] text-[#3a70c0]"
          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  )
}
