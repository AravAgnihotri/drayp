import OpenAI from 'openai';
import type {
  UserProfile,
  ShoppingIntent,
  RankedProduct,
  Product,
  StyleTag,
} from '@/types';
import { searchProducts } from '../search';
import { calculateFitScore, getFitLabel } from './fit-scorer';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Intent extraction ────────────────────────────────────────────────────────

/** Extract structured shopping intent from the user message. */
async function extractIntent(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<ShoppingIntent> {
  const systemPrompt = `You are a structured intent extractor for a fashion shopping assistant.
Given a user message, output a JSON object with these optional fields:
- category: one of "tops" | "bottoms" | "shoes" | "outerwear" | "accessories"
- subcategories: string[] (e.g. ["t-shirt","shirt"])
- colors: string[] (e.g. ["navy","white"])
- styles: array from ["casual","formal","streetwear","minimalist","athletic","preppy","workwear","bohemian","luxury"]
- maxPrice: number (USD)
- minPrice: number (USD)
- occasion: string (e.g. "gym","work","date night")
- brands: string[] (e.g. ["Nike","Adidas"])
- keywords: string[] (extra search keywords)

Output ONLY valid JSON with no explanation.`;

  const recent = history.slice(-4).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 256,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...recent,
        { role: 'user', content: message },
      ],
    });

    const text = response.choices[0].message.content ?? '{}';
    const parsed = JSON.parse(text) as Partial<ShoppingIntent>;
    return { ...parsed, rawQuery: message };
  } catch {
    return { rawQuery: message, keywords: message.split(/\s+/).filter(w => w.length > 3) };
  }
}

// ─── Profile-aware ranking ────────────────────────────────────────────────────

function boostByProfile(product: Product, profile: Partial<UserProfile>): number {
  let boost = 0;
  const prefs = profile.stylePreferences ?? {};

  if (prefs.favoriteBrands?.some(b => b.toLowerCase() === product.brand.toLowerCase())) boost += 15;
  if (prefs.styles?.some(s => product.styles.includes(s as StyleTag))) boost += 10;
  if (prefs.favoriteColors?.some(c =>
    product.colors.some(pc => pc.toLowerCase().includes(c.toLowerCase()))
  )) boost += 8;
  if (prefs.priceMax !== undefined && product.price <= prefs.priceMax) boost += 5;

  return boost;
}

// ─── OpenAI ranking + reason generation ──────────────────────────────────────

interface RankResult {
  text: string;
  products: Array<{ id: string; reason: string; rank: number }>;
}

async function rankWithAI(
  query: string,
  profile: Partial<UserProfile>,
  products: Product[],
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<RankResult> {
  const profileSummary = buildProfileSummary(profile);
  const productList = products.map((p, i) =>
    `${i + 1}. [${p.id}] ${p.brand} ${p.title} — $${p.price} — styles: ${p.styles.join(', ')} — colors: ${p.colors.slice(0, 3).join(', ')}`
  ).join('\n');

  const systemPrompt = `You are Drayp, an AI personal shopping assistant. You help users find clothing that matches their style, budget, and body.

User profile:
${profileSummary}

When responding:
1. Write a short, warm conversational reply (2-3 sentences max) acknowledging what they asked for.
2. Rank the provided products 1–N from most to least relevant for this user based on their profile + query.
3. For each product write a single punchy sentence explaining WHY it's right for this user specifically.

Output ONLY valid JSON in this exact format:
{
  "text": "...",
  "products": [
    { "id": "product-id", "rank": 1, "reason": "one sentence why" },
    ...
  ]
}`;

  const userContent = `User query: "${query}"

Available products:
${productList}

Rank these products and generate personalised reasons for the top ones. Include all products that are relevant.`;

  const recent = history.slice(-4).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        ...recent,
        { role: 'user', content: userContent },
      ],
    });

    const raw = response.choices[0].message.content ?? '{}';
    return JSON.parse(raw) as RankResult;
  } catch {
    return {
      text: `Here are some great picks for "${query}" based on your profile!`,
      products: products.map((p, i) => ({
        id: p.id,
        rank: i + 1,
        reason: `A great choice that matches your style at ${p.brand}'s quality level.`,
      })),
    };
  }
}

function buildProfileSummary(profile: Partial<UserProfile>): string {
  const lines: string[] = [];
  if (profile.name) lines.push(`Name: ${profile.name}`);

  const prefs = profile.stylePreferences ?? {};
  if (prefs.favoriteBrands?.length)  lines.push(`Favourite brands: ${prefs.favoriteBrands.join(', ')}`);
  if (prefs.styles?.length)          lines.push(`Style: ${prefs.styles.join(', ')}`);
  if (prefs.favoriteColors?.length)  lines.push(`Favourite colours: ${prefs.favoriteColors.join(', ')}`);
  if (prefs.priceMax)                lines.push(`Budget: up to $${prefs.priceMax}`);

  const m = profile.measurements ?? {};
  const mParts: string[] = [];
  if (m.height)   mParts.push(`height ${m.height}cm`);
  if (m.chest)    mParts.push(`chest ${m.chest}cm`);
  if (m.waist)    mParts.push(`waist ${m.waist}cm`);
  if (m.inseam)   mParts.push(`inseam ${m.inseam}cm`);
  if (m.shoeSize) mParts.push(`shoe size US ${m.shoeSize}`);
  if (mParts.length) lines.push(`Measurements: ${mParts.join(', ')}`);

  return lines.length ? lines.join('\n') : 'No profile data yet.';
}

// ─── Main agent entry point ───────────────────────────────────────────────────

export interface AgentResult {
  text: string;
  products?: RankedProduct[];
  intent?: ShoppingIntent;
}

export async function processShoppingQuery(
  message: string,
  profile: Partial<UserProfile>,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<AgentResult> {
  // 1. Extract intent
  const intent = await extractIntent(message, history);

  // 2. Search catalog
  const rawProducts = searchProducts(intent, 15);
  if (rawProducts.length === 0) {
    return {
      text: "I couldn't find anything matching that description. Try broadening your search — I can help with tops, bottoms, shoes, and outerwear!",
      intent,
    };
  }

  // 3. Add profile boost to relevance and pre-sort
  const withBoost = rawProducts.map(p => ({
    product: p,
    profileBoost: boostByProfile(p, profile),
  }));
  withBoost.sort((a, b) => b.profileBoost - a.profileBoost);
  const boostedProducts = withBoost.map(x => x.product);

  // 4. Ask AI to rank and generate reasons
  const rankResult = await rankWithAI(message, profile, boostedProducts.slice(0, 12), history);

  // 5. Build final ranked product list
  const productMap = new Map(boostedProducts.map(p => [p.id, p]));
  const measurements = profile.measurements ?? {};

  const ranked: RankedProduct[] = rankResult.products
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8)
    .map(r => {
      const product = productMap.get(r.id);
      if (!product) return null;
      const fitScore = calculateFitScore(product, measurements);
      return {
        ...product,
        fitScore,
        fitLabel: getFitLabel(fitScore),
        reason: r.reason,
        relevanceScore: 100 - r.rank,
      } as RankedProduct;
    })
    .filter((p): p is RankedProduct => p !== null);

  return {
    text: rankResult.text,
    products: ranked.length > 0 ? ranked : undefined,
    intent,
  };
}
