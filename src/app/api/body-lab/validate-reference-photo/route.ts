import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateFullBodyReferencePhoto } from "@/lib/ai/body-reference-photo-validator"

const ACCEPT = ["image/jpeg", "image/png", "image/webp"] as const
const MAX_BYTES = 8 * 1024 * 1024

export async function POST(req: Request) {
  const supabaseUser = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 })
  }

  const entry = formData.get("file")
  if (!entry || typeof entry === "string") {
    return NextResponse.json({ ok: false, error: "Missing file field." }, { status: 400 })
  }

  const file = entry as File
  if (!ACCEPT.includes(file.type as (typeof ACCEPT)[number])) {
    return NextResponse.json({ ok: false, error: "Use JPEG, PNG, or WebP." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Image must be 8MB or smaller." }, { status: 400 })
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const result = await validateFullBodyReferencePhoto({ buffer: buf, mimeType: file.type })
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.message }, { status: result.httpStatus })
  }

  return NextResponse.json({ ok: true })
}
