import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export const runtime = 'nodejs';

/** GET /api/credits — returns { credits: number } for the signed-in user.
 *  Auto-initializes to 200 on first call. */
export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    // Supabase not configured — return a generous default so the UI isn't blocked
    return NextResponse.json({ credits: 200 });
  }

  // Upsert initializes credits to 200 if the row doesn't exist yet
  const { error: upsertErr } = await admin
    .from('user_credits')
    .upsert({ user_id: user.id, credits: 200 }, { onConflict: 'user_id', ignoreDuplicates: true });

  if (upsertErr) {
    console.error('[api/credits] upsert error:', upsertErr);
  }

  const { data, error } = await admin
    .from('user_credits')
    .select('credits')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('[api/credits] select error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ credits: data.credits });
}
