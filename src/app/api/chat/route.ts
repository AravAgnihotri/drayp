import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatRequest, ChatResponse, ShoppingResult, UserProfile } from '@/types';
import { processShoppingQuery } from '@/lib/ai/agent';
import { getProfile } from '@/lib/profile/store';
import { searchSerperShopping } from '@/lib/search/serper';
import { estimateFitScoreFromTitle } from '@/lib/ai/fit-scorer';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!openaiClient) openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function rerankByEmbeddings(
  results: ShoppingResult[],
  query: string,
  stylePreferences: { favoriteColors?: string[]; favoriteBrands?: string[]; styles?: string[] },
): Promise<ShoppingResult[]> {
  const client = getOpenAI();
  if (!client || results.length <= 1) return results;

  try {
    const profileDescriptor = [
      `Shopping query: ${query}`,
      stylePreferences.styles?.length ? `Styles: ${stylePreferences.styles.join(', ')}` : '',
      stylePreferences.favoriteColors?.length ? `Colors: ${stylePreferences.favoriteColors.join(', ')}` : '',
      stylePreferences.favoriteBrands?.length ? `Brands: ${stylePreferences.favoriteBrands.join(', ')}` : '',
    ].filter(Boolean).join('. ');

    const itemTexts = results.map(r => `${r.title} ${r.source} ${r.priceFormatted}`);

    const [profileEmb, itemsEmb] = await Promise.all([
      client.embeddings.create({ model: 'text-embedding-3-small', input: profileDescriptor }),
      client.embeddings.create({ model: 'text-embedding-3-small', input: itemTexts }),
    ]);

    const queryVec = profileEmb.data[0].embedding;
    return results
      .map((r, i) => ({ result: r, score: cosineSimilarity(queryVec, itemsEmb.data[i].embedding) }))
      .sort((a, b) => b.score - a.score)
      .map(({ result }) => result);
  } catch (err) {
    console.warn('[chat] embedding re-rank failed, using original order:', err);
    return results;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Merge local profile with gender from Supabase user_profiles
    const profile = getProfile();
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbProfile } = await supabase
          .from('user_profiles')
          .select('gender')
          .eq('user_id', user.id)
          .maybeSingle();
        if (dbProfile?.gender) {
          (profile as UserProfile).gender = dbProfile.gender as UserProfile['gender'];
        }
      }
    } catch {
      // Non-fatal — proceed without gender
    }

    const result = await processShoppingQuery(message, profile, history);

    const response: ChatResponse = {
      message: result.text,
      products: result.products,
      intent: result.intent,
    };

    // When there's a shopping intent and Serper is configured, augment with live results
    if (!result.intent?.conversationOnly && !result.intent?.needsClarification && process.env.SERPER_API_KEY) {
      const query = buildSerperQuery(result.intent?.rawQuery ?? message, result.intent, profile.gender);
      console.log('[chat] intent:', JSON.stringify({ conversationOnly: result.intent?.conversationOnly, maxPrice: result.intent?.maxPrice, minPrice: result.intent?.minPrice, gender: profile.gender }));
      try {
        const shoppingResults = await searchSerperShopping(query, {
          minPrice: result.intent?.minPrice,
          maxPrice: result.intent?.maxPrice,
        });
        console.log('[chat] shoppingResults after filter/price:', shoppingResults.length);
        if (shoppingResults.length > 0) {
          const withFit = shoppingResults.map(r => ({
            ...r,
            fitScore: estimateFitScoreFromTitle(r.title, profile.measurements),
          }));
          const reranked = await rerankByEmbeddings(
            withFit,
            query,
            profile.stylePreferences as { favoriteColors?: string[]; favoriteBrands?: string[]; styles?: string[] },
          );
          console.log('[chat] reranked:', reranked.length, '→ setting shoppingResults on response');
          response.shoppingResults = reranked.slice(0, 6);
          // Serper has live results — suppress the catalog fallback products and
          // replace the catalog-based AI message with a Serper-aware intro.
          response.products = undefined;
          response.message = buildSerperIntro(message, reranked.length);
        }
      } catch (err) {
        console.error('[chat] Serper shopping search failed, falling back to catalog:', err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[chat] error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}

function buildSerperIntro(userMessage: string, count: number): string {
  const lower = userMessage.toLowerCase();

  // Pull out the most specific noun phrase from the query for a natural intro
  const match =
    lower.match(/(?:find|show|get|looking for|want|need)\s+(?:me\s+)?(?:a\s+|an\s+|some\s+)?([\w\s]+?)(?:\s+under|\s+below|\s+for|\s+that|$)/) ??
    lower.match(/([\w\s]{4,40})/);

  const item = match ? match[1].trim() : 'items';
  return `Found ${count} live result${count !== 1 ? 's' : ''} for "${item}" — ranked by how well they match your style.`;
}

function buildSerperQuery(
  rawQuery: string,
  intent?: ChatResponse['intent'],
  gender?: UserProfile['gender'],
): string {
  const genderPrefix = gender === 'mens' ? "men's" : gender === 'womens' ? "women's" : null;

  if (!intent) return genderPrefix ? `${genderPrefix} ${rawQuery}` : rawQuery;

  const parts: string[] = [];

  if (genderPrefix) parts.push(genderPrefix);
  if (intent.category) parts.push(intent.category);
  if (intent.subcategories?.length) parts.push(intent.subcategories[0]);
  if (intent.colors?.length) parts.push(intent.colors[0]);
  if (intent.styles?.length) parts.push(intent.styles[0]);
  if (intent.brands?.length) parts.push(intent.brands[0]);
  if (intent.keywords?.length) parts.push(...intent.keywords.slice(0, 3));

  return parts.length >= 2 ? parts.join(' ') : genderPrefix ? `${genderPrefix} ${rawQuery}` : rawQuery;
}
