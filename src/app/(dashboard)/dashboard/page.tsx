import { StatCard } from "@/components/ui/stat-card"
import { FitBar } from "@/components/ui/fit-bar"
import { StatusBadge, type OrderStatus } from "@/components/ui/status-badge"

// TODO: replace with real data from Supabase orders + saved_items tables
const RECENT_ORDERS: { name: string; id: string; date: string; status: OrderStatus }[] = [
  { name: "Oxford button-down — white", id: "#DRP-1038", date: "Apr 9, 2025",  status: "in-transit" },
  { name: "Slim-fit chinos — navy",     id: "#DRP-1041", date: "Apr 5, 2025",  status: "delivered"  },
  { name: "Merino crew-neck sweater",   id: "#DRP-1029", date: "Mar 22, 2025", status: "delivered"  },
]

const FIT_CATEGORIES = [
  { label: "Tops",      value: 94 },
  { label: "Bottoms",   value: 88 },
  { label: "Outerwear", value: 91 },
  { label: "Footwear",  value: 85 },
]

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your Drayp activity</p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Orders"  value={12}   sub="2 in progress" />
        <StatCard label="Saved Items"   value={34}   sub="4 new matches" />
        <StatCard label="Fit Score Avg" value="91%"  sub="Across all categories" valueClassName="text-[#0F6E56]" />
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {RECENT_ORDERS.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{order.name}</p>
                  <p className="mt-0.5 font-dm-mono text-xs text-gray-400">
                    {order.id} · {order.date}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </li>
            ))}
          </ul>
        </div>

        {/* Fit Score by Category */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900">Fit Score by Category</h2>
          </div>
          <div className="space-y-5 p-5">
            {FIT_CATEGORIES.map((cat) => (
              <FitBar key={cat.label} label={cat.label} value={cat.value} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
