import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

function initials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("")
}

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: profile }, { data: userProfile }] = await Promise.all([
    supabase.from("profiles").select("full_name, plan, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("user_profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
  ])

  const fullName = userProfile?.full_name ?? profile?.full_name ?? null
  const plan = profile?.plan ?? "free"
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your personal information</p>
      </div>

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#83aff0] to-[#3a70c0] text-xl font-bold text-white">
              {initials(fullName)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {fullName ?? <span className="text-gray-400">No name set</span>}
              </h2>
              {memberSince && (
                <p className="text-sm text-gray-400">Member since {memberSince}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Account Details</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            <li className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Email</p>
                <p className="mt-0.5 text-sm text-gray-800">{user.email}</p>
              </div>
            </li>

            <li className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Plan</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-sm text-gray-800">
                    {plan === "pro" ? "Drayp Pro" : "Drayp Free"}
                  </p>
                  <span className="inline-flex items-center rounded-full bg-[#e8f1fd] px-2 py-0.5 text-[10px] font-semibold text-[#2d5ca8]">
                    Active
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-gray-600">
                Manage
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
