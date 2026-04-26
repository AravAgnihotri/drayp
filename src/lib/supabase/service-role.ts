import { createClient } from "@supabase/supabase-js"
import { getSupabaseUrl } from "./config"

/** Server-only: bypasses RLS. Used to ensure storage bucket exists and upload reference photos. */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!key) return null
  return createClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
