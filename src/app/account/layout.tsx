import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { AccountSidebar } from "@/components/account/AccountSidebar"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] font-dm-sans">
      <AccountSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-12 flex-shrink-0 items-center border-b border-gray-200 bg-white px-5">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Drayp
          </Link>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
