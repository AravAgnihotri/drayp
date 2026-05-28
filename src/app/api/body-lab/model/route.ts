import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import {
  downloadStoredAvatarGlb,
  isPermanentAvatarStorageUrl,
  persistAvatarGlbToStorage,
} from "@/lib/body-lab/avatar-storage"
import { getImageTo3DTask, glbUrlFromMeshyTask, isMeshyConfigured } from "@/lib/meshy/client"

type BodyLabRow = { avatar_model_glb_url?: string | null; meshy_task_id?: string | null }

function glbResponse(body: ArrayBuffer): NextResponse {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "private, max-age=86400",
    },
  })
}

/** Stream the user's permanently saved GLB, or fetch from Meshy while generating. */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  // Read saved URLs from DB using the user's own client (no admin required)
  const { data: row } = await supabase
    .from("body_measurements")
    .select("avatar_model_glb_url, meshy_task_id")
    .eq("user_id", user.id)
    .maybeSingle()

  const savedAvatarUrl = (row as BodyLabRow | null)?.avatar_model_glb_url ?? null
  const dbTaskId = (row as BodyLabRow | null)?.meshy_task_id ?? null
  const taskId = req.nextUrl.searchParams.get("taskId")?.trim() ?? dbTaskId ?? null

  // Permanent Supabase storage URL — fetch and proxy so model-viewer loads same-origin (no CORS issues)
  if (savedAvatarUrl && isPermanentAvatarStorageUrl(savedAvatarUrl)) {
    const res = await fetch(savedAvatarUrl, { cache: "no-store" })
    if (res.ok) return glbResponse(await res.arrayBuffer())
  }

  // Try downloading through admin SDK if service role key is configured
  const admin = createServiceRoleClient()
  if (admin) {
    const stored = await downloadStoredAvatarGlb(admin, user.id)
    if (stored.ok) return glbResponse(stored.body)
  }

  // Fall back to fetching from Meshy using the task ID
  if (!taskId) {
    return NextResponse.json(
      { error: "No saved 3D model yet. Generate one from your photo." },
      { status: 404 }
    )
  }

  if (!isMeshyConfigured()) {
    return NextResponse.json({ error: "Meshy API key is not configured." }, { status: 503 })
  }

  try {
    const task = await getImageTo3DTask(taskId)
    if (task.status !== "SUCCEEDED") {
      return NextResponse.json({ error: "Model is not ready yet.", status: task.status }, { status: 409 })
    }

    const glbUrl = glbUrlFromMeshyTask(task)
    if (!glbUrl) {
      return NextResponse.json({ error: "No model file on this task." }, { status: 404 })
    }

    // Opportunistically persist to storage for next time
    const uploadClient = admin ?? supabase
    const saved = await persistAvatarGlbToStorage(uploadClient, user.id, glbUrl)
    if (saved.ok) {
      const db = admin ?? supabase
      await db.from("body_measurements").upsert(
        {
          user_id: user.id,
          meshy_task_id: taskId,
          avatar_model_glb_url: saved.publicUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      const res = await fetch(saved.publicUrl, { cache: "no-store" })
      if (res.ok) return glbResponse(await res.arrayBuffer())
    }

    const assetRes = await fetch(glbUrl, { cache: "no-store" })
    if (!assetRes.ok) {
      return NextResponse.json({ error: "Could not fetch model from Meshy." }, { status: 502 })
    }
    return glbResponse(await assetRes.arrayBuffer())
  } catch (e) {
    console.error("[body-lab/model]", e)
    const message = e instanceof Error ? e.message : "Failed to load model."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
