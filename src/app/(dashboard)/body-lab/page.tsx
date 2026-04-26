"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { RefreshCw, Upload } from "lucide-react"
import { FitBar } from "@/components/ui/fit-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const BODY_PHOTO_BUCKET = "body-reference-photos"
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

type InchDraftKey =
  | "chest"
  | "waist"
  | "hips"
  | "neck"
  | "shoulders"
  | "sleeve"
  | "inseam"
  | "thigh"
  | "calf"
  | "bicep"

type MeasurementDraft = { [K in InchDraftKey]: string } & {
  height: string
  weight: string
  shoe: string
}

type FieldKind = "inch" | "height" | "weight" | "shoe"

type MeasurementField = { label: string; key: keyof MeasurementDraft; kind: FieldKind; suffix: string }

const INCH_SPECS: ReadonlyArray<{ k: InchDraftKey; label: string; db: string }> = [
  { k: "chest", label: "Chest", db: "chest_in" },
  { k: "waist", label: "Waist", db: "waist_in" },
  { k: "hips", label: "Hips", db: "hips_in" },
  { k: "neck", label: "Neck", db: "neck_in" },
  { k: "shoulders", label: "Shoulders", db: "shoulders_in" },
  { k: "sleeve", label: "Sleeve length", db: "sleeve_in" },
  { k: "inseam", label: "Inseam", db: "inseam_in" },
  { k: "thigh", label: "Thigh", db: "thigh_in" },
  { k: "calf", label: "Calf", db: "calf_in" },
  { k: "bicep", label: "Bicep", db: "bicep_in" },
]

const emptyDraft = (): MeasurementDraft => ({
  chest: "",
  waist: "",
  hips: "",
  neck: "",
  shoulders: "",
  sleeve: "",
  inseam: "",
  thigh: "",
  calf: "",
  bicep: "",
  height: "",
  weight: "",
  shoe: "",
})

const MEASUREMENT_FIELDS: MeasurementField[] = [
  { label: "Chest", key: "chest", kind: "inch", suffix: "in" },
  { label: "Waist", key: "waist", kind: "inch", suffix: "in" },
  { label: "Hips", key: "hips", kind: "inch", suffix: "in" },
  { label: "Neck", key: "neck", kind: "inch", suffix: "in" },
  { label: "Shoulders", key: "shoulders", kind: "inch", suffix: "in" },
  { label: "Sleeve length", key: "sleeve", kind: "inch", suffix: "in" },
  { label: "Bicep", key: "bicep", kind: "inch", suffix: "in" },
  { label: "Inseam", key: "inseam", kind: "inch", suffix: "in" },
  { label: "Thigh", key: "thigh", kind: "inch", suffix: "in" },
  { label: "Calf", key: "calf", kind: "inch", suffix: "in" },
  { label: "Height", key: "height", kind: "height", suffix: "" },
  { label: "Weight", key: "weight", kind: "weight", suffix: "lbs" },
  { label: "Shoe size", key: "shoe", kind: "shoe", suffix: "US" },
]

function draftFromRow(data: {
  chest_in: number | null
  waist_in: number | null
  hips_in: number | null
  inseam_in: number | null
  shoulders_in: number | null
  neck_in?: number | null
  sleeve_in?: number | null
  bicep_in?: number | null
  thigh_in?: number | null
  calf_in?: number | null
  weight_lbs?: number | null
  shoe_size_us?: number | null
  height_text: string | null
}): MeasurementDraft {
  const num = (v: number | null | undefined) => (v != null ? String(v) : "")
  return {
    chest: num(data.chest_in),
    waist: num(data.waist_in),
    hips: num(data.hips_in),
    neck: num(data.neck_in),
    shoulders: num(data.shoulders_in),
    sleeve: num(data.sleeve_in),
    inseam: num(data.inseam_in),
    thigh: num(data.thigh_in),
    calf: num(data.calf_in),
    bicep: num(data.bicep_in),
    height: data.height_text ?? "",
    weight: num(data.weight_lbs),
    shoe: num(data.shoe_size_us),
  }
}

/** Empty → null. Otherwise one decimal, 5–200 in (sanity for typos). */
function parseInchField(raw: string, label: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = raw.trim()
  if (!t) return { ok: true, value: null }
  const n = Number.parseFloat(t.replace(",", "."))
  if (Number.isNaN(n)) {
    return { ok: false, error: `${label}: use a number (inches), or leave blank.` }
  }
  if (n < 5 || n > 200) {
    return { ok: false, error: `${label}: enter a value between 5 and 200 inches.` }
  }
  return { ok: true, value: Math.round(n * 10) / 10 }
}

function parseWeightLbs(raw: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = raw.trim()
  if (!t) return { ok: true, value: null }
  const n = Number.parseFloat(t.replace(",", "."))
  if (Number.isNaN(n)) {
    return { ok: false, error: "Weight: use a number (pounds), or leave blank." }
  }
  if (n < 50 || n > 600) {
    return { ok: false, error: "Weight: enter 50–600 lbs or leave blank." }
  }
  return { ok: true, value: Math.round(n * 10) / 10 }
}

function parseShoeUs(raw: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = raw.trim()
  if (!t) return { ok: true, value: null }
  const n = Number.parseFloat(t.replace(",", "."))
  if (Number.isNaN(n)) {
    return { ok: false, error: "Shoe size: use a US number (e.g. 10 or 9.5), or leave blank." }
  }
  if (n < 3 || n > 22) {
    return { ok: false, error: "Shoe size: enter a US size between 3 and 22, or leave blank." }
  }
  return { ok: true, value: Math.round(n * 10) / 10 }
}

function hasAnyMeasurement(d: MeasurementDraft): boolean {
  if (d.height.trim() !== "") return true
  if (d.weight.trim() !== "") return true
  if (d.shoe.trim() !== "") return true
  for (const { k } of INCH_SPECS) {
    if (d[k].trim() !== "") return true
  }
  return false
}

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
  const supabase = useMemo(() => createClient(), [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [referencePhotoUrl, setReferencePhotoUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null)
  const [photoUploadHint, setPhotoUploadHint] = useState<string | null>(null)
  const [draft, setDraft] = useState<MeasurementDraft>(emptyDraft)
  const [measureSaveLoading, setMeasureSaveLoading] = useState(false)
  const [measureSaveError, setMeasureSaveError] = useState<string | null>(null)

  const loadBodyData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("body_measurements")
      .select(
        [
          "chest_in",
          "waist_in",
          "hips_in",
          "inseam_in",
          "shoulders_in",
          "neck_in",
          "sleeve_in",
          "bicep_in",
          "thigh_in",
          "calf_in",
          "weight_lbs",
          "shoe_size_us",
          "height_text",
          "updated_at",
          "reference_photo_url",
        ].join(", ")
      )
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[body-lab]", error)
      return
    }
    if (!data) {
      setDraft(emptyDraft())
      setReferencePhotoUrl(null)
      setLastUpdated(null)
      return
    }

    setDraft(draftFromRow(data))

    if (data.reference_photo_url) {
      const base = data.reference_photo_url.split("?")[0]
      setReferencePhotoUrl(`${base}?v=${Date.now()}`)
    } else {
      setReferencePhotoUrl(null)
    }

    if (data.updated_at) {
      setLastUpdated(
        new Date(data.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      )
    }
  }, [supabase])

  useEffect(() => {
    loadBodyData()
  }, [loadBodyData])

  async function saveMeasurements() {
    setMeasureSaveError(null)

    const inchPayload: Record<string, number | null> = {}
    for (const { k, label, db } of INCH_SPECS) {
      const r = parseInchField(draft[k], label)
      if (!r.ok) {
        setMeasureSaveError(r.error)
        return
      }
      inchPayload[db] = r.value
    }

    const weight = parseWeightLbs(draft.weight)
    if (!weight.ok) {
      setMeasureSaveError(weight.error)
      return
    }
    const shoe = parseShoeUs(draft.shoe)
    if (!shoe.ok) {
      setMeasureSaveError(shoe.error)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMeasureSaveError("You need to be signed in to save measurements.")
      return
    }

    setMeasureSaveLoading(true)
    const { error } = await supabase.from("body_measurements").upsert(
      {
        user_id: user.id,
        ...inchPayload,
        weight_lbs: weight.value,
        shoe_size_us: shoe.value,
        height_text: draft.height.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    setMeasureSaveLoading(false)

    if (error) {
      console.error("[body-lab] save measurements", error)
      setMeasureSaveError(error.message)
      return
    }

    setLastUpdated(
      new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    )
    await loadBodyData()
  }

  async function uploadReferencePhotoViaBrowserClient(file: File): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { ok: false, error: "You need to be signed in to upload a photo." }
    }

    const validateFd = new FormData()
    validateFd.append("file", file)
    const validateRes = await fetch("/api/body-lab/validate-reference-photo", {
      method: "POST",
      body: validateFd,
      credentials: "same-origin",
    })
    const validateJson = (await validateRes.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (!validateRes.ok || !validateJson.ok) {
      return {
        ok: false,
        error:
          validateJson.error ??
          (validateRes.status === 503
            ? "Photo check is unavailable. Set OPENAI_API_KEY on the server and restart."
            : "This photo was not accepted. Use a clear full-body standing picture (head to feet)."),
      }
    }

    const ext =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    const path = `${user.id}/reference.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BODY_PHOTO_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      console.error("[body-lab] storage upload", uploadError)
      const msg = uploadError.message.toLowerCase()
      const looksMissingBucket =
        msg.includes("bucket not found") ||
        msg.includes("not found") ||
        msg.includes("does not exist") ||
        msg.includes("no such bucket")
      return {
        ok: false,
        error: looksMissingBucket
          ? "Storage bucket missing. Either add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart, or paste supabase/body-lab-storage-setup.sql into the Supabase SQL Editor and run it."
          : uploadError.message,
      }
    }

    const { data: pub } = supabase.storage.from(BODY_PHOTO_BUCKET).getPublicUrl(path)
    const publicUrl = `${pub.publicUrl}?t=${Date.now()}`

    const { error: dbError } = await supabase.from("body_measurements").upsert(
      { user_id: user.id, reference_photo_url: pub.publicUrl, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    )

    if (dbError) {
      console.error("[body-lab] upsert reference_photo_url", dbError)
      return {
        ok: false,
        error:
          dbError.message.includes("reference_photo_url") || dbError.message.includes("schema cache")
            ? "Database is missing reference_photo_url. In Supabase → SQL Editor, run supabase/add-reference_photo_url_column.sql (or the ALTER inside supabase/body-lab-storage-setup.sql)."
            : dbError.message,
      }
    }

    return { ok: true, publicUrl }
  }

  async function handleReferencePhotoSelected(file: File | undefined) {
    if (!file) return

    setPhotoUploadError(null)
    setPhotoUploadHint(null)

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setPhotoUploadError("Please upload a JPEG, PNG, or WebP image.")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoUploadError("Image must be 8MB or smaller.")
      return
    }

    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/body-lab/reference-photo", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      })

      if (res.ok) {
        const data = (await res.json()) as { publicUrl: string }
        setReferencePhotoUrl(data.publicUrl)
        setLastUpdated(
          new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        )
        return
      }

      const errJson = (await res.json().catch(() => ({}))) as {
        code?: string
        message?: string
        error?: string
        hint?: string
      }

      if (res.status === 503 && errJson.code === "NO_SERVICE_ROLE") {
        const fallback = await uploadReferencePhotoViaBrowserClient(file)
        if (fallback.ok) {
          setReferencePhotoUrl(fallback.publicUrl)
          setLastUpdated(
            new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          )
          return
        }
        setPhotoUploadError(fallback.error)
        setPhotoUploadHint(null)
        return
      }

      const hint = typeof errJson.hint === "string" ? errJson.hint : null
      setPhotoUploadHint(hint)
      setPhotoUploadError(errJson.error ?? errJson.message ?? `Upload failed (${res.status}).`)
    } catch (e) {
      console.error("[body-lab] upload", e)
      setPhotoUploadError("Network error while uploading. Try again.")
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const hasMeasurements = hasAnyMeasurement(draft)

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
            <p className="mt-0.5 text-xs text-gray-400">
              {lastUpdated
                ? `Last updated ${lastUpdated}`
                : hasMeasurements
                  ? "Measurements on file"
                  : "No measurements added yet"}
            </p>
          </div>
          <div className="flex flex-col items-center p-6">
            <div className="mb-6 flex h-56 w-40 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
              {referencePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded blob from our storage CDN
                <img
                  src={referencePhotoUrl}
                  alt="Your reference photo for Body Lab"
                  className="h-full w-full object-cover"
                />
              ) : (
                <AvatarSVG />
              )}
            </div>
            {photoUploadError ? (
              <div className="mb-3 w-full space-y-2 text-center text-xs" role="alert">
                <p className="text-red-600">{photoUploadError}</p>
                {photoUploadHint ? (
                  <pre className="whitespace-pre-wrap break-words rounded-md bg-gray-100 p-3 text-left font-mono text-[11px] text-gray-700">
                    {photoUploadHint}
                  </pre>
                ) : null}
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                void handleReferencePhotoSelected(f)
              }}
            />
            <div className="flex w-full gap-3">
              <Button
                type="button"
                size="sm"
                className="flex-1 gap-2 bg-[#0F6E56] text-white hover:bg-[#085041]"
                onClick={() =>
                  document.getElementById("body-measurements-form")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Update measurements
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-2 border-gray-200"
                disabled={photoUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {photoUploading ? "Uploading…" : "Upload photo"}
              </Button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Measurements */}
          <div
            id="body-measurements-form"
            className="rounded-xl border border-gray-200 bg-white shadow-sm scroll-mt-6"
          >
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Body Measurements</h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Lengths in inches; height as text; weight in pounds; US shoe size. Leave anything unknown blank.
              </p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {MEASUREMENT_FIELDS.map((m) => (
                  <div key={m.key}>
                    <label htmlFor={`measure-${m.key}`} className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      {m.label}
                    </label>
                    {m.kind === "height" ? (
                      <Input
                        id={`measure-${m.key}`}
                        value={draft.height}
                        onChange={(e) => setDraft((d) => ({ ...d, height: e.target.value }))}
                        placeholder={'e.g. 5\'11" or 180 cm'}
                        className="mt-1.5 border-gray-200 font-dm-mono text-sm"
                        autoComplete="off"
                      />
                    ) : m.kind === "weight" ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Input
                          id={`measure-${m.key}`}
                          type="text"
                          inputMode="decimal"
                          value={draft.weight}
                          onChange={(e) => setDraft((d) => ({ ...d, weight: e.target.value }))}
                          placeholder="—"
                          className="border-gray-200 font-dm-mono text-sm"
                          autoComplete="off"
                        />
                        <span className="shrink-0 text-xs text-gray-400">{m.suffix}</span>
                      </div>
                    ) : m.kind === "shoe" ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Input
                          id={`measure-${m.key}`}
                          type="text"
                          inputMode="decimal"
                          value={draft.shoe}
                          onChange={(e) => setDraft((d) => ({ ...d, shoe: e.target.value }))}
                          placeholder="e.g. 10.5"
                          className="border-gray-200 font-dm-mono text-sm"
                          autoComplete="off"
                        />
                        <span className="shrink-0 text-xs text-gray-400">{m.suffix}</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 flex items-center gap-2">
                        <Input
                          id={`measure-${m.key}`}
                          type="text"
                          inputMode="decimal"
                          value={draft[m.key as InchDraftKey]}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, [m.key]: e.target.value } as MeasurementDraft))
                          }
                          placeholder="—"
                          className="border-gray-200 font-dm-mono text-sm"
                          autoComplete="off"
                        />
                        <span className="shrink-0 text-xs text-gray-400">{m.suffix}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {measureSaveError ? (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {measureSaveError}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="bg-[#0F6E56] text-white hover:bg-[#085041]"
                  size="sm"
                  disabled={measureSaveLoading}
                  onClick={() => void saveMeasurements()}
                >
                  {measureSaveLoading ? "Saving…" : "Save measurements"}
                </Button>
                {!hasMeasurements ? (
                  <span className="text-xs text-gray-400">Fill any fields you know — you can edit later.</span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Fit Prediction — only shown when measurements exist */}
          {hasMeasurements && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-900">Fit Prediction</h2>
              </div>
              <div className="space-y-5 p-5">
                <FitBar label="Shoulder fit"    value={96} />
                <FitBar label="Torso length"    value={91} />
                <FitBar label="Leg proportions" value={87} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
