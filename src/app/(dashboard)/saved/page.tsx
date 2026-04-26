import { createClient } from "@/lib/supabase/server"
import { Bookmark } from "lucide-react"

export default async function SavedItemsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("saved_items")
    .select("id, item_name, brand, fit_score, is_new_match")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const items = data ?? []
  const newMatchCount = items.filter((i) => i.is_new_match).length

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Saved Items</h1>
        <p className="mt-1 text-sm text-gray-500">
          {items.length > 0
            ? `${items.length} item${items.length === 1 ? "" : "s"}${newMatchCount > 0 ? ` · ${newMatchCount} new match${newMatchCount === 1 ? "" : "es"}` : ""}`
            : "No saved items yet"}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">All Saved Items</h2>
        </div>
        {items.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#E1F5EE]">
                    <Bookmark className="h-4 w-4 text-[#0F6E56]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{item.item_name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {item.brand && <span className="text-xs text-gray-400">{item.brand}</span>}
                      {item.brand && item.fit_score != null && <span className="text-gray-200">·</span>}
                      {item.fit_score != null && (
                        <span className="font-dm-mono text-xs font-medium text-[#0F6E56]">{item.fit_score}% fit</span>
                      )}
                    </div>
                  </div>
                </div>
                {item.is_new_match ? (
                  <span className="flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#E1F5EE] text-[#085041]">
                    New match
                  </span>
                ) : (
                  <span className="flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                    Saved
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            Save items from your Drayp recommendations to see them here.
          </p>
        )}
      </div>
    </div>
  )
}
