import OpenAI from 'openai';
import type { UserProfile, ShoppingIntent } from '@/types';
import { getOpenAiApiKey } from '@/lib/env';

let openaiClient: OpenAI | null = null;
let loggedMissingOpenAiKey = false;

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

  if (/^(hi|hey|hello|hiya|yo|sup|howdy|good\s+(morning|afternoon|evening|night))$/i.test(t)) return true;
  if (/^(thanks|thank\s+you|thx|ty|ok|okay|cool|nice|great|got\s+it|bye|goodbye|see\s+ya|cya)$/i.test(t)) return true;
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

function recoverOriginalQuery(
  currentMessage: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): string {
  const isVague = currentMessage.trim().split(/\s+/).length <= 5;
  if (!isVague) return currentMessage;

  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.role === 'user' && m.content.trim().split(/\s+/).length > 4) {
      return m.content.trim();
    }
  }
  return currentMessage;
}

async function extractIntent(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  profile: Partial<UserProfile>,
): Promise<ShoppingIntent> {
  const prefs = profile.stylePreferences ?? {};
  const profileContext = [
    profile.gender               ? `gender: ${profile.gender}`                        : '',
    prefs.styles?.length        ? `styles: ${prefs.styles.join(', ')}`               : '',
    prefs.favoriteColors?.length ? `colors: ${prefs.favoriteColors.join(', ')}`      : '',
    prefs.favoriteBrands?.length ? `brands: ${prefs.favoriteBrands.join(', ')}`      : '',
    prefs.priceMax               ? `budget up to $${prefs.priceMax}`                  : '',
  ].filter(Boolean).join('; ');

  const systemPrompt = `You are a structured intent extractor for a fashion shopping assistant.
Given a user message, output a JSON object with these fields:

- conversationOnly: boolean (required)
  Set to true if the user is ONLY greeting, thanking, saying goodbye, brief small talk, OR asking what you can do / who you are — with NO intent to search for, buy, or browse clothing right now.
  Set to false if they mention clothing, shoes, outfits, fit, sizes, budget, brands, occasions (work, gym, date, etc.), or ask to find/show/recommend/compare products.

- needsClarification: boolean
  Set to true ONLY when ALL of the following conditions are met:
    1. ALL three of these are missing from both the message AND conversation history AND user profile:
         • price range or budget
         • occasion or use-case (e.g. work, gym, date night, casual)
         • fit preference or style
    2. The user has NOT already declined to provide this info. Treat any of these as a decline:
         "no budget", "no occasion", "no preference", "doesn't matter", "any", "no", "nope", "idc", "don't care", "not sure", "just browse", "anything"
    3. The previous assistant message was NOT already a clarifying question about the same topic.
       Never ask a clarifying question twice in a row — if the user answered (even with "no"), proceed to search.
  User profile already knows: ${profileContext || 'nothing yet'}.

- clarifyingQuestion: string (only when needsClarification is true)
  One natural sentence asking 1–2 of the most important missing details.
  Examples: "What's your budget, and is this for a specific occasion?"
            "Are you going for a casual or more polished look, and do you have a price range in mind?"
  Keep it concise — do not ask more than two things at once.

When conversationOnly is true, omit shopping fields. When false, fill what applies:
- category: one of "tops" | "bottoms" | "shoes" | "outerwear" | "accessories"
- subcategories: string[] (e.g. ["t-shirt","shirt"])
- colors: string[] (e.g. ["navy","white"])
- styles: array from ["casual","formal","streetwear","minimalist","athletic","preppy","workwear","bohemian","luxury"]
- maxPrice: number (USD)
- minPrice: number (USD)
- occasion: string (e.g. "gym","work","date night")
- brands: string[] (e.g. ["Nike","Adidas"])
- keywords: string[] (extra search keywords)

IMPORTANT: If the current message is very short (1–5 words) like "no", "yes", "ok", "any", "doesn't matter",
look at the FULL conversation history to extract shopping fields. The user's intent is still the original
shopping request — extract category, keywords, brands etc from the history, not from the short reply.

Output ONLY valid JSON with no explanation.`;

  const recent = history.slice(-6).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const client = getOpenAI();
  if (!client) {
    const conversationOnly = isConversationOnlyFallback(message);
    return {
      conversationOnly,
      rawQuery: message,
      keywords: conversationOnly ? [] : message.split(/\s+/).filter(w => w.length > 3),
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
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
    const needsClarification = !conversationOnly && parsed.needsClarification === true;
    const rawQuery = conversationOnly ? message : recoverOriginalQuery(message, history);
    return { ...parsed, conversationOnly, needsClarification, rawQuery };
  } catch (err) {
    logOpenAiFailure('extractIntent', err);
    const conversationOnly = isConversationOnlyFallback(message);
    return {
      conversationOnly,
      rawQuery: conversationOnly ? message : recoverOriginalQuery(message, history),
      keywords: conversationOnly ? [] : message.split(/\s+/).filter(w => w.length > 3),
    };
  }
}

function lastTurnWasClarification(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): boolean {
  const lastAssistant = [...history].reverse().find(m => m.role === 'assistant');
  if (!lastAssistant) return false;
  const t = lastAssistant.content.trim();
  return t.endsWith('?') && t.length < 300;
}

export interface AgentResult {
  text: string;
  intent?: ShoppingIntent;
}

export async function processShoppingQuery(
  message: string,
  profile: Partial<UserProfile>,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<AgentResult> {
  const intent = await extractIntent(message, history, profile);

  if (intent.conversationOnly) {
    const text = await replyConversationOnly(message, profile, history);
    return { text, intent };
  }

  const alreadyAsked = lastTurnWasClarification(history);
  if (intent.needsClarification && intent.clarifyingQuestion && !alreadyAsked) {
    return { text: intent.clarifyingQuestion, intent };
  }

  // Shopping query — caller (chat/route.ts) handles live product search via Serper
  return { text: '', intent };
}
