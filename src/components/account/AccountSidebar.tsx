"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  LayoutGrid, UserRound, BarChart3, Package, Bookmark,
  SlidersHorizontal, User, CreditCard, ShoppingBag,
  ChevronLeft, ChevronRight, LogOut,
} from "lucide-react"
import { useIsMobile } from "@/components/hooks/use-mobile"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Navigation",
    items: [
      { label: "Dashboard",   icon: LayoutGrid,        href: "/dashboard" },
      { label: "Body Lab",    icon: UserRound,         href: "/body-lab",    badge: "New" },
      { label: "Fit Metrics", icon: BarChart3,         href: "/fit-metrics" },
      { label: "My Orders",   icon: Package,           href: "/orders" },
      { label: "Saved Items", icon: Bookmark,          href: "/saved",       badge: "4" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Preferences", icon: SlidersHorizontal, href: "/preferences" },
      { label: "Profile",     icon: User,              href: "/profile" },
      { label: "Billing",     icon: CreditCard,        href: "/billing" },
    ],
  },
]

type UserDisplay = { initials: string; name: string; plan: string }

export function AccountSidebar() {
  const pathname         = usePathname()
  const router           = useRouter()
  const isMobile         = useIsMobile()
  const [manualCollapsed, setManualCollapsed] = useState(false)
  const [userDisplay,     setUserDisplay]     = useState<UserDisplay>({
    initials: "DR",
    name:     "Loading…",
    plan:     "Pro Plan",
  })
  const [signingOut, setSigningOut] = useState(false)
  const collapsed = isMobile || manualCollapsed
  const supabase  = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, plan")
        .eq("id", user.id)
        .single()

      const name = profile?.full_name || user.email?.split("@")[0] || "User"
      const initials = name
        .split(" ")
        .map((n: string) => n[0] ?? "")
        .join("")
        .toUpperCase()
        .slice(0, 2)
      const plan = profile?.plan === "pro" ? "Pro Plan" : "Free Plan"
      setUserDisplay({ initials, name, plan })
    }
    loadUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-in-out",
        collapsed ? "w-14" : "w-[220px]"
      )}
    >
      {/* ── Logo / header ── */}
      <div
        className={cn(
          "flex h-12 flex-shrink-0 items-center border-b border-gray-100 px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] text-white shadow-sm">
            <ShoppingBag className="h-3.5 w-3.5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-gray-900">Drayp</p>
              <p className="truncate text-[10px] text-gray-400">AI Shopping</p>
            </div>
          )}
        </Link>

        {!isMobile && (
          <button
            onClick={() => setManualCollapsed(!manualCollapsed)}
            className={cn(
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600",
              collapsed && "ml-0"
            )}
            aria-label={manualCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {manualCollapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft  className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* ── Nav groups ── */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={cn("mb-1", gi > 0 && "mt-1 border-t border-gray-100 pt-1")}>
            {!collapsed && (
              <p className="mb-0.5 px-4 pt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon   = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[#E1F5EE] text-[#0F6E56]"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                        collapsed && "justify-center"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0", active && "text-[#0F6E56]")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "ml-auto inline-flex h-4 items-center rounded-full px-1.5 text-[10px] font-semibold",
                                item.badge === "New"
                                  ? "bg-[#1D9E75] text-white"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User pill ── */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        <div className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          {/* Avatar */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] text-xs font-semibold text-white">
            {userDisplay.initials}
          </div>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{userDisplay.name}</p>
                <p className="truncate text-xs text-gray-400">{userDisplay.plan}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                title="Sign out"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                {signingOut
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  : <LogOut className="h-3.5 w-3.5" />}
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
