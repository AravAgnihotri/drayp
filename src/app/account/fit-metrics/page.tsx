import { cn } from "@/lib/utils"

const METRIC_CARDS = [
  { label: "Avg Fit Score",    value: "91%",  delta: "+3%",  positive: true,  sub: "vs. last month" },
  { label: "Returns Rate",     value: "4%",   delta: "−1%",  positive: true,  sub: "vs. last month" },
  { label: "Recommendations",  value: "47",   delta: null,   positive: null,  sub: "AI-curated picks" },
  { label: "Accepted Picks",   value: "38",   delta: null,   positive: null,  sub: "81% acceptance rate" },
  { label: "Best Category",    value: "Tops", delta: null,   positive: null,  sub: "Highest avg fit score" },
  { label: "Total Orders",     value: "12",   delta: null,   positive: null,  sub: "All time" },
]

const FIT_HISTORY = [
  { item: "Oxford button-down — white",  score: 91, date: "Apr 9, 2025",  returned: false },
  { item: "Slim-fit chinos — navy",      score: 88, date: "Apr 5, 2025",  returned: false },
  { item: "Merino crew-neck sweater",    score: 94, date: "Mar 22, 2025", returned: false },
  { item: "Wool trousers — charcoal",    score: null, date: "Mar 10, 2025", returned: true },
]

export default function FitMetricsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Fit Metrics</h1>
        <p className="mt-1 text-sm text-gray-500">Your personal fit performance over time</p>
      </div>

      {/* Metric cards 2x3 grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {METRIC_CARDS.map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{m.label}</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="font-dm-mono text-3xl font-bold text-gray-900">{m.value}</p>
              {m.delta && (
                <span className={cn(
                  "mb-1 text-xs font-semibold",
                  m.positive ? "text-[#0F6E56]" : "text-rose-600"
                )}>
                  {m.delta}
                </span>
              )}
            </div>
            {m.sub && <p className="mt-1 text-xs text-gray-400">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Fit History timeline */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Fit History</h2>
        </div>
        <div className="relative px-5 py-4">
          {/* vertical line */}
          <div className="absolute left-[28px] top-4 bottom-4 w-px bg-gray-100" />
          <ul className="space-y-5">
            {FIT_HISTORY.map((entry, i) => (
              <li key={i} className="relative flex items-start gap-4">
                {/* dot */}
                <div className={cn(
                  "relative z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 bg-white",
                  entry.returned
                    ? "border-gray-300"
                    : "border-[#1D9E75]"
                )}>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    entry.returned ? "bg-gray-300" : "bg-[#1D9E75]"
                  )} />
                </div>

                <div className="flex-1 pt-px">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-sm font-medium",
                      entry.returned ? "text-gray-400" : "text-gray-800"
                    )}>
                      {entry.item}
                    </p>
                    {entry.returned ? (
                      <span className="flex-shrink-0 rounded-full bg-[#FAEEDA] px-2.5 py-0.5 text-xs font-medium text-[#633806]">
                        Returned
                      </span>
                    ) : (
                      <span className="flex-shrink-0 font-dm-mono text-sm font-semibold text-[#0F6E56]">
                        {entry.score}%
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">{entry.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
