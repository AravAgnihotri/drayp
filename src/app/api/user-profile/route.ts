import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "full_name, gender, photo_url, height_cm, weight_kg, chest_cm, waist_cm, hips_cm, inseam_cm, size_top, size_bottom, shoe_size, favorite_colors, favorite_brands, style_tags, budget_range"
    )
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data ?? null, email: user.email })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const body = await req.json()

  // Only allow safe fields to be patched
  const allowed = [
    "full_name",
    "gender",
    "height_cm",
    "weight_kg",
    "chest_cm",
    "waist_cm",
    "hips_cm",
    "inseam_cm",
    "size_top",
    "size_bottom",
    "shoe_size",
    "favorite_colors",
    "favorite_brands",
    "style_tags",
    "budget_range",
  ] as const

  const patch: Record<string, unknown> = { user_id: user.id }
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  const { error } = await supabase
    .from("user_profiles")
    .upsert(patch, { onConflict: "user_id" })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Sync full_name to profiles table too
  if (body.full_name) {
    try {
      await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: body.full_name }, { onConflict: "id" })
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.json({ success: true })
}
