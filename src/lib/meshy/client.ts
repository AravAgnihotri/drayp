const MESHY_BASE = "https://api.meshy.ai/openapi/v1"

export type MeshyTaskStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED"

export type MeshyImageTo3DTask = {
  id: string
  status: MeshyTaskStatus
  progress: number
  model_urls?: { glb?: string }
  model_url?: string
  thumbnail_url?: string
  task_error?: { message?: string }
}

export function glbUrlFromMeshyTask(task: MeshyImageTo3DTask): string | null {
  return task.model_urls?.glb ?? task.model_url ?? null
}

export function modelProxyPath(taskId: string): string {
  return `/api/body-lab/model?taskId=${encodeURIComponent(taskId)}`
}

/** Same-origin URL for the user's permanently stored avatar GLB in Supabase. */
export const savedAvatarModelPath = "/api/body-lab/model"

function meshyHeaders(): HeadersInit {
  const key = process.env.MESHY_API_KEY?.trim()
  if (!key || key === "your_meshy_key") {
    throw new Error("MESHY_NOT_CONFIGURED")
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }
}

export function isMeshyConfigured(): boolean {
  const key = process.env.MESHY_API_KEY?.trim()
  return Boolean(key && key !== "your_meshy_key")
}

/** Public URL without cache-busting query params (Meshy needs a stable image URL). */
export function normalizeImageUrlForMeshy(url: string): string {
  try {
    const u = new URL(url)
    u.search = ""
    u.hash = ""
    return u.toString()
  } catch {
    return url.split("?")[0] ?? url
  }
}

export async function createImageTo3DTask(imageUrl: string): Promise<string> {
  const res = await fetch(`${MESHY_BASE}/image-to-3d`, {
    method: "POST",
    headers: meshyHeaders(),
    body: JSON.stringify({
      image_url: normalizeImageUrlForMeshy(imageUrl),
      ai_model: "latest",
      should_texture: true,
      pose_mode: "a-pose",
      target_formats: ["glb"],
    }),
  })

  const body = (await res.json().catch(() => ({}))) as { result?: string; message?: string }
  if (!res.ok) {
    const msg = body.message ?? `Meshy API error (${res.status})`
    throw new Error(msg)
  }
  if (!body.result) {
    throw new Error("Meshy did not return a task id.")
  }
  return body.result
}

export async function getImageTo3DTask(taskId: string): Promise<MeshyImageTo3DTask> {
  const res = await fetch(`${MESHY_BASE}/image-to-3d/${encodeURIComponent(taskId)}`, {
    headers: meshyHeaders(),
    cache: "no-store",
  })

  const body = (await res.json().catch(() => ({}))) as MeshyImageTo3DTask & { message?: string }
  if (!res.ok) {
    throw new Error(body.message ?? `Meshy API error (${res.status})`)
  }
  return body
}
