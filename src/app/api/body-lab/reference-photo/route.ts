import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { validateFullBodyReferencePhoto } from "@/lib/ai/body-reference-photo-validator"

const BUCKET = "body-reference-photos"
const ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const
const MAX_BYTES = 8 * 1024 * 1024

async function ensurePublicBucket(admin: NonNullable<ReturnType<typeof createServiceRoleClient>>) {
  const { error } = await admin.storage.createBucket(BUCKET, { public: true })
  if (!error) return
  const m = (error.message ?? "").toLowerCase()
  if (m.includes("already") || m.includes("exists") || m.includes("duplicate")) return
  throw error
}

export async function POST(req: Request) {
  const admin = createServiceRoleClient()
  if (!admin) {
    return NextResponse.json(
      {
        code: "NO_SERVICE_ROLE",
        message:
          "Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Project Settings → API → service_role secret), then restart the dev server. Or run supabase/body-lab-storage-setup.sql in the SQL Editor.",
      },
      { status: 503 }
    )
  }

  const supabaseUser = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 })
  }

  const entry = formData.get("file")
  if (!entry || typeof entry === "string") {
    return NextResponse.json({ error: "Missing file field." }, { status: 400 })
  }

  const file = entry as File
  if (!ACCEPT.includes(file.type as (typeof ACCEPT)[number])) {
    return NextResponse.json({ error: "Use JPEG, PNG, or WebP." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 8MB or smaller." }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const vision = await validateFullBodyReferencePhoto({ buffer: buf, mimeType: file.type })
  if (!vision.ok) {
    return NextResponse.json({ error: vision.message }, { status: vision.httpStatus })
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const path = `${user.id}/reference.${ext}`

  try {
    await ensurePublicBucket(admin)
  } catch (e) {
    console.error("[body-lab/reference-photo] createBucket", e)
    return NextResponse.json({ error: "Could not create storage bucket." }, { status: 500 })
  }

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type,
    upsert: true,
  })
  if (uploadError) {
    console.error("[body-lab/reference-photo] upload", uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BUCKET).getPublicUrl(path)

  const { error: dbError } = await supabaseUser.from("body_measurements").upsert(
    {
      user_id: user.id,
      reference_photo_url: publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )
  if (dbError) {
    console.error("[body-lab/reference-photo] upsert", dbError)
    const missingTable =
      dbError.message.includes("body_measurements") &&
      (dbError.message.includes("does not exist") || dbError.message.includes("relation"))
    const missingCol =
      dbError.message.includes("reference_photo_url") || dbError.message.includes("schema cache")
    if (missingTable) {
      return NextResponse.json(
        {
          error: "Table body_measurements does not exist yet.",
          hint: "Run supabase/schema.sql once (recommended), or run supabase/body-lab-storage-setup.sql to create the table + policies for Body Lab.",
        },
        { status: 500 }
      )
    }
    if (missingCol) {
      return NextResponse.json(
        {
          error: "Column reference_photo_url is not on body_measurements yet.",
          hint: "Supabase → SQL Editor → paste and run:\n\nALTER TABLE public.body_measurements ADD COLUMN IF NOT EXISTS reference_photo_url TEXT;\n\n(File in repo: supabase/add-reference_photo_url_column.sql)",
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const bust = `${publicUrl}?t=${Date.now()}`
  return NextResponse.json({ publicUrl: bust })
}
