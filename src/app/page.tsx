'use client';

import { ShoppingBag } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import AboutSection from '@/components/AboutSection';
import ServicesSection from '@/components/ServicesSection';
import NavHeader from '@/components/ui/nav-header';
import { Button } from '@/components/ui/button';

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.706-.52-1.248-1.342-1.248-.843 0-1.358.542-1.358 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1-.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 h-14 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">Drayp</span>
        </div>
        <NavHeader />
      </header>

      {/* Home / Chat — full viewport height minus header */}
      <section id="home" className="h-[calc(100vh-3.5rem)] bg-grid">
        <ChatInterface />
      </section>

      {/* About */}
      <AboutSection />

      {/* Services */}
      <ServicesSection />

      <footer
        id="contact"
        className="border-t border-slate-200 bg-white px-6 py-10"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-slate-500">
            Questions or partnerships? Reach us on LinkedIn.
          </p>
          <Button
            asChild
            size="icon"
            className="h-11 w-11 shrink-0 rounded-md border-0 bg-[#0A66C2] text-white shadow-sm hover:bg-[#004182] focus-visible:ring-[#0A66C2]"
          >
            <a
              href="https://www.linkedin.com/company/a2a-labs/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Drayp on LinkedIn"
            >
              <LinkedInLogo className="h-6 w-6" />
            </a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
