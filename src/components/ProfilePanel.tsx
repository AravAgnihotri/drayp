'use client';

import { useState, useEffect } from 'react';
import { User, Ruler, Palette, Save, Check } from 'lucide-react';
import type { UserProfile, StyleTag } from '@/types';

const STYLE_OPTIONS: StyleTag[] = [
  'casual', 'minimalist', 'athletic', 'streetwear',
  'formal', 'preppy', 'workwear', 'luxury', 'bohemian',
];

const COLOR_OPTIONS = [
  'black', 'white', 'grey', 'navy', 'blue', 'green',
  'brown', 'camel', 'red', 'pink', 'yellow', 'olive',
];

const BRAND_OPTIONS = [
  'Nike', 'Adidas', 'Levi\'s', 'Uniqlo', 'Zara', 'H&M',
  'Ralph Lauren', 'Tommy Hilfiger', 'Supreme', 'Off-White',
  'A.P.C.', 'COS', 'Carhartt WIP', 'Patagonia', 'The North Face',
  'New Balance', 'Vans', 'Converse', 'Common Projects',
];

interface Props {
  onClose?: () => void;
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
      <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">
        Loading profile…
      </div>
    );
  }

  const m = profile.measurements ?? {};
  const prefs = profile.stylePreferences ?? {};

  return (
    <div className="overflow-y-auto space-y-6 pb-6">
      {/* Name */}
      <section>
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">
          <User className="w-3.5 h-3.5" /> Name
        </label>
        <input
          type="text"
          value={profile.name ?? ''}
          onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
          placeholder="Your name"
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-violet-500"
        />
      </section>

      {/* Measurements */}
      <section>
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          <Ruler className="w-3.5 h-3.5" /> Body Measurements
        </label>
        <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs text-zinc-500 mb-1">{label}</label>
              <input
                type="number"
                value={(m as Record<string, number>)[key] ?? ''}
                onChange={e => updateMeasurement(key, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Styles */}
      <section>
        <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          <Palette className="w-3.5 h-3.5" /> Style Preferences
        </label>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map(style => (
            <button
              key={style}
              onClick={() => toggleStyle(style)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                prefs.styles?.includes(style)
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </section>

      {/* Colors */}
      <section>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          Favourite Colors
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(color => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                prefs.favoriteColors?.includes(color)
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </section>

      {/* Brands */}
      <section>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          Favourite Brands
        </label>
        <div className="flex flex-wrap gap-2">
          {BRAND_OPTIONS.map(brand => (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                prefs.favoriteBrands?.includes(brand)
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </section>

      {/* Budget */}
      <section>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">
          Budget Range (USD)
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 mb-1 block">Min $</label>
            <input
              type="number"
              value={prefs.priceMin ?? ''}
              onChange={e => setProfile(p => ({
                ...p,
                stylePreferences: { ...p.stylePreferences, priceMin: parseFloat(e.target.value) || 0 },
              }))}
              placeholder="0"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 mb-1 block">Max $</label>
            <input
              type="number"
              value={prefs.priceMax ?? ''}
              onChange={e => setProfile(p => ({
                ...p,
                stylePreferences: { ...p.stylePreferences, priceMax: parseFloat(e.target.value) || 0 },
              }))}
              placeholder="500"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500"
            />
          </div>
        </div>
      </section>

      {/* Save button */}
      <button
        onClick={save}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-violet-600 hover:bg-violet-500 text-white'
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
