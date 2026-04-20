'use client';

import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function AboutSection() {
  return (
    <section
      id="about"
      className="min-h-screen bg-grid border-t border-slate-200 flex flex-col"
    >
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center max-w-3xl mx-auto w-full">
        <motion.p
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500 mb-5"
        >
          About Drayp
        </motion.p>

        <motion.h2
          custom={1}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05]"
        >
          Shopping, finally{' '}
          <span className="italic text-sky-500">personal.</span>
        </motion.h2>

        <motion.p
          custom={2}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          className="mt-6 text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl"
        >
          Drayp is an AI-powered shopping agent that finds, fits, and curates
          clothing built around you — not the algorithm.
        </motion.p>
      </div>

      {/* Content blocks — no card backgrounds, just text on the grid */}
      <div className="flex-1 px-6 pb-24 max-w-5xl mx-auto w-full space-y-20">

        {/* Our Story */}
        <motion.div
          custom={3}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-500">
            Our Story
          </span>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <p className="text-slate-700 text-lg leading-relaxed">
              Online shopping was supposed to be convenient. Instead, it became
              overwhelming — endless scrolling, inconsistent sizing, clothes that
              look nothing like they did on someone else's body.
            </p>
            <div className="flex flex-col gap-5">
              <p className="text-slate-700 text-lg leading-relaxed">
                We built Drayp because the experience of discovering clothing that
                genuinely fits your life, your body, and your taste should feel
                effortless. Not like a second job.
              </p>
              <p className="text-slate-700 text-lg leading-relaxed">
                Drayp isn't a search engine. It's a personal agent. One that
                understands what you mean when you say{' '}
                <em className="text-slate-900">
                  "something clean, understated, works for a dinner but not too
                  formal"
                </em>{' '}
                — and actually delivers it.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-200" />

        {/* What Makes Us Different */}
        <motion.div
          custom={4}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-500">
            What Makes Us Different
          </span>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <p className="text-slate-700 text-lg leading-relaxed">
              Most shopping tools optimize for clicks. We optimize for fit —
              in every sense of the word.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed">
              Drayp combines semantic AI reasoning with a 3D avatar built from
              your exact measurements. The result is a shortlist of pieces that
              were found <em className="text-slate-900">for you</em> — not just
              for someone like you.
            </p>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-200" />

        {/* Our Belief */}
        <motion.div
          custom={5}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="max-w-2xl"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-500">
            Our Belief
          </span>
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-slate-700 text-lg leading-relaxed">
              Great style shouldn't require expertise, hours, or luck. It should
              come from knowing yourself — and having tools smart enough to
              translate that into something real.
            </p>
            <p className="text-slate-900 font-semibold text-lg leading-snug">
              That's what Drayp is built to do.
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
