import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('saved_items')
    .select('*')
    .eq('user_id', user.id)
    .not('product_id', 'is', null)
    .order('saved_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { product_id, title, price, price_formatted, source, link, image_url, fit_score, rating } =
    body as {
      product_id: string;
      title: string;
      price: number;
      price_formatted: string;
      source: string;
      link: string;
      image_url: string;
      fit_score?: number;
      rating?: number;
    };

  const { data, error } = await supabase
    .from('saved_items')
    .upsert(
      {
        user_id: user.id,
        product_id,
        item_name: title,
        title,
        price,
        price_formatted,
        source,
        link,
        image_url,
        fit_score: fit_score ?? null,
        rating: rating ?? null,
        saved_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,product_id' },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
