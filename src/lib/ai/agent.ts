import OpenAI from 'openai';
import type {
  UserProfile,
  ShoppingIntent,
  RankedProduct,
  Product,
  StyleTag,
} from '@/types';
import { getOpenAiApiKey } from '@/lib/env';
import { searchProducts } from '../search';
import { calculateFitScore, getFitLabel } from './fit-scorer';

let openaiClient: OpenAI | null = null;
let loggedMissingOpenAiKey = false;

/** Avoid instantiating at module load (breaks `next build` without env) or when key is unset. */
function getOpenAI(): OpenAI | null {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    if (!loggedMissingOpenAiKey) {
      loggedMissingOpenAiKey = true;
      console.warn('[drayp/openai] OPENAI_API_KEY is not set; using keyword / generic fallbacks.');
    }
    return null;
  }
  if (!openaiClient) openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

function logOpenAiFailure(phase: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[drayp/openai] ${phase} failed: ${message}`);
}

/** When OpenAI is unavailable: treat obvious greetings / thanks as non-shopping. */
function isConversationOnlyFallback(message: string): boolean {
  const t = message
    .trim()
    .toLowerCase()
    .replace(/[!?.]+$/g, '')
    .trim();
  if (t.length === 0) return true;
  if (t.length > 120) return false;

  const oneLine = /^[^\n]+$/.test(message.trim());
  if (!oneLine) return false;

  if (
    /^(hi|hey|hello|hiya|yo|sup|howdy|good\s+(morning|afternoon|evening|night))$/i.test(t)
  ) {
    return true;
  }
  if (/^(thanks|thank\s+you|thx|ty|ok|okay|cool|nice|great|got\s+it|bye|goodbye|see\s+ya|cya)$/i.test(t)) {
    return true;
  }
  // "hey alex", "hi there"
  if (/^(hi|hey|hello|yo)\s+[\w'-]{1,40}$/i.test(t)) return true;
  if (/^(hi|hey|hello)\s+there$/i.test(t)) return true;

  return false;
}

async function replyConversationOnly(
  message: string,
  profile: Partial<UserProfile>,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const name = profile.name?.trim();
  const client = getOpenAI();
  if (!client) {
    if (name) {
      return `Hey ${name}! When you're ready, tell me what you're looking for — jeans, sneakers, layers, anything — and I'll help you find pieces that fit.`;
    }
    return "Hey! When you're ready, tell me what you're looking for and I'll help you find pieces that fit.";
  }

  const recent = history.slice(-4).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const system = `You are Drayp, a friendly AI shopping assistant for clothing and fit.
The user's message is small talk (greeting, thanks, goodbye) or a general question — NOT a request to find or shop for products.
Reply in at most 2 short sentences. Be warm and natural.
Do NOT suggest specific products, brands, or categories. Do NOT list items to buy.
${name ? `The user's first name is ${name}; you may use it once if it feels natural.` : ''}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 120,
      messages: [
        { role: 'system', content: system },
        ...recent,
        { role: 'user', content: message },
      ],
    });
    const text = response.choices[0].message.content?.trim();
    if (text) return text;
  } catch (err) {
    logOpenAiFailure('replyConversationOnly', err);
  }

  if (name) {
    return `Hey ${name}! When you're ready to shop or compare fits, just say what you need.`;
  }
  return "Hey! When you're ready to shop or compare fits, just say what you need.";
}

// ─── Intent extraction ────────────────────────────────────────────────────────

/** Extract structured shopping intent from the user message. */
async function extractIntent(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<ShoppingIntent> {
  const systemPrompt = `You are a structured intent extractor for a fashion shopping assistant.
Given a user message, output a JSON object with these fields:

- conversationOnly: boolean (required)
  Set to true if the user is ONLY greeting, thanking, saying goodbye, brief small talk, OR asking what you can do / who you are — with NO intent to search for, buy, or browse clothing right now.
  Set to false if they mention clothing, shoes, outfits, fit, sizes, budget, brands, occasions (work, gym, date, etc.), or ask to find/show/recommend/compare products.

When conversationOnly is true, omit or ignore shopping fields below. When false, fill what applies:
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

  const client = getOpenAI();
  if (!client) {
    const conversationOnly = isConversationOnlyFallback(message);
    return {
      conversationOnly,
      rawQuery: message,
      keywords: conversationOnly
        ? []
        : message.split(/\s+/).filter(w => w.length > 3),
    };
  }

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
    const conversationOnly = parsed.conversationOnly === true;
    return { ...parsed, conversationOnly, rawQuery: message };
  } catch (err) {
    logOpenAiFailure('extractIntent', err);
    const conversationOnly = isConversationOnlyFallback(message);
    return {
      conversationOnly,
      rawQuery: message,
      keywords: conversationOnly
        ? []
        : message.split(/\s+/).filter(w => w.length > 3),
    };
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

  const client = getOpenAI();
  if (!client) {
    return {
      text: `Here are some great picks for "${query}" based on your profile!`,
      products: products.map((p, i) => ({
        id: p.id,
        rank: i + 1,
        reason: `A great choice that matches your style at ${p.brand}'s quality level.`,
      })),
    };
  }

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
  } catch (err) {
    logOpenAiFailure('rankWithAI', err);
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

  if (intent.conversationOnly) {
    const text = await replyConversationOnly(message, profile, history);
    return { text, intent };
  }

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
