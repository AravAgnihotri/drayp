import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

const CATEGORY_LABELS: Record<string, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  footwear: "Footwear",
  accessories: "Accessories",
}

export default async function FitMetricsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("orders")
    .select("id, item_name, ordered_at, status, fit_score, category")
    .eq("user_id", user.id)
    .order("ordered_at", { ascending: false })

  const orders = data ?? []
  const totalOrders = orders.length
  const returnedCount = orders.filter((o) => o.status === "returned").length
  const returnsRate = totalOrders > 0 ? Math.round((returnedCount / totalOrders) * 100) : null

  const scoredOrders = orders.filter((o) => o.status !== "returned" && o.fit_score != null)
  const avgFitScore = scoredOrders.length > 0
    ? Math.round(scoredOrders.reduce((sum, o) => sum + (o.fit_score as number), 0) / scoredOrders.length)
    : null

  const categoryScores: Record<string, number[]> = {}
  for (const o of scoredOrders) {
    if (!o.category) continue
    if (!categoryScores[o.category]) categoryScores[o.category] = []
    categoryScores[o.category].push(o.fit_score as number)
  }

  const bestCategory = Object.entries(categoryScores)
    .map(([key, scores]) => ({ key, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
    .sort((a, b) => b.avg - a.avg)[0]

  const metricCards = [
    {
      label: "Avg Fit Score",
      value: avgFitScore !== null ? `${avgFitScore}%` : "—",
      sub: "Across non-returned orders",
    },
    {
      label: "Returns Rate",
      value: returnsRate !== null ? `${returnsRate}%` : "—",
      sub: totalOrders > 0 ? `${returnedCount} of ${totalOrders} orders` : "No orders yet",
    },
    {
      label: "Total Orders",
      value: totalOrders.toString(),
      sub: "All time",
    },
    {
      label: "Best Category",
      value: bestCategory ? (CATEGORY_LABELS[bestCategory.key] ?? bestCategory.key) : "—",
      sub: bestCategory
        ? `${Math.round(bestCategory.avg)}% avg score`
        : "No data yet",
    },
  ]

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Fit Metrics</h1>
        <p className="mt-1 text-sm text-gray-500">Your personal fit performance over time</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {metricCards.map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{m.label}</p>
            <p className="mt-2 font-dm-mono text-3xl font-bold text-gray-900">{m.value}</p>
            {m.sub && <p className="mt-1 text-xs text-gray-400">{m.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Fit History</h2>
        </div>
        {orders.length > 0 ? (
          <div className="relative px-5 py-5">
            <div className="absolute bottom-5 left-[28px] top-5 w-px bg-gray-100" />
            <ul className="space-y-6">
              {orders.slice(0, 10).map((entry) => (
                <li key={entry.id} className="relative flex items-start gap-4">
                  <div className={cn(
                    "relative z-10 mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 bg-white",
                    entry.status === "returned" ? "border-gray-300" : "border-[#1D9E75]"
                  )}>
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      entry.status === "returned" ? "bg-gray-300" : "bg-[#1D9E75]"
                    )} />
                  </div>
                  <div className="flex-1 pt-px">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-medium", entry.status === "returned" ? "text-gray-400" : "text-gray-800")}>
                        {entry.item_name}
                      </p>
                      {entry.status === "returned" ? (
                        <span className="flex-shrink-0 rounded-full bg-[#FAEEDA] px-2.5 py-0.5 text-xs font-medium text-[#633806]">
                          Returned
                        </span>
                      ) : entry.fit_score != null ? (
                        <span className="flex-shrink-0 font-dm-mono text-sm font-semibold text-[#0F6E56]">
                          {entry.fit_score}%
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(entry.ordered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            Your fit history will appear here after your first order.
          </p>
        )}
      </div>
    </div>
  )
}
