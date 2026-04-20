'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  Sparkles,
  ShoppingBag,
  Square,
  Zap,
  TrendingUp,
  Shirt,
  Footprints,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage, ChatResponse } from '@/types';
import ProductGrid from './ProductGrid';

/** Renders assistant/user text with real paragraph breaks (split on blank lines). */
function MessageContent({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const blocks = trimmed.split(/\n\n+/);
  if (blocks.length === 1) {
    return <div className="whitespace-pre-line">{blocks[0]}</div>;
  }
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => (
        <p key={i} className="whitespace-pre-line m-0">
          {block}
        </p>
      ))}
    </div>
  );
}

const SUGGESTIONS = [
  {
    icon: Shirt,
    text: 'Find slim jeans that actually fit my waist and inseam',
    color: 'from-sky-500/20 to-sky-600/10',
  },
  {
    icon: Footprints,
    text: 'White sneakers under $120 with free returns',
    color: 'from-violet-500/20 to-violet-600/10',
  },
  {
    icon: TrendingUp,
    text: 'Plan a minimalist fall capsule wardrobe for work',
    color: 'from-emerald-500/20 to-emerald-600/10',
  },
  {
    icon: Zap,
    text: 'Athletic shorts that work for gym and weekends',
    color: 'from-amber-500/20 to-amber-600/10',
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [input]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data: ChatResponse | { error: string } = await res.json();

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'error' in data ? (data as { error: string }).error : data.message,
        products: 'products' in data ? data.products : undefined,
        intent: 'intent' in data ? data.intent : undefined,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative flex flex-col items-center justify-center min-h-full px-4 sm:px-6"
            >
              {/* Hero content */}
              <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8 py-12 sm:py-16">
                <div className="flex flex-col items-center gap-4 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-sky-600 text-sm font-medium tracking-widest uppercase">
                    <Sparkles className="w-4 h-4" />
                    <span>AI-Powered Fit</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-center leading-[1.15] text-slate-900 max-w-2xl">
                    Find clothes that actually{' '}
                    <span className="text-sky-500">fit</span>
                    {' '}your body.
                  </h1>
                  <p className="max-w-md text-center text-base sm:text-lg text-slate-500 leading-relaxed">
                    Tell us what you need — we&apos;ll find pieces that match your style and measurements.
                  </p>
                </div>

                {/* Input area */}
                <div className="w-full max-w-xl animate-fade-in-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400/30 via-sky-300/10 to-sky-400/30 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
                    <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm group-focus-within:border-sky-400/60 transition-colors duration-300">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe what you're looking for..."
                        rows={1}
                        className="w-full bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 px-5 pt-4 pb-2 resize-none outline-none min-h-[52px] max-h-[160px]"
                      />
                      <div className="flex items-center justify-between px-4 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                            <Sparkles className="w-3 h-3 text-sky-500" aria-hidden />
                            Drayp Fit Agent
                          </span>
                        </div>
                        <button
                          onClick={() => sendMessage(input)}
                          disabled={!input.trim() || loading}
                          className="h-8 w-8 rounded-lg bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 shadow-md shadow-sky-500/20 disabled:shadow-none"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Suggestion cards */}
                <div className="w-full max-w-xl animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
                  <p className="text-center text-xs text-slate-400 mb-4 tracking-wide">Try one of these</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.text}
                        type="button"
                        onClick={() => sendMessage(s.text)}
                        className="group/card relative text-left text-[13px] text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-3.5 transition-all duration-200 shadow-sm"
                      >
                        <div className="relative flex items-start gap-3">
                          <s.icon className="w-4 h-4 text-slate-400 group-hover/card:text-sky-500 transition-colors mt-0.5 flex-shrink-0" />
                          <span className="leading-snug">{s.text}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 sm:px-6 py-6 space-y-5 max-w-3xl mx-auto"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0.05 : 0 }}
                  className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[80%] sm:max-w-[70%]">
                      <div className="bg-sky-500 text-white rounded-2xl rounded-br-md px-4 py-3 text-[14px] leading-relaxed shadow-sm">
                        <MessageContent text={msg.content} />
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-full w-full">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 text-[14px] text-slate-700 leading-relaxed shadow-sm">
                            <MessageContent text={msg.content} />
                          </div>
                          {msg.products && msg.products.length > 0 && (
                            <div className="mt-4">
                              <ProductGrid products={msg.products} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <span className="text-[11px] text-slate-400 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}

              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-sky-400 loading-dot" />
                          <div className="w-2 h-2 rounded-full bg-sky-400 loading-dot" />
                          <div className="w-2 h-2 rounded-full bg-sky-400 loading-dot" />
                        </div>
                        <span className="text-sm text-slate-500">Finding your perfect fits...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom input bar (after conversation starts) */}
      {hasMessages && (
        <div className="flex-shrink-0 border-t border-slate-200 bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400/20 via-transparent to-sky-400/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
              <div className="relative flex items-end bg-white border border-slate-200 rounded-xl shadow-sm group-focus-within:border-sky-400/60 transition-colors duration-300 overflow-hidden">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Refine the fit, budget, or vibe..."
                  rows={1}
                  className="flex-1 bg-transparent text-[14px] text-slate-900 placeholder:text-slate-400 px-4 py-3 resize-none outline-none min-h-[44px] max-h-[120px]"
                />
                <div className="flex items-center gap-2 pr-3 pb-2.5">
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() && !loading}
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                  >
                    {loading ? (
                      <Square className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              <kbd className="text-slate-400">Enter</kbd> to send · <kbd className="text-slate-400">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
