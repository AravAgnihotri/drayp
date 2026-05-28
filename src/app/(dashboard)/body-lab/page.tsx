"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Box, RefreshCw, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AvatarModelViewer from "@/components/AvatarModelViewer"
import { createClient } from "@/lib/supabase/client"
import { isPermanentAvatarStorageUrl, SAVED_AVATAR_MODEL_API_PATH } from "@/lib/body-lab/avatar-storage"

const BODY_PHOTO_BUCKET = "body-reference-photos"
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const MESHY_TASK_STORAGE_PREFIX = "drayp-body-lab-meshy-task:"
const PHOTO_STORAGE_PREFIX = "drayp-body-lab-photo:"

const MEASUREMENT_SELECT_BASE = [
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
] as const

const MEASUREMENT_SELECT_3D = ["avatar_model_glb_url", "meshy_task_id"] as const

function isMissingColumnError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes("schema cache") ||
    m.includes("column") ||
    m.includes("avatar_model_glb_url") ||
    m.includes("meshy_task_id")
  )
}

function modelProxyPath(taskId: string): string {
  return `/api/body-lab/model?taskId=${encodeURIComponent(taskId)}`
}

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

/** Row shape from `body_measurements` (extends beyond generated Supabase types). */
type BodyMeasurementsRow = {
  chest_in: number | null
  waist_in: number | null
  hips_in: number | null
  inseam_in: number | null
  shoulders_in: number | null
  neck_in: number | null
  sleeve_in: number | null
  bicep_in: number | null
  thigh_in: number | null
  calf_in: number | null
  weight_lbs: number | null
  shoe_size_us: number | null
  height_text: string | null
  reference_photo_url?: string | null
  avatar_model_glb_url?: string | null
  meshy_task_id?: string | null
  updated_at?: string
}

function restoreMeshyTaskFromStorage(userId: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(`${MESHY_TASK_STORAGE_PREFIX}${userId}`)
  } catch {
    return null
  }
}

function persistMeshyTaskToStorage(userId: string, taskId: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`${MESHY_TASK_STORAGE_PREFIX}${userId}`, taskId)
  } catch {
    /* ignore quota / private mode */
  }
}

function restorePhotoFromStorage(userId: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(`${PHOTO_STORAGE_PREFIX}${userId}`)
  } catch {
    return null
  }
}

function persistPhotoToStorage(userId: string, url: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`${PHOTO_STORAGE_PREFIX}${userId}`, url.split("?")[0])
  } catch {
    /* ignore */
  }
}

async function fetchSavedReferencePhoto(): Promise<string | null> {
  try {
    const res = await fetch("/api/body-lab/reference-photo", { credentials: "same-origin" })
    if (!res.ok) return null
    const json = (await res.json()) as { publicUrl?: string | null }
    return json.publicUrl ?? null
  } catch {
    return null
  }
}

const GENERATE_3D_POLL_MS = 3000
const GENERATE_3D_MAX_WAIT_MS = 8 * 60 * 1000

function draftFromRow(data: BodyMeasurementsRow): MeasurementDraft {
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
      <circle cx="60" cy="28" r="20" stroke="#83aff0" strokeWidth="2.5" fill="#e8f1fd" />
      <line x1="60" y1="48" x2="60" y2="62" stroke="#83aff0" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 64 Q60 70 82 64 L84 130 Q60 136 36 130 Z" stroke="#83aff0" strokeWidth="2.5" fill="#e8f1fd" strokeLinejoin="round" />
      <path d="M38 72 Q20 100 16 130" stroke="#83aff0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M82 72 Q100 100 104 130" stroke="#83aff0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M48 130 Q44 172 40 210" stroke="#83aff0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M72 130 Q76 172 80 210" stroke="#83aff0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <line x1="18" y1="72" x2="102" y2="72" stroke="#a8c4f4" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="18" cy="72" r="2" fill="#a8c4f4" />
      <circle cx="102" cy="72" r="2" fill="#a8c4f4" />
      <line x1="36" y1="108" x2="84" y2="108" stroke="#a8c4f4" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="36" cy="108" r="2" fill="#a8c4f4" />
      <circle cx="84" cy="108" r="2" fill="#a8c4f4" />
    </svg>
  )
}

export default function BodyLabPage() {
  const supabase = useMemo(() => createClient(), [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const autoPolledTaskRef = useRef<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [referencePhotoUrl, setReferencePhotoUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null)
  const [photoUploadHint, setPhotoUploadHint] = useState<string | null>(null)
  const [photoSavedMessage, setPhotoSavedMessage] = useState<string | null>(null)
  const [meshyTaskId, setMeshyTaskId] = useState<string | null>(null)
  const [meshyGlbDirectUrl, setMeshyGlbDirectUrl] = useState<string | null>(null)
  const [avatarModelViewUrl, setAvatarModelViewUrl] = useState<string | null>(null)
  const [showModel3d, setShowModel3d] = useState(false)
  const [generate3dLoading, setGenerate3dLoading] = useState(false)
  const [generate3dProgress, setGenerate3dProgress] = useState(0)
  const [generate3dError, setGenerate3dError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MeasurementDraft>(emptyDraft)
  const [measureSaveLoading, setMeasureSaveLoading] = useState(false)
  const [measureSaveError, setMeasureSaveError] = useState<string | null>(null)
  const [estimateLoading, setEstimateLoading] = useState(false)
  const [estimateNote, setEstimateNote] = useState<string | null>(null)

  const loadBodyData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fullSelect = [...MEASUREMENT_SELECT_BASE, ...MEASUREMENT_SELECT_3D].join(", ")
    let { data, error } = await supabase
      .from("body_measurements")
      .select(fullSelect)
      .eq("user_id", user.id)
      .maybeSingle()

    if (error && isMissingColumnError(error.message)) {
      const fallback = await supabase
        .from("body_measurements")
        .select(MEASUREMENT_SELECT_BASE.join(", "))
        .eq("user_id", user.id)
        .maybeSingle()
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error("[body-lab] load measurements", error)
    }

    const row = (data ?? null) as BodyMeasurementsRow | null
    if (row) {
      setDraft(draftFromRow(row))
    } else {
      setDraft(emptyDraft())
    }

    const photoFromApi = await fetchSavedReferencePhoto()
    const photoFromRow = row?.reference_photo_url ?? null
    const photoFromCache = restorePhotoFromStorage(user.id)
    const resolvedPhoto = photoFromApi ?? photoFromRow ?? photoFromCache

    if (resolvedPhoto) {
      const base = resolvedPhoto.split("?")[0]
      setReferencePhotoUrl(`${base}?v=${Date.now()}`)
      persistPhotoToStorage(user.id, base)
    } else {
      setReferencePhotoUrl(null)
    }

    if (!row && !resolvedPhoto) {
      setMeshyTaskId(null)
      setMeshyGlbDirectUrl(null)
      setAvatarModelViewUrl(null)
      setShowModel3d(false)
      setLastUpdated(null)
      return
    }

    const storedTaskId = row?.meshy_task_id ?? restoreMeshyTaskFromStorage(user.id)
    const savedAvatarUrl = row?.avatar_model_glb_url ?? null

    if (savedAvatarUrl && isPermanentAvatarStorageUrl(savedAvatarUrl)) {
      setMeshyTaskId(storedTaskId)
      setMeshyGlbDirectUrl(savedAvatarUrl)
      setAvatarModelViewUrl(SAVED_AVATAR_MODEL_API_PATH)
      setShowModel3d(true)
    } else if (storedTaskId) {
      setMeshyTaskId(storedTaskId)
      setAvatarModelViewUrl(modelProxyPath(storedTaskId))
      setShowModel3d(true)
      if (savedAvatarUrl) {
        setMeshyGlbDirectUrl(savedAvatarUrl)
      }
    } else {
      setMeshyTaskId(null)
      setMeshyGlbDirectUrl(null)
      setAvatarModelViewUrl(null)
      setShowModel3d(false)
    }

    if (row?.updated_at) {
      setLastUpdated(
        new Date(row.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      )
    }
  }, [supabase])

  useEffect(() => {
    loadBodyData()
  }, [loadBodyData])

  // Auto-poll an in-progress task so the user sees live progress without clicking.
  useEffect(() => {
    if (!meshyTaskId || meshyGlbDirectUrl) return
    if (autoPolledTaskRef.current === meshyTaskId) return
    autoPolledTaskRef.current = meshyTaskId

    setGenerate3dLoading(true)
    setGenerate3dProgress(5)
    setGenerate3dError(null)

    void (async () => {
      const result = await pollGenerate3dTask(meshyTaskId)
      if ("error" in result) {
        setGenerate3dError(result.error)
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) persistMeshyTaskToStorage(user.id, meshyTaskId)
        setMeshyGlbDirectUrl(result.glbUrl)
        setAvatarModelViewUrl(result.modelUrl)
        setShowModel3d(true)
        setGenerate3dProgress(100)
        void loadBodyData()
      }
      setGenerate3dLoading(false)
    })()
  }, [meshyTaskId, meshyGlbDirectUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEstimateMeasurements() {
    setEstimateLoading(true)
    setEstimateNote(null)
    setMeasureSaveError(null)

    try {
      const res = await fetch("/api/body-lab/estimate-measurements", {
        method: "POST",
        credentials: "same-origin",
      })
      const json = (await res.json().catch(() => ({}))) as {
        estimates?: Record<string, unknown>
        note?: string
        error?: string
      }

      if (!res.ok) {
        setMeasureSaveError(json.error ?? `Estimation failed (${res.status}).`)
        return
      }

      const e = json.estimates ?? {}
      const num = (v: unknown) => (typeof v === "number" ? String(v) : "")
      const str = (v: unknown) => (typeof v === "string" ? v : "")

      setDraft((d) => ({
        chest: num(e.chest_in) || d.chest,
        waist: num(e.waist_in) || d.waist,
        hips: num(e.hips_in) || d.hips,
        neck: num(e.neck_in) || d.neck,
        shoulders: num(e.shoulders_in) || d.shoulders,
        sleeve: num(e.sleeve_in) || d.sleeve,
        inseam: num(e.inseam_in) || d.inseam,
        thigh: num(e.thigh_in) || d.thigh,
        calf: num(e.calf_in) || d.calf,
        bicep: num(e.bicep_in) || d.bicep,
        height: str(e.height_text) || d.height,
        weight: num(e.weight_lbs) || d.weight,
        shoe: d.shoe,
      }))
      setEstimateNote(json.note ?? "AI estimates filled in. Review and save.")
    } catch {
      setMeasureSaveError("Network error during estimation. Try again.")
    } finally {
      setEstimateLoading(false)
    }
  }

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

    const photoUrlForDb = referencePhotoUrl?.split("?")[0] ?? null

    setMeasureSaveLoading(true)
    const { error } = await supabase.from("body_measurements").upsert(
      {
        user_id: user.id,
        ...inchPayload,
        weight_lbs: weight.value,
        shoe_size_us: shoe.value,
        height_text: draft.height.trim() || null,
        ...(photoUrlForDb ? { reference_photo_url: photoUrlForDb } : {}),
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
    setPhotoSavedMessage(null)

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
        const data = (await res.json()) as { publicUrl: string; saved?: boolean }
        const { data: { user: uploadUser } } = await supabase.auth.getUser()
        if (uploadUser) {
          persistPhotoToStorage(uploadUser.id, data.publicUrl)
        }
        setReferencePhotoUrl(data.publicUrl)
        setMeshyTaskId(null)
        setMeshyGlbDirectUrl(null)
        setAvatarModelViewUrl(null)
        setShowModel3d(false)
        setGenerate3dError(null)
        setPhotoSavedMessage(
          data.saved === false
            ? "Photo uploaded, but could not link to your account. Run supabase/body-lab-storage-setup.sql in Supabase."
            : "Photo saved to your account."
        )
        setLastUpdated(
          new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        )
        await loadBodyData()
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
          const { data: { user: uploadUser } } = await supabase.auth.getUser()
          if (uploadUser) {
            persistPhotoToStorage(uploadUser.id, fallback.publicUrl)
          }
          setReferencePhotoUrl(fallback.publicUrl)
          setMeshyTaskId(null)
          setMeshyGlbDirectUrl(null)
          setAvatarModelViewUrl(null)
          setShowModel3d(false)
          setGenerate3dError(null)
          setPhotoSavedMessage("Photo saved to your account.")
          setLastUpdated(
            new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          )
          await loadBodyData()
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

  async function pollGenerate3dTask(
    taskId: string
  ): Promise<{ glbUrl: string; modelUrl: string } | { error: string }> {
    const started = Date.now()
    while (Date.now() - started < GENERATE_3D_MAX_WAIT_MS) {
      const res = await fetch(`/api/body-lab/generate-3d?taskId=${encodeURIComponent(taskId)}`, {
        credentials: "same-origin",
      })
      const json = (await res.json().catch(() => ({}))) as {
        status?: string
        progress?: number
        glbUrl?: string | null
        modelUrl?: string | null
        error?: string
      }

      if (!res.ok) {
        return { error: json.error ?? `Status check failed (${res.status}).` }
      }

      if (typeof json.progress === "number") {
        setGenerate3dProgress(json.progress)
      }

      if (json.status === "SUCCEEDED" && json.glbUrl) {
        return {
          glbUrl: json.glbUrl,
          modelUrl: json.modelUrl ?? modelProxyPath(taskId),
        }
      }
      if (json.status === "FAILED" || json.status === "CANCELED") {
        return { error: json.error ?? "3D generation failed. Try another photo." }
      }

      await new Promise((r) => setTimeout(r, GENERATE_3D_POLL_MS))
    }
    return { error: "Generation is taking longer than expected. Try again in a few minutes." }
  }

  async function handleGenerate3d() {
    if (!referencePhotoUrl) return

    setGenerate3dError(null)
    setGenerate3dProgress(0)
    setGenerate3dLoading(true)

    try {
      const startRes = await fetch("/api/body-lab/generate-3d", {
        method: "POST",
        credentials: "same-origin",
      })
      const startJson = (await startRes.json().catch(() => ({}))) as {
        taskId?: string
        error?: string
        code?: string
      }

      if (!startRes.ok) {
        setGenerate3dError(
          startJson.error ??
            (startRes.status === 503
              ? "Add MESHY_API_KEY to .env.local and restart the dev server."
              : `Could not start generation (${startRes.status}).`)
        )
        return
      }

      const taskId = startJson.taskId
      if (!taskId) {
        setGenerate3dError("Server did not return a task id.")
        return
      }

      // Mark as user-initiated so the auto-poll effect doesn't double-start
      autoPolledTaskRef.current = taskId

      const result = await pollGenerate3dTask(taskId)
      if ("error" in result) {
        setGenerate3dError(result.error)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        persistMeshyTaskToStorage(user.id, taskId)
      }

      setMeshyTaskId(taskId)
      setMeshyGlbDirectUrl(result.glbUrl)
      setAvatarModelViewUrl(result.modelUrl)
      setShowModel3d(true)
      setGenerate3dProgress(100)
      // Sync from DB to pick up the permanently-saved Supabase storage URL
      await loadBodyData()
    } catch (e) {
      console.error("[body-lab] generate 3d", e)
      setGenerate3dError("Network error while generating. Try again.")
    } finally {
      setGenerate3dLoading(false)
    }
  }

  const hasMeasurements = hasAnyMeasurement(draft)
  const canGenerate3d = Boolean(referencePhotoUrl) && !photoUploading && !generate3dLoading

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900">Body Lab</h1>
            <span className="inline-flex items-center rounded-full bg-[#5b8fd8] px-2 py-0.5 text-[10px] font-semibold text-white">
              New
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Your 3D avatar, photo, and measurements</p>
        </div>
        {lastUpdated ? <p className="text-xs text-gray-400">Last updated {lastUpdated}</p> : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row lg:items-stretch">
        <section className="flex min-h-[min(78dvh,900px)] flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:min-h-[calc(100dvh-7.5rem)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Your avatar</h2>
            {avatarModelViewUrl ? (
              <div className="flex gap-1 rounded-full bg-gray-100 p-0.5">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    showModel3d ? "bg-white text-[#3a70c0] shadow-sm" : "text-gray-500"
                  }`}
                  onClick={() => setShowModel3d(true)}
                >
                  3D model
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    !showModel3d ? "bg-white text-[#3a70c0] shadow-sm" : "text-gray-500"
                  }`}
                  onClick={() => setShowModel3d(false)}
                >
                  Photo
                </button>
              </div>
            ) : null}
          </div>
          <div className="relative flex min-h-[min(65dvh,720px)] flex-1 flex-col bg-gradient-to-b from-[#f4faf7] to-[#eef2f4]">
            <div className="absolute inset-0 flex items-center justify-center p-3 pb-24 md:p-8 md:pb-28">
              {showModel3d && avatarModelViewUrl ? (
                <AvatarModelViewer
                  src={avatarModelViewUrl}
                  fallbackHref={meshyGlbDirectUrl}
                  className="h-full w-full max-h-full max-w-full"
                />
              ) : referencePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded blob from our storage CDN
                <img
                  src={referencePhotoUrl}
                  alt="Your reference photo for Body Lab"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="h-full max-h-[min(60dvh,640px)] w-full max-w-sm">
                  <AvatarSVG />
                </div>
              )}
            </div>

            {(generate3dLoading || generate3dError || photoSavedMessage || photoUploadError) && (
              <div className="absolute left-4 right-4 top-4 z-10 space-y-2">
                {generate3dLoading ? (
                  <p className="rounded-lg bg-white/95 px-3 py-2 text-center text-xs text-gray-600 shadow-sm backdrop-blur">
                    Generating 3D model… {generate3dProgress > 0 ? `${generate3dProgress}%` : "starting"}
                  </p>
                ) : null}
                {generate3dError ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600 shadow-sm" role="alert">
                    {generate3dError}
                  </p>
                ) : null}
                {photoSavedMessage ? (
                  <p className="rounded-lg bg-[#e8f1fd] px-3 py-2 text-center text-xs text-[#3a70c0] shadow-sm" role="status">
                    {photoSavedMessage}
                  </p>
                ) : null}
                {photoUploadError ? (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 shadow-sm" role="alert">
                    <p>{photoUploadError}</p>
                    {photoUploadHint ? (
                      <pre className="mt-2 whitespace-pre-wrap break-words font-mono text-[10px] text-red-800/80">
                        {photoUploadHint}
                      </pre>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}

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
            <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
              {referencePhotoUrl ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-2 bg-[#5b8fd8] text-white shadow-md hover:bg-[#3a70c0] sm:flex-1 sm:max-w-xs"
                  disabled={!canGenerate3d}
                  onClick={() => void handleGenerate3d()}
                >
                  <Box className="h-4 w-4" />
                  {generate3dLoading
                    ? "Generating…"
                    : avatarModelViewUrl
                      ? "Regenerate 3D"
                      : "Generate 3D model"}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-white/80 bg-white/95 shadow-md backdrop-blur hover:bg-white sm:flex-1 sm:max-w-xs"
                disabled={photoUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {photoUploading ? "Uploading…" : "Upload photo"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2 border-white/80 bg-white/95 shadow-md backdrop-blur hover:bg-white sm:max-w-[11rem]"
                onClick={() =>
                  document.getElementById("body-measurements-form")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <RefreshCw className="h-4 w-4" />
                Measurements
              </Button>
            </div>
          </div>
        </section>

        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[min(100%,22rem)] lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto xl:w-96">
          {/* Measurements */}
          <div
            id="body-measurements-form"
            className="rounded-xl border border-gray-200 bg-white shadow-sm scroll-mt-6"
          >
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Body Measurements</h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Lengths in inches; height as text; weight in pounds; US shoe size. Leave anything unknown blank.
                  </p>
                </div>
                {referencePhotoUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5 border-[#83aff0]/40 text-[#3a70c0] hover:bg-[#e8f1fd] hover:border-[#83aff0]"
                    disabled={estimateLoading}
                    onClick={() => void handleEstimateMeasurements()}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {estimateLoading ? "Estimating…" : "Estimate with AI"}
                  </Button>
                ) : null}
              </div>
              {estimateNote ? (
                <p className="mt-2 text-xs text-[#3a70c0] bg-[#e8f1fd] rounded-md px-2.5 py-1.5">
                  {estimateNote}
                </p>
              ) : null}
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
                  className="bg-[#3a70c0] text-white hover:bg-[#2d5ca8]"
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
        </aside>
      </div>
    </div>
  )
}
