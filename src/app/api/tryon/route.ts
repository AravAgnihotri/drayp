import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { createImageTo3DTask, getImageTo3DTask } from '@/lib/meshy/client';

export const runtime = 'nodejs';

const TRYON_BUCKET = 'body-reference-photos';

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('OPENAI_NOT_CONFIGURED');
  return new OpenAI({ apiKey: key });
}

/**
 * Describe the person's appearance via GPT-4o vision (URL-based, no upload).
 * Focuses on features that survive image generation: face, hair, skin tone, build.
 */
async function describePerson(openai: OpenAI, imageUrl: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Describe this person\'s appearance in detail for a photorealistic fashion image: face shape, hair color and style, skin tone, eye color, approximate height and build, any distinctive features. Be specific and concise (3-4 sentences). Do not describe their current clothing.',
        },
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
      ],
    }],
    max_tokens: 200,
  });
  const desc = res.choices[0]?.message?.content?.trim();
  if (!desc) throw new Error('Could not analyze your reference photo.');
  return desc;
}

/**
 * Describe the garment via GPT-4o-mini vision (URL-based, no upload).
 */
async function describeGarment(openai: OpenAI, imageUrl: string, title?: string): Promise<string> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Describe this clothing item for a virtual try-on: garment type, fabric, exact color(s), pattern, cut, collar/neckline, sleeve length, any logos or design details. 2-3 concise sentences.',
          },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
        ],
      }],
      max_tokens: 150,
    });
    return res.choices[0]?.message?.content?.trim() ?? title ?? 'a clothing item';
  } catch {
    return title ?? 'a clothing item';
  }
}

async function uploadTryOnImage(userId: string, imageBase64: string): Promise<string | null> {
  const admin = createServiceRoleClient();
  if (!admin) return null;

  const buffer = Buffer.from(imageBase64, 'base64');
  const path = `${userId}/tryon-${Date.now()}.png`;

  const { error } = await admin.storage.from(TRYON_BUCKET).upload(path, buffer, {
    contentType: 'image/png',
    upsert: false,
  });

  if (error) {
    console.error('[tryon] Supabase upload error:', error);
    return null;
  }

  const { data: { publicUrl } } = admin.storage.from(TRYON_BUCKET).getPublicUrl(path);
  return publicUrl;
}

const TRYON_CREDIT_COST = 100;

export async function POST(req: NextRequest) {
  try {
    const { userImageUrl, garmentImageUrl, userId, garmentTitle } = (await req.json()) as {
      userImageUrl: string;
      garmentImageUrl: string;
      userId?: string;
      garmentTitle?: string;
    };

    if (!userImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: 'Both userImageUrl and garmentImageUrl are required' },
        { status: 400 },
      );
    }

    // Deduct credits before generating (server-side, cannot be bypassed)
    if (userId) {
      const admin = createServiceRoleClient();
      if (admin) {
        // Ensure row exists (initialize to 200 if new user)
        await admin
          .from('user_credits')
          .upsert({ user_id: userId, credits: 200 }, { onConflict: 'user_id', ignoreDuplicates: true });

        const { data: creditRow } = await admin
          .from('user_credits')
          .select('credits')
          .eq('user_id', userId)
          .single();

        if (!creditRow || creditRow.credits < TRYON_CREDIT_COST) {
          return NextResponse.json(
            { error: 'Not enough credits. You need 100 credits per try-on.' },
            { status: 402 },
          );
        }

        const { error: deductErr } = await admin
          .from('user_credits')
          .update({ credits: creditRow.credits - TRYON_CREDIT_COST, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('credits', creditRow.credits); // optimistic lock: fail if credits changed concurrently

        if (deductErr) {
          return NextResponse.json(
            { error: 'Credit deduction failed. Please try again.' },
            { status: 409 },
          );
        }
      }
    }

    let openai: OpenAI;
    try {
      openai = getOpenAI();
    } catch {
      return NextResponse.json(
        { error: 'Virtual try-on requires an OpenAI API key. Add OPENAI_API_KEY to your environment.' },
        { status: 503 },
      );
    }

    // Step 1: Analyze both images via vision — no file uploads, just URLs
    const [personDescription, garmentDescription] = await Promise.all([
      describePerson(openai, userImageUrl),
      describeGarment(openai, garmentImageUrl, garmentTitle),
    ]);

    console.log('[tryon] Person:', personDescription.slice(0, 80));
    console.log('[tryon] Garment:', garmentDescription.slice(0, 80));

    // Step 2: Generate try-on image with gpt-image-1 (generate, not edit — no uploads needed)
    const prompt = [
      'Professional fashion photography, full body portrait.',
      `Subject: ${personDescription}`,
      `Outfit: ${garmentDescription}`,
      'Natural pose, neutral studio background, photorealistic, high detail, well-lit.',
    ].join(' ');

    const genResponse = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size: '1024x1536',
      quality: 'medium',
    });

    const imageB64 = genResponse.data?.[0]?.b64_json;
    if (!imageB64) {
      return NextResponse.json({ error: 'Image generation returned no result.' }, { status: 502 });
    }

    // Step 3: Upload to Supabase so Meshy has a stable public URL
    let tryOnImageUrl: string | null = null;
    let meshyTaskId: string | null = null;

    if (userId) {
      tryOnImageUrl = await uploadTryOnImage(userId, imageB64);
    }

    // Step 4: Kick off Meshy 3D task — non-fatal if unavailable
    if (tryOnImageUrl) {
      try {
        meshyTaskId = await createImageTo3DTask(tryOnImageUrl);
      } catch (err) {
        console.warn('[tryon] Meshy task creation failed:', err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json({ tryOnImageBase64: imageB64, tryOnImageUrl, meshyTaskId });
  } catch (err) {
    console.error('[api/tryon] POST error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const meshyTaskId = req.nextUrl.searchParams.get('meshyTaskId');
  if (!meshyTaskId) {
    return NextResponse.json({ error: 'meshyTaskId required' }, { status: 400 });
  }

  try {
    const task = await getImageTo3DTask(meshyTaskId);
    const glbUrl = task.model_urls?.glb ?? task.model_url ?? null;

    return NextResponse.json({
      status: task.status,
      progress: task.progress ?? 0,
      thumbnailUrl: task.thumbnail_url ?? null,
      glbUrl: task.status === 'SUCCEEDED' ? glbUrl : null,
      error: task.task_error?.message ?? null,
    });
  } catch (err) {
    console.error('[api/tryon] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
