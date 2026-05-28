"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Position = {
  left: number;
  width: number;
  opacity: number;
};

const TABS: { label: string; id: string }[] = [
  { label: "Home",     id: "home" },
  { label: "Account",  id: "account" },
  { label: "About",    id: "about" },
  { label: "Services", id: "services" },
  { label: "Contact",  id: "contact" },
];

function scrollToSection(id: string, router: ReturnType<typeof useRouter>) {
  if (id === "account") {
    router.push("/account");
    return;
  }
  if (id === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function NavHeader() {
  const router = useRouter();
  const [position, setPosition] = useState<Position>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="relative flex w-fit rounded-full border border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm p-1"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {TABS.map((tab) => (
        <Tab key={tab.id} id={tab.id} setPosition={setPosition} onNavigate={(id) => scrollToSection(id, router)}>
          {tab.label}
        </Tab>
      ))}
      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  id,
  setPosition,
  onNavigate,
}: {
  children: React.ReactNode;
  id: string;
  setPosition: React.Dispatch<React.SetStateAction<Position>>;
  onNavigate: (id: string) => void;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  return (
    <li
      ref={ref}
      onClick={() => onNavigate(id)}
      onMouseEnter={() => {
        if (!ref.current) return;
        const { width } = ref.current.getBoundingClientRect();
        setPosition({ width, opacity: 1, left: ref.current.offsetLeft });
      }}
      className="relative z-10 block cursor-pointer px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white mix-blend-difference select-none"
    >
      {children}
    </li>
  );
};

const Cursor = ({ position }: { position: Position }) => {
  return (
    <motion.li
      animate={position}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute z-0 h-[30px] rounded-full bg-slate-900"
    />
  );
};

export default NavHeader;
