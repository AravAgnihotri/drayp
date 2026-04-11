'use client';

import { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────── */

const MARQUEE_ITEMS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Biotechnology',
  'Climate Tech',
  'Product Design',
  'Entrepreneurship',
  'Web Development',
  'Neurotechnology',
  'Innovation',
  'Deep Tech',
  'TKS Student',
  'Young Innovator',
];

const PROJECTS = [
  {
    num: '01',
    title: 'Drayp',
    category: 'AI · Shopping',
    desc: 'Conversational AI shopping agent that finds clothing matching your style, body, and budget through natural language.',
    tags: ['Next.js', 'OpenAI', 'TypeScript'],
    year: '2024',
    href: 'https://github.com/AravAgnihotri/drayp',
  },
  {
    num: '02',
    title: 'Neural Health',
    category: 'ML · Healthcare',
    desc: 'Machine learning model for predictive health analytics using wearable sensor data to surface actionable insights.',
    tags: ['Python', 'TensorFlow', 'Healthcare'],
    year: '2024',
    href: '#',
  },
  {
    num: '03',
    title: 'Satellite Watch',
    category: 'Vision · Climate',
    desc: 'Computer vision pipeline for real-time satellite imagery analysis to track deforestation and environmental change.',
    tags: ['Computer Vision', 'Python', 'Climate'],
    year: '2023',
    href: '#',
  },
];

const FOCUS_AREAS = [
  { icon: '◈', label: 'Artificial Intelligence' },
  { icon: '◈', label: 'Biotechnology' },
  { icon: '◈', label: 'Climate Tech' },
  { icon: '◈', label: 'Product Design' },
];

const SOCIAL_LINKS = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/aravagnihotri' },
  { label: 'Twitter',  href: 'https://twitter.com/aravagnihotri' },
  { label: 'GitHub',   href: 'https://github.com/AravAgnihotri' },
];

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */

export default function Home() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* close mobile menu on outside scroll */
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="bg-black text-white min-h-screen overflow-x-hidden">

      {/* ══════════════════════════════════════════
          NAV
      ══════════════════════════════════════════ */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-black/85 backdrop-blur-lg border-b border-white/[0.06]' : ''
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <a
            href="#"
            className="font-display text-xs font-bold tracking-[0.18em] uppercase select-none"
          >
            Arav Agnihotri
          </a>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-10">
            {['About', 'Work', 'Contact'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-xs text-white/40 hover:text-white tracking-[0.12em] uppercase transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Mobile burger */}
          <button
            className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 relative"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation"
          >
            <span
              className={`block h-px bg-white transition-all duration-300 origin-center ${
                menuOpen ? 'rotate-45 translate-y-[5px] w-6' : 'w-6'
              }`}
            />
            <span
              className={`block h-px bg-white transition-all duration-300 origin-center ${
                menuOpen ? '-rotate-45 -translate-y-[3px] w-6' : 'w-5'
              }`}
            />
          </button>
        </div>

        {/* Mobile menu overlay */}
        <div
          className={`md:hidden bg-black border-t border-white/[0.06] transition-all duration-400 overflow-hidden ${
            menuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-6 py-8 space-y-7">
            {['About', 'Work', 'Contact'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="block font-display text-3xl font-bold tracking-tight"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col justify-between px-6 md:px-12 pt-28 md:pt-36 pb-10">
        <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col justify-center">

          {/* Status pill */}
          <div className="mb-8 fade-up delay-0">
            <span className="inline-flex items-center gap-2.5 text-[10px] tracking-[0.2em] uppercase text-white/40 border border-white/[0.08] rounded-full px-4 py-2">
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400"
                style={{ boxShadow: '0 0 6px #4ade80, 0 0 12px #4ade8080' }}
              />
              Available &nbsp;·&nbsp; TKS Student
            </span>
          </div>

          {/* Display name */}
          <h1
            className="font-display font-extrabold uppercase leading-[0.88] tracking-tighter"
            style={{ fontSize: 'clamp(4rem, 13vw, 13.5rem)' }}
          >
            <span className="block overflow-hidden">
              <span className="block fade-up delay-1">Arav</span>
            </span>
            <span className="block overflow-hidden">
              <span className="block text-outline fade-up delay-2">Agnihotri</span>
            </span>
          </h1>

          {/* Tagline + CTAs */}
          <div className="mt-10 md:mt-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <p className="text-base md:text-lg text-white/40 max-w-xs md:max-w-sm leading-relaxed fade-up delay-3">
              Young innovator exploring the intersection of
              technology, design, and human potential.
            </p>
            <div className="flex gap-3 fade-up delay-4">
              <a
                href="#work"
                className="inline-flex items-center px-6 py-3 bg-white text-black text-xs font-bold tracking-[0.1em] uppercase hover:bg-white/85 transition-colors duration-200"
              >
                View Work
              </a>
              <a
                href="#contact"
                className="inline-flex items-center px-6 py-3 border border-white/15 text-white text-xs font-bold tracking-[0.1em] uppercase hover:border-white/40 transition-colors duration-200"
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        {/* Bottom scroll cue */}
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between mt-10 fade-up delay-5">
          <div className="flex items-center gap-3 text-white/20">
            <div className="w-8 h-px bg-white/20" />
            <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/20">2024</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════ */}
      <div className="py-5 border-y border-white/[0.06] overflow-hidden select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-5 px-2">
              <span className="text-[10px] tracking-[0.22em] uppercase text-white/25 font-medium">
                {item}
              </span>
              <span className="text-white/10">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ABOUT
      ══════════════════════════════════════════ */}
      <section id="about" className="py-28 md:py-44 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20">

            {/* Label */}
            <div className="md:col-span-4 md:pt-2">
              <span className="text-[10px] tracking-[0.22em] uppercase text-white/25">About</span>
            </div>

            {/* Content */}
            <div className="md:col-span-8">
              <h2
                className="font-display font-bold leading-tight tracking-tight mb-10"
                style={{ fontSize: 'clamp(2.2rem, 5vw, 4.5rem)' }}
              >
                Young innovator<br />building tomorrow
              </h2>

              <div className="space-y-5 text-white/45 text-base md:text-lg leading-relaxed">
                <p>
                  I&apos;m Arav — a student at The Knowledge Society (TKS), an accelerator for
                  ambitious young people working at the frontier of technology. My driving
                  curiosity lives at the intersection of emerging tech and real-world impact.
                </p>
                <p>
                  From artificial intelligence to biotechnology, I explore the spaces where
                  bold ideas meet the tools to make them real. I build projects, think deeply
                  about the future, and connect with people who care about where we&apos;re headed.
                </p>
              </div>

              {/* Focus areas */}
              <div className="mt-10 grid grid-cols-2 gap-3">
                {FOCUS_AREAS.map(f => (
                  <div
                    key={f.label}
                    className="flex items-center gap-3 border border-white/[0.06] px-4 py-3"
                  >
                    <span className="text-white/20 text-xs">{f.icon}</span>
                    <span className="text-xs tracking-[0.12em] uppercase text-white/40">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 md:gap-10 mt-14 pt-10 border-t border-white/[0.06]">
                {[
                  { val: '10+', lbl: 'Projects' },
                  { val: '2+',  lbl: 'Years at TKS' },
                  { val: '∞',   lbl: 'Curiosity' },
                ].map(s => (
                  <div key={s.lbl}>
                    <div className="font-display text-4xl md:text-5xl font-bold mb-1">{s.val}</div>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-white/25">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WORK
      ══════════════════════════════════════════ */}
      <section id="work" className="py-28 md:py-44 px-6 md:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto">

          {/* Section header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-14">
            <div className="md:col-span-4 md:pt-2">
              <span className="text-[10px] tracking-[0.22em] uppercase text-white/25">Work</span>
            </div>
            <div className="md:col-span-8">
              <h2
                className="font-display font-bold leading-tight tracking-tight"
                style={{ fontSize: 'clamp(2.2rem, 5vw, 4.5rem)' }}
              >
                Selected Projects
              </h2>
            </div>
          </div>

          {/* Project list */}
          <div className="divide-y divide-white/[0.05]">
            {PROJECTS.map(p => (
              <a
                key={p.num}
                href={p.href}
                className="project-row group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-9 -mx-6 md:-mx-12 px-6 md:px-12"
              >
                {/* Number */}
                <div className="md:col-span-1 hidden md:block text-xs font-mono text-white/20 mt-1">
                  {p.num}
                </div>

                {/* Title + category */}
                <div className="md:col-span-3">
                  <h3 className="project-title font-display text-2xl md:text-3xl font-bold mb-1">
                    {p.title}
                  </h3>
                  <span className="text-[10px] tracking-[0.15em] uppercase text-white/30">
                    {p.category}
                  </span>
                </div>

                {/* Description + tags */}
                <div className="md:col-span-5">
                  <p className="text-white/40 text-sm leading-relaxed mb-4">{p.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] tracking-[0.1em] uppercase text-white/25 border border-white/[0.08] px-2.5 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Year + arrow */}
                <div className="md:col-span-3 flex md:justify-end items-start gap-3 mt-1">
                  <span className="text-xs font-mono text-white/20">{p.year}</span>
                  <span className="project-arrow text-white/20 text-lg leading-none">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════ */}
      <section
        id="contact"
        className="py-28 md:py-44 px-6 md:px-12 border-t border-white/[0.06] overflow-hidden"
      >
        <div className="max-w-[1400px] mx-auto">
          <span className="text-[10px] tracking-[0.22em] uppercase text-white/25 block mb-10">
            Contact
          </span>

          {/* Big CTA text */}
          <h2
            className="font-display font-extrabold uppercase leading-[0.88] tracking-tighter mb-16"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 11rem)' }}
          >
            Let&apos;s<br />
            <span className="text-outline">Connect</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
            <p className="text-white/40 text-base md:text-lg leading-relaxed">
              Open to collaborations, conversations,<br className="hidden md:block" />
              and building the future together.
            </p>

            <div className="flex flex-col items-start md:items-end gap-6">
              <a
                href="mailto:hello@aravagnihotri.com"
                className="group flex items-center gap-3 text-xl md:text-2xl font-medium border-b border-white/15 pb-1 hover:border-white/50 transition-colors duration-200"
              >
                hello@aravagnihotri.com
                <span className="text-white/30 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </a>
              <div className="flex items-center gap-8">
                {SOCIAL_LINKS.map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-[0.18em] uppercase text-white/30 hover:text-white/70 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="py-8 px-6 md:px-12 border-t border-white/[0.06]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-[10px] tracking-[0.12em] uppercase text-white/20">
            © 2024 Arav Agnihotri
          </span>
          <span className="text-[10px] tracking-[0.12em] uppercase text-white/20">
            Young Innovator &amp; TKS Student
          </span>
        </div>
      </footer>

    </div>
  );
}
