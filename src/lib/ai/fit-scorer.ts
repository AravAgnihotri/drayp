import type { UserMeasurements } from '@/types';

/**
 * Estimate fit score for a Serper shopping result using product title keywords
 * and user measurements. Used when no size/category data is available.
 */
export function estimateFitScoreFromTitle(
  title: string,
  measurements: Partial<UserMeasurements>,
): number {
  if (!measurements || Object.keys(measurements).length === 0) return 80;

  const { height, weight } = measurements;
  if (!height || !weight) return 80;

  const t = title.toLowerCase();
  const bmi = weight / ((height / 100) ** 2);
  let base = 82;

  if (bmi < 18.5 || bmi > 30) base -= 8;

  if ((t.includes('slim') || t.includes('skinny')) && bmi > 27) base -= 15;
  if (t.includes('slim fit') && bmi > 25) base -= 8;
  if ((t.includes('relaxed') || t.includes('loose') || t.includes('oversized')) && bmi < 21) base -= 5;
  if (t.includes('stretch') || t.includes('elastic') || t.includes('flex')) base += 8;
  if (t.includes('regular fit') || t.includes('classic fit')) base += 4;

  // Stable jitter from title length so score is deterministic per product
  const jitter = (title.length % 7) - 3;
  return Math.max(10, Math.min(100, base + jitter));
}
