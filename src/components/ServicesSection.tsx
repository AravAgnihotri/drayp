'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Globe, Ruler, Shirt, ListFilter } from 'lucide-react';

const services = [
  {
    icon: MessageSquare,
    number: '01',
    title: 'Intent-Driven Discovery',
    headline: 'You describe it. Drayp finds it.',
    body: "Forget filters and dropdown menus. Tell Drayp what you're looking for in plain language — occasion, mood, aesthetic, budget — and it converts your words into a structured search across multiple retailers simultaneously. No compromise, no clutter.",
  },
  {
    icon: Globe,
    number: '02',
    title: 'Cross-Retailer Search',
    headline: 'Every store. One place.',
    body: "Drayp searches across a curated network of retailers in real time, ranking results by relevance to your specific intent. You see the best options across the market — not just what one store happens to carry.",
  },
  {
    icon: Ruler,
    number: '03',
    title: 'Personalized Fit Prediction',
    headline: 'Know before you buy.',
    body: "Using your body measurements or a photo, Drayp builds a precise 3D avatar of you. Every item is evaluated against your proportions before it's ever surfaced — so what you see is what will actually fit.",
  },
  {
    icon: Shirt,
    number: '04',
    title: 'Virtual Try-On',
    headline: 'See it on you, not a model.',
    body: "Drayp's 3D modeling pipeline renders selected pieces on your avatar with physics-based accuracy. Visualize drape, fit, and silhouette — on your body — before committing to a purchase.",
  },
  {
    icon: ListFilter,
    number: '05',
    title: 'Curated Shortlisting',
    headline: 'Less noise. More signal.',
    body: "Rather than presenting hundreds of options, Drayp delivers a tight, ranked shortlist. Every item has passed through intent matching, fit prediction, and semantic relevance scoring. You choose from a selection that's already been edited down to what matters.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ServicesSection() {
  return (
    <section
      id="services"
      className="min-h-screen bg-grid border-t border-slate-200 flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-24 pb-16 max-w-5xl mx-auto w-full">
        <motion.p
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500 mb-5"
        >
          Services
        </motion.p>
        <motion.h2
          custom={1}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05] max-w-xl"
        >
          What Drayp does for you.
        </motion.h2>
        <motion.p
          custom={2}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="mt-5 text-lg text-slate-500 max-w-xl leading-relaxed"
        >
          From intent to wardrobe — every layer of the experience is designed
          to remove friction and add precision.
        </motion.p>
      </div>

      {/* Service list — no card backgrounds */}
      <div className="flex-1 px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="space-y-0 divide-y divide-slate-200">
          {services.map((s, i) => (
            <motion.div
              key={s.number}
              custom={i + 3}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={fadeUp}
              className="grid grid-cols-1 md:grid-cols-[5rem_1fr_2fr] gap-6 py-10 group"
            >
              {/* Number */}
              <span className="text-[11px] font-semibold text-slate-300 tracking-widest pt-1">
                {s.number}
              </span>

              {/* Title + icon */}
              <div className="flex items-start gap-3">
                <s.icon className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-500 mb-1">
                    {s.title}
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 leading-snug">
                    {s.headline}
                  </h3>
                </div>
              </div>

              {/* Body */}
              <p className="text-lg text-slate-500 leading-relaxed">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing line */}
        <motion.p
          custom={services.length + 3}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="mt-16 text-2xl sm:text-3xl font-bold text-slate-900 max-w-xl leading-snug border-t border-slate-200 pt-12"
        >
          Drayp doesn't just help you shop. It helps you{' '}
          <span className="italic text-sky-500">stop</span> shopping — and
          start wearing.
        </motion.p>
      </div>
    </section>
  );
}
