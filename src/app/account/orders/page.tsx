import { StatusBadge, type OrderStatus } from "@/components/ui/status-badge"

const ORDERS: { name: string; id: string; date: string; status: OrderStatus }[] = [
  { name: "Oxford button-down — white",   id: "#DRP-1038", date: "Apr 9, 2025",  status: "in-transit" },
  { name: "Slim-fit chinos — navy",       id: "#DRP-1041", date: "Apr 5, 2025",  status: "delivered"  },
  { name: "Merino crew-neck sweater",     id: "#DRP-1029", date: "Mar 22, 2025", status: "delivered"  },
  { name: "Wool trousers — charcoal",     id: "#DRP-1021", date: "Mar 10, 2025", status: "returned"   },
  { name: "Lightweight puffer — olive",   id: "#DRP-1015", date: "Feb 28, 2025", status: "delivered"  },
  { name: "Canvas sneakers — cream",      id: "#DRP-1008", date: "Feb 14, 2025", status: "delivered"  },
  { name: "French terry hoodie — slate",  id: "#DRP-0992", date: "Jan 30, 2025", status: "delivered"  },
  { name: "Cargo pants — sand",           id: "#DRP-0981", date: "Jan 18, 2025", status: "delivered"  },
]

export default function OrdersPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Orders</h1>
        <p className="mt-1 text-sm text-gray-500">{ORDERS.length} orders total</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">All Orders</h2>
        </div>

        {/* Table header */}
        <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-gray-100 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:grid">
          <span>Item</span>
          <span>Order ID</span>
          <span>Date</span>
          <span>Status</span>
        </div>

        <ul className="divide-y divide-gray-100">
          {ORDERS.map((order) => (
            <li
              key={order.id}
              className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4"
            >
              <p className="text-sm font-medium text-gray-800">{order.name}</p>
              <p className="font-dm-mono text-xs text-gray-400">{order.id}</p>
              <p className="text-xs text-gray-500">{order.date}</p>
              <StatusBadge status={order.status} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
