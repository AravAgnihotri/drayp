import { createClient } from "@/lib/supabase/server"
import { StatCard } from "@/components/ui/stat-card"
import { FitBar } from "@/components/ui/fit-bar"
import { StatusBadge, type OrderStatus } from "@/components/ui/status-badge"

const CATEGORY_LABELS: Record<string, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  footwear: "Footwear",
  accessories: "Accessories",
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { count: totalOrders },
    { count: inProgress },
    { count: savedCount },
    { count: newMatches },
    { data: recentOrders },
    { data: fitRows },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["pending", "in-transit"]),
    supabase.from("saved_items").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("saved_items").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_new_match", true),
    supabase.from("orders").select("id, item_name, order_number, ordered_at, status").eq("user_id", user.id).order("ordered_at", { ascending: false }).limit(3),
    supabase.from("orders").select("category, fit_score").eq("user_id", user.id).neq("status", "returned").not("fit_score", "is", null).not("category", "is", null),
  ])

  const categoryMap: Record<string, number[]> = {}
  for (const row of fitRows ?? []) {
    if (!row.category || row.fit_score == null) continue
    if (!categoryMap[row.category]) categoryMap[row.category] = []
    categoryMap[row.category].push(row.fit_score)
  }

  const fitCategories = Object.entries(CATEGORY_LABELS)
    .map(([key, label]) => {
      const scores = categoryMap[key]
      if (!scores?.length) return null
      return { label, value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }
    })
    .filter(Boolean) as { label: string; value: number }[]

  const allScores = Object.values(categoryMap).flat()
  const avgFit = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your Drayp activity</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Orders"
          value={totalOrders ?? 0}
          sub={(inProgress ?? 0) > 0 ? `${inProgress} in progress` : "No active orders"}
        />
        <StatCard
          label="Saved Items"
          value={savedCount ?? 0}
          sub={(newMatches ?? 0) > 0 ? `${newMatches} new match${newMatches === 1 ? "" : "es"}` : "No new matches"}
        />
        <StatCard
          label="Fit Score Avg"
          value={avgFit !== null ? `${avgFit}%` : "—"}
          sub={avgFit !== null ? "Across all categories" : "No scored orders yet"}
          valueClassName={avgFit !== null ? "text-[#0F6E56]" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{order.item_name}</p>
                    <p className="mt-0.5 font-dm-mono text-xs text-gray-400">
                      #{order.order_number} · {new Date(order.ordered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <StatusBadge status={order.status as OrderStatus} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No orders yet</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Fit Score by Category</h2>
          </div>
          {fitCategories.length > 0 ? (
            <div className="space-y-5 p-5">
              {fitCategories.map((cat) => (
                <FitBar key={cat.label} label={cat.label} value={cat.value} />
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              Fit scores appear after your first order
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
