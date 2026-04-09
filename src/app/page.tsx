'use client';

import { useState } from 'react';
import { ShoppingBag, User, X, Menu } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ProfilePanel from '@/components/ProfilePanel';

export default function Home() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-white font-bold tracking-tight">Drayp</span>
            <span className="ml-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5 hidden sm:inline">
              AI Shopping Agent
            </span>
          </div>
        </div>

        <button
          onClick={() => setProfileOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm transition-colors"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">My Profile</span>
        </button>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat area */}
        <main className="flex-1 overflow-hidden">
          <ChatInterface />
        </main>

        {/* Profile sidebar — slide in on desktop, overlay on mobile */}
        {profileOpen && (
          <>
            {/* Mobile overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
              onClick={() => setProfileOpen(false)}
            />
            {/* Panel */}
            <aside className="
              fixed right-0 top-14 bottom-0 w-80 bg-zinc-950 border-l border-zinc-800
              overflow-y-auto px-4 pt-5 z-30
              lg:relative lg:top-auto lg:bottom-auto lg:z-auto
              animate-slide-up
            ">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-white">Your Style Profile</h2>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ProfilePanel onClose={() => setProfileOpen(false)} />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
