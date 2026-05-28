import { createClient } from '@/lib/supabase/server';
import type { ShoppingResult } from '@/types';
import SavedItemsClient from './SavedItemsClient';

export default async function SavedItemsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('saved_items')
    .select('product_id, title, price, price_formatted, source, link, image_url, fit_score, rating, saved_at')
    .eq('user_id', user.id)
    .not('product_id', 'is', null)
    .order('saved_at', { ascending: false });

  const items: ShoppingResult[] = (data ?? []).map(row => ({
    id: row.product_id as string,
    title: row.title as string,
    price: Number(row.price),
    priceFormatted: (row.price_formatted as string) ?? `$${Number(row.price).toFixed(2)}`,
    source: (row.source as string) ?? '',
    link: (row.link as string) ?? '',
    imageUrl: (row.image_url as string) ?? '',
    rating: row.rating != null ? Number(row.rating) : undefined,
    fitScore: row.fit_score != null ? Number(row.fit_score) : undefined,
  }));

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Saved Items</h1>
        <p className="mt-1 text-sm text-gray-500">
          {items.length > 0
            ? `${items.length} item${items.length === 1 ? '' : 's'} saved`
            : 'No saved items yet'}
        </p>
      </div>

      <SavedItemsClient initialItems={items} />
    </div>
  );
}
