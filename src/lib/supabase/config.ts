const PLACEHOLDER_SUPABASE_URL = "https://placeholder.supabase.co"
const PLACEHOLDER_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

function isValidHttpOrHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

function isPlaceholderSupabaseUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    lower.includes("your-project-ref") ||
    lower.includes("placeholder.supabase") ||
    lower === "https://supabase.co"
  )
}

/** Resolves URL for Supabase clients; falls back when env is missing or invalid. */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (raw && isValidHttpOrHttpsUrl(raw) && !isPlaceholderSupabaseUrl(raw)) return raw
  return PLACEHOLDER_SUPABASE_URL
}

/** Resolves anon key; falls back when env is missing or implausibly short. */
export function getSupabaseAnonKey(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (raw && raw.length >= 32) return raw
  return PLACEHOLDER_SUPABASE_ANON_KEY
}
