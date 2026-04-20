import { Bookmark } from "lucide-react"

type MatchBadge = "new-match" | "review-fit"

const SAVED_ITEMS: {
  name: string
  brand: string
  fitScore: number
  badge: MatchBadge
}[] = [
  { name: "Slim Oxford Shirt",        brand: "& Other Stories", fitScore: 94, badge: "new-match"  },
  { name: "Tapered Linen Trousers",   brand: "COS",             fitScore: 91, badge: "review-fit" },
  { name: "Merino Polo",              brand: "Everlane",        fitScore: 96, badge: "new-match"  },
  { name: "Ripstop Cargo Pants",      brand: "Norse Projects",  fitScore: 88, badge: "review-fit" },
  { name: "Brushed Flannel Shirt",    brand: "J.Crew",          fitScore: 93, badge: "new-match"  },
  { name: "Straight-leg Chinos",      brand: "Todd Snyder",     fitScore: 90, badge: "review-fit" },
]

const BADGE_CONFIG: Record<MatchBadge, { label: string; className: string }> = {
  "new-match":  { label: "New match",  className: "bg-[#E1F5EE] text-[#085041]" },
  "review-fit": { label: "Review fit", className: "bg-gray-100 text-gray-600"   },
}

export default function SavedItemsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Saved Items</h1>
        <p className="mt-1 text-sm text-gray-500">
          {SAVED_ITEMS.length} items · {SAVED_ITEMS.filter((i) => i.badge === "new-match").length} new matches
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">All Saved Items</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {SAVED_ITEMS.map((item) => {
            const badge = BADGE_CONFIG[item.badge]
            return (
              <li key={`${item.name}-${item.brand}`} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#E1F5EE]">
                    <Bookmark className="h-4 w-4 text-[#0F6E56]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-gray-400">{item.brand}</span>
                      <span className="text-gray-200">·</span>
                      <span className="font-dm-mono text-xs font-medium text-[#0F6E56]">
                        {item.fitScore}% fit
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
