import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseAnonKey, getSupabaseUrl } from "./config"

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie writes are a no-op
          }
        },
      },
    }
  )
}
