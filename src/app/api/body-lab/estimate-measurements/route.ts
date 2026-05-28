import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { estimateMeasurementsFromPhoto } from "@/lib/ai/measurement-estimator"

type BodyLabPhotoRow = { reference_photo_url?: string | null }

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const { data: row, error: dbError } = await supabase
    .from("body_measurements")
    .select("reference_photo_url")
    .eq("user_id", user.id)
    .maybeSingle()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const photoUrl = (row as BodyLabPhotoRow | null)?.reference_photo_url ?? null
  if (!photoUrl) {
    return NextResponse.json(
      { error: "Upload a reference photo first, then use AI estimation." },
      { status: 400 }
    )
  }

  // Fetch the image so we can send it as base64 (avoids OpenAI needing to reach our CDN)
  const imgRes = await fetch(photoUrl, { cache: "no-store" })
  if (!imgRes.ok) {
    return NextResponse.json({ error: "Could not load your reference photo." }, { status: 502 })
  }
  const contentType = imgRes.headers.get("content-type") ?? "image/jpeg"
  const mimeType = contentType.split(";")[0]?.trim() ?? "image/jpeg"
  const buffer = Buffer.from(await imgRes.arrayBuffer())

  const result = await estimateMeasurementsFromPhoto(buffer, mimeType)
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.httpStatus })
  }

  return NextResponse.json({ estimates: result.estimates, note: result.note })
}
