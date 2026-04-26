import { createClient } from "@/lib/supabase/server"
import { StatusBadge, type OrderStatus } from "@/components/ui/status-badge"

export default async function OrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("orders")
    .select("id, item_name, order_number, ordered_at, status")
    .eq("user_id", user.id)
    .order("ordered_at", { ascending: false })

  const orders = data ?? []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          {orders.length > 0
            ? `${orders.length} order${orders.length === 1 ? "" : "s"} total`
            : "No orders yet"}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">All Orders</h2>
        </div>
        {orders.length > 0 ? (
          <>
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-gray-100 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:grid">
              <span>Item</span>
              <span>Order ID</span>
              <span>Date</span>
              <span>Status</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {orders.map((order) => (
                <li key={order.id} className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4">
                  <p className="text-sm font-medium text-gray-800">{order.item_name}</p>
                  <p className="font-dm-mono text-xs text-gray-400">#{order.order_number}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.ordered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <StatusBadge status={order.status as OrderStatus} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-gray-400">
            Your orders will appear here once you start shopping.
          </p>
        )}
      </div>
    </div>
  )
}
