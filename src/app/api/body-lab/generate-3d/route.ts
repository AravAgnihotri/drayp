import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { persistAvatarGlbToStorage } from "@/lib/body-lab/avatar-storage"
import {
  createImageTo3DTask,
  getImageTo3DTask,
  glbUrlFromMeshyTask,
  isMeshyConfigured,
  modelProxyPath,
  savedAvatarModelPath,
} from "@/lib/meshy/client"

type BodyMeasurements3DRow = {
  reference_photo_url: string | null
  meshy_task_id?: string | null
  avatar_model_glb_url?: string | null
}

export async function POST() {
  if (!isMeshyConfigured()) {
    return NextResponse.json(
      {
        code: "NO_MESHY_KEY",
        error: "Add MESHY_API_KEY to .env.local (from meshy.ai → Settings → API) and restart the dev server.",
      },
      { status: 503 }
    )
  }

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("body_measurements")
    .select("reference_photo_url")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[body-lab/generate-3d] load photo", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const photoUrl = (data as BodyMeasurements3DRow | null)?.reference_photo_url
  if (!photoUrl) {
    return NextResponse.json(
      { error: "Upload a reference photo first, then generate your 3D model." },
      { status: 400 }
    )
  }

  try {
    const taskId = await createImageTo3DTask(photoUrl)

    const upsertPayload: Record<string, string> = {
      user_id: user.id,
      meshy_task_id: taskId,
      updated_at: new Date().toISOString(),
    }

    const { error: dbError } = await supabase.from("body_measurements").upsert(upsertPayload, {
      onConflict: "user_id",
    })

    if (dbError) {
      const missingCol =
        dbError.message.includes("meshy_task_id") || dbError.message.includes("schema cache")
      if (missingCol) {
        return NextResponse.json({
          taskId,
          warning:
            "3D task started but could not save task id. Run supabase/add-avatar_3d_columns.sql in Supabase SQL Editor.",
        })
      }
      console.error("[body-lab/generate-3d] upsert task id", dbError)
    }

    return NextResponse.json({ taskId })
  } catch (e) {
    console.error("[body-lab/generate-3d] create task", e)
    const message = e instanceof Error ? e.message : "Failed to start 3D generation."
    if (message === "MESHY_NOT_CONFIGURED") {
      return NextResponse.json(
        { code: "NO_MESHY_KEY", error: "Meshy API key is not configured." },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  if (!isMeshyConfigured()) {
    return NextResponse.json(
      { code: "NO_MESHY_KEY", error: "Meshy API key is not configured." },
      { status: 503 }
    )
  }

  const taskId = req.nextUrl.searchParams.get("taskId")?.trim()
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId query parameter." }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 })
  }

  try {
    const task = await getImageTo3DTask(taskId)
    const glbUrl = glbUrlFromMeshyTask(task)

    let modelUrl: string | null = null
    let storedAvatarUrl: string | null = null

    if (task.status === "SUCCEEDED" && glbUrl) {
      // Use admin if available; user client works too (bucket RLS allows authenticated uploads to own folder)
      const admin = createServiceRoleClient()
      const uploadClient = admin ?? supabase
      const saved = await persistAvatarGlbToStorage(uploadClient, user.id, glbUrl)
      if (saved.ok) {
        storedAvatarUrl = saved.publicUrl
        modelUrl = savedAvatarModelPath
      }

      const db = admin ?? supabase
      const { error: dbError } = await db.from("body_measurements").upsert(
        {
          user_id: user.id,
          meshy_task_id: taskId,
          avatar_model_glb_url: storedAvatarUrl ?? glbUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      if (dbError) {
        const missingCol =
          dbError.message.includes("meshy_task_id") ||
          dbError.message.includes("avatar_model_glb_url") ||
          dbError.message.includes("schema cache")
        if (!missingCol) {
          console.error("[body-lab/generate-3d] save glb url", dbError)
        }
      }

      if (!modelUrl) {
        modelUrl = modelProxyPath(taskId)
      }
    }

    return NextResponse.json({
      status: task.status,
      progress: task.progress ?? 0,
      glbUrl,
      storedAvatarUrl,
      modelUrl,
      thumbnailUrl: task.thumbnail_url ?? null,
      error: task.status === "FAILED" ? task.task_error?.message ?? "Generation failed." : null,
    })
  } catch (e) {
    console.error("[body-lab/generate-3d] poll task", e)
    const message = e instanceof Error ? e.message : "Failed to check 3D generation status."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
