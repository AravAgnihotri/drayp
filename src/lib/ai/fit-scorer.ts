import type { Product, UserMeasurements, FitLabel } from '@/types';

// ─── Size Charts ──────────────────────────────────────────────────────────────

/** Chest range (cm) for each alpha size */
const TOPS_CHART: Record<string, { min: number; max: number }> = {
  XS:   { min: 76,  max: 86  },
  S:    { min: 86,  max: 91  },
  M:    { min: 91,  max: 97  },
  L:    { min: 97,  max: 102 },
  XL:   { min: 102, max: 108 },
  XXL:  { min: 108, max: 114 },
  XXXL: { min: 114, max: 124 },
};

const TOPS_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/** Returns the recommended alpha size for a chest measurement */
function recommendedTopSize(chestCm: number): string {
  for (const [size, range] of Object.entries(TOPS_CHART)) {
    if (chestCm >= range.min && chestCm < range.max) return size;
  }
  return chestCm < 76 ? 'XS' : 'XXXL';
}

function topsScore(product: Product, measurements: Partial<UserMeasurements>): number {
  if (!measurements.chest) return 85;

  const rec = recommendedTopSize(measurements.chest);
  const recIdx = TOPS_SIZE_ORDER.indexOf(rec);

  if (product.sizes.includes(rec)) return 95;

  // Check how far the available sizes are from the recommended one
  let minOffset = Infinity;
  for (const size of product.sizes) {
    const idx = TOPS_SIZE_ORDER.indexOf(size);
    if (idx !== -1) minOffset = Math.min(minOffset, Math.abs(idx - recIdx));
  }

  if (minOffset === Infinity) return 85;           // sizes listed differently
  if (minOffset === 1)        return 75;
  if (minOffset === 2)        return 55;
  return 35;
}

/** Waist (inches) for numeric pant sizes */
const PANTS_WAIST_CM: Record<string, number> = {
  '26': 66, '27': 69, '28': 71, '29': 74, '30': 76,
  '31': 79, '32': 81, '33': 84, '34': 86, '36': 91,
  '38': 97, '40': 102,
};

function bottomsScore(product: Product, measurements: Partial<UserMeasurements>): number {
  if (!measurements.waist) return 85;

  const waistCm = measurements.waist;

  // Numeric sizes (jeans/chinos)
  const numericSizes = product.sizes.filter(s => /^\d{2}$/.test(s));
  if (numericSizes.length > 0) {
    const diffs = numericSizes.map(s => {
      const sizeCm = PANTS_WAIST_CM[s];
      if (!sizeCm) return Infinity;
      return Math.abs(sizeCm - waistCm);
    });
    const minDiff = Math.min(...diffs);
    if (minDiff <= 2)  return 95;
    if (minDiff <= 4)  return 82;
    if (minDiff <= 7)  return 65;
    if (minDiff <= 10) return 48;
    return 30;
  }

  // Alpha sizes — fall back to treating waist like a chest for the tops chart
  return topsScore(product, { chest: waistCm });
}

function shoesScore(product: Product, measurements: Partial<UserMeasurements>): number {
  if (!measurements.shoeSize) return 85;

  const size = measurements.shoeSize;
  const asStrings = [String(size), String(size + 0.5), String(size - 0.5)];

  if (product.sizes.some(s => asStrings.includes(s))) return 97;
  if (product.sizes.includes('one-size') || product.sizes.length === 0) return 85;

  // Find minimum offset
  const numericSizes = product.sizes
    .map(s => parseFloat(s))
    .filter(n => !isNaN(n));

  if (numericSizes.length === 0) return 85;

  const minDiff = Math.min(...numericSizes.map(n => Math.abs(n - size)));
  if (minDiff <= 0.5) return 85;
  if (minDiff <= 1)   return 68;
  if (minDiff <= 1.5) return 50;
  return 30;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function calculateFitScore(
  product: Product,
  measurements: Partial<UserMeasurements>,
): number {
  if (!measurements || Object.keys(measurements).length === 0) return 85;

  switch (product.category) {
    case 'tops':
      return topsScore(product, measurements);
    case 'bottoms':
      return bottomsScore(product, measurements);
    case 'shoes':
      return shoesScore(product, measurements);
    case 'outerwear':
      // Outerwear is worn layered, so allow one size up — adjust chest by +4 cm
      return topsScore(product, {
        ...measurements,
        chest: measurements.chest ? measurements.chest + 4 : undefined,
      });
    default:
      return 85; // accessories / no-fit-needed
  }
}

export function getFitLabel(score: number): FitLabel {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  return 'Poor';
}
