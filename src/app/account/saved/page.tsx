import { createClient } from "@/lib/supabase/server"
import { Bookmark } from "lucide-react"

export default async function SavedItemsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("saved_items")
    .select("id, title, item_name, source, brand, fit_score, is_new_match, saved_at, created_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false, nullsFirst: false })

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
            {items.map((item) => {
              const displayName = (item.title ?? item.item_name) as string
              const displaySource = (item.source ?? item.brand) as string | null
              const fitScore = item.fit_score as number | null
              const isNew = item.is_new_match as boolean

              return (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#e8f1fd]">
                      <Bookmark className="h-4 w-4 text-[#3a70c0]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{displayName}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {displaySource && (
                          <span className="text-xs text-gray-400">{displaySource}</span>
                        )}
                        {displaySource && fitScore != null && (
                          <span className="text-gray-200">·</span>
                        )}
                        {fitScore != null && (
                          <span className="font-dm-mono text-xs font-medium text-[#3a70c0]">
                            {fitScore}% fit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isNew && (
                    <span className="flex-shrink-0 inline-flex items-center rounded-full bg-[#e8f1fd] px-2.5 py-0.5 text-xs font-medium text-[#2d5ca8]">
                      New match
                    </span>
                  )}
                </li>
              )
            })}
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
