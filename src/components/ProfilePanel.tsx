'use client';

import { useState, useEffect } from 'react';
import { User, Ruler, Palette, Save, Check, DollarSign, Heart } from 'lucide-react';
import type { UserProfile, StyleTag } from '@/types';

const STYLE_OPTIONS: StyleTag[] = [
  'casual', 'minimalist', 'athletic', 'streetwear',
  'formal', 'preppy', 'workwear', 'luxury', 'bohemian',
];

const COLOR_OPTIONS: { name: string; swatch: string }[] = [
  { name: 'black', swatch: 'bg-gray-900' },
  { name: 'white', swatch: 'bg-white' },
  { name: 'grey', swatch: 'bg-gray-400' },
  { name: 'navy', swatch: 'bg-blue-900' },
  { name: 'blue', swatch: 'bg-blue-500' },
  { name: 'green', swatch: 'bg-emerald-500' },
  { name: 'brown', swatch: 'bg-amber-800' },
  { name: 'camel', swatch: 'bg-amber-300' },
  { name: 'red', swatch: 'bg-red-500' },
  { name: 'pink', swatch: 'bg-pink-400' },
  { name: 'yellow', swatch: 'bg-yellow-400' },
  { name: 'olive', swatch: 'bg-lime-700' },
];

const BRAND_OPTIONS = [
  'Nike', 'Adidas', "Levi's", 'Uniqlo', 'Zara', 'H&M',
  'Ralph Lauren', 'Tommy Hilfiger', 'Supreme', 'Off-White',
  'A.P.C.', 'COS', 'Carhartt WIP', 'Patagonia', 'The North Face',
  'New Balance', 'Vans', 'Converse', 'Common Projects',
];

interface Props {
  onClose?: () => void;
}

function SectionHeader({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        <Icon className="w-3 h-3 text-brand-400" />
      </div>
      <span className="text-xs font-semibold text-slate-300 tracking-wide">{children}</span>
    </div>
  );
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[11px] text-slate-500 mb-1.5 font-medium">{label}</label>
      <input
        {...props}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-brand-500/40 transition-colors duration-200"
      />
    </div>
  );
}

export default function ProfilePanel({ onClose }: Props) {
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateMeasurement = (key: string, value: string) => {
    const num = parseFloat(value);
    setProfile(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [key]: isNaN(num) ? undefined : num,
      },
    }));
  };

  const toggleStyle = (style: StyleTag) => {
    setProfile(prev => {
      const styles = prev.stylePreferences?.styles ?? [];
      const next = styles.includes(style)
        ? styles.filter(s => s !== style)
        : [...styles, style];
      return { ...prev, stylePreferences: { ...prev.stylePreferences, styles: next } };
    });
  };

  const toggleColor = (color: string) => {
    setProfile(prev => {
      const colors = prev.stylePreferences?.favoriteColors ?? [];
      const next = colors.includes(color)
        ? colors.filter(c => c !== color)
        : [...colors, color];
      return { ...prev, stylePreferences: { ...prev.stylePreferences, favoriteColors: next } };
    });
  };

  const toggleBrand = (brand: string) => {
    setProfile(prev => {
      const brands = prev.stylePreferences?.favoriteBrands ?? [];
      const next = brands.includes(brand)
        ? brands.filter(b => b !== brand)
        : [...brands, brand];
      return { ...prev, stylePreferences: { ...prev.stylePreferences, favoriteBrands: next } };
    });
  };

  const save = async () => {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose?.(); }, 1200);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-brand-400 loading-dot" />
          <div className="w-2 h-2 rounded-full bg-brand-400 loading-dot" />
          <div className="w-2 h-2 rounded-full bg-brand-400 loading-dot" />
        </div>
      </div>
    );
  }

  const m = profile.measurements ?? {};
  const prefs = profile.stylePreferences ?? {};

  return (
    <div className="overflow-y-auto space-y-6 pb-6">
      {/* Name */}
      <section>
        <SectionHeader icon={User}>Name</SectionHeader>
        <input
          type="text"
          value={profile.name ?? ''}
          onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
          placeholder="Your name"
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-brand-500/40 transition-colors duration-200"
        />
      </section>

      {/* Measurements */}
      <section>
        <SectionHeader icon={Ruler}>Body Measurements</SectionHeader>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { key: 'height', label: 'Height (cm)', placeholder: '180' },
            { key: 'weight', label: 'Weight (kg)', placeholder: '78' },
            { key: 'chest', label: 'Chest (cm)', placeholder: '97' },
            { key: 'waist', label: 'Waist (cm)', placeholder: '81' },
            { key: 'hips', label: 'Hips (cm)', placeholder: '97' },
            { key: 'inseam', label: 'Inseam (cm)', placeholder: '81' },
            { key: 'shoeSize', label: 'Shoe Size (US)', placeholder: '10' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className={key === 'shoeSize' ? 'col-span-2 sm:col-span-1' : ''}>
              <InputField
                label={label}
                type="number"
                value={(m as Record<string, number>)[key] ?? ''}
                onChange={e => updateMeasurement(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Styles */}
      <section>
        <SectionHeader icon={Palette}>Style Preferences</SectionHeader>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_OPTIONS.map(style => {
            const active = prefs.styles?.includes(style);
            return (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 capitalize ${
                  active
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                    : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-300'
                }`}
              >
                {style}
              </button>
            );
          })}
        </div>
      </section>

      {/* Colors */}
      <section>
        <SectionHeader icon={Palette}>Favourite Colors</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(({ name, swatch }) => {
            const active = prefs.favoriteColors?.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggleColor(name)}
                title={name}
                className={`relative w-8 h-8 rounded-lg transition-all duration-200 ${
                  active
                    ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-950 scale-110'
                    : 'ring-1 ring-white/[0.08] hover:ring-white/[0.2] hover:scale-105'
                }`}
              >
                <div className={`w-full h-full rounded-lg ${swatch}`} />
                {active && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className={`w-3.5 h-3.5 ${name === 'white' || name === 'yellow' || name === 'camel' ? 'text-slate-900' : 'text-white'} drop-shadow-md`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Brands */}
      <section>
        <SectionHeader icon={Heart}>Favourite Brands</SectionHeader>
        <div className="flex flex-wrap gap-1.5">
          {BRAND_OPTIONS.map(brand => {
            const active = prefs.favoriteBrands?.includes(brand);
            return (
              <button
                key={brand}
                onClick={() => toggleBrand(brand)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                    : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] hover:text-slate-300'
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </section>

      {/* Budget */}
      <section>
        <SectionHeader icon={DollarSign}>Budget Range (USD)</SectionHeader>
        <div className="flex items-center gap-2.5">
          <InputField
            label="Min $"
            type="number"
            value={prefs.priceMin ?? ''}
            onChange={e => setProfile(p => ({
              ...p,
              stylePreferences: { ...p.stylePreferences, priceMin: parseFloat(e.target.value) || 0 },
            }))}
            placeholder="0"
          />
          <span className="text-slate-600 mt-5">—</span>
          <InputField
            label="Max $"
            type="number"
            value={prefs.priceMax ?? ''}
            onChange={e => setProfile(p => ({
              ...p,
              stylePreferences: { ...p.stylePreferences, priceMax: parseFloat(e.target.value) || 0 },
            }))}
            placeholder="500"
          />
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={save}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
          saved
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-400/30'
        }`}
      >
        {saved ? (
          <><Check className="w-4 h-4" /> Saved!</>
        ) : (
          <><Save className="w-4 h-4" /> Save Profile</>
        )}
      </button>
    </div>
  );
}
