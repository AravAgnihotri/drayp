import type { SupabaseClient } from "@supabase/supabase-js"

export const BODY_LAB_STORAGE_BUCKET = "body-reference-photos"

export function avatarGlbStoragePath(userId: string): string {
  return `${userId}/avatar.glb`
}

export function isPermanentAvatarStorageUrl(url: string): boolean {
  return url.includes(`/${BODY_LAB_STORAGE_BUCKET}/`) && url.includes("/avatar.glb")
}

/** Saved avatar GLB path served by our API (same-origin, no CORS). */
export const SAVED_AVATAR_MODEL_API_PATH = "/api/body-lab/model"

/**
 * Download GLB from Meshy (or any URL) and store in the user's Supabase folder.
 * Each user gets `{userId}/avatar.glb` — persists until they regenerate or delete account data.
 */
export async function persistAvatarGlbToStorage(
  admin: SupabaseClient,
  userId: string,
  glbSourceUrl: string
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const assetRes = await fetch(glbSourceUrl, { cache: "no-store" })
  if (!assetRes.ok) {
    return { ok: false, error: `Could not download model (${assetRes.status}).` }
  }

  const buf = Buffer.from(await assetRes.arrayBuffer())
  const path = avatarGlbStoragePath(userId)

  const { error: uploadError } = await admin.storage.from(BODY_LAB_STORAGE_BUCKET).upload(path, buf, {
    contentType: "model/gltf-binary",
    upsert: true,
  })

  if (uploadError) {
    console.error("[body-lab] persist avatar glb", uploadError)
    return { ok: false, error: uploadError.message }
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(BODY_LAB_STORAGE_BUCKET).getPublicUrl(path)

  return { ok: true, publicUrl }
}

export async function downloadStoredAvatarGlb(
  admin: SupabaseClient,
  userId: string
): Promise<{ ok: true; body: ArrayBuffer } | { ok: false; error: string }> {
  const path = avatarGlbStoragePath(userId)
  const { data, error } = await admin.storage.from(BODY_LAB_STORAGE_BUCKET).download(path)

  if (error || !data) {
    return { ok: false, error: error?.message ?? "No saved 3D model for this account." }
  }

  const body = await data.arrayBuffer()
  return { ok: true, body }
}
