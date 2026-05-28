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
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 h-14 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-md shadow-brand-500/20">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <span className="font-cormorant text-xl font-semibold italic tracking-tight text-slate-900 leading-none">Drayp</span>
        </div>
        <NavHeader />
      </header>

      {/* Home / Chat — full viewport height minus header, overflow-hidden so the window never scrolls through the chat */}
      <section id="home" className="h-[calc(100vh-3.5rem)] bg-grid overflow-hidden">
        <ChatInterface />
      </section>

      {/* About */}
      <AboutSection />

      {/* Services */}
      <ServicesSection />

      <footer
        id="contact"
        className="border-t border-slate-200/70 bg-white px-6 py-14"
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10">
            {/* Brand column */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-cormorant text-lg font-semibold italic tracking-tight text-slate-900 leading-none">Drayp</span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                AI-powered personal shopping that finds, fits, and curates clothing built around you — not the algorithm.
              </p>
              <p className="text-xs text-slate-400 mt-1">© {new Date().getFullYear()} Drayp. All rights reserved.</p>
            </div>

            {/* Connect column */}
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Connect</p>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-500">Questions or partnerships?</p>
                <Button
                  asChild
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg border-0 bg-[#0A66C2] text-white shadow-sm hover:bg-[#004182] focus-visible:ring-[#0A66C2]"
                >
                  <a
                    href="https://www.linkedin.com/company/a2a-labs/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Drayp on LinkedIn"
                  >
                    <LinkedInLogo className="h-5 w-5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
