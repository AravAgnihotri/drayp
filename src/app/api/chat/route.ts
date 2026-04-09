import { NextRequest, NextResponse } from 'next/server';
import type { ChatRequest, ChatResponse } from '@/types';
import { processShoppingQuery } from '@/lib/ai/agent';
import { getProfile } from '@/lib/profile/store';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const profile = getProfile();
    const result = await processShoppingQuery(message, profile, history);

    const response: ChatResponse = {
      message: result.text,
      products: result.products,
      intent: result.intent,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[chat] error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
