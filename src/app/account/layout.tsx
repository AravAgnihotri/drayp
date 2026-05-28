import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { createClient } from "@/lib/supabase/server"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/account/dashboard")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] font-dm-sans">
      <AccountSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center border-b border-gray-200 bg-white px-5">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-[#3a70c0]/30 hover:bg-[#eef4fd] hover:text-[#3a70c0] hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to <span className="font-semibold text-[#3a70c0]">Drayp</span>
          </Link>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
