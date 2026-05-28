import { NextRequest, NextResponse } from 'next/server';
import { getImageTo3DTask } from '@/lib/meshy/client';

export const runtime = 'nodejs';

/** Proxy the try-on GLB through our server so model-viewer avoids Meshy CDN CORS restrictions. */
export async function GET(req: NextRequest) {
  const meshyTaskId = req.nextUrl.searchParams.get('meshyTaskId');
  if (!meshyTaskId) {
    return NextResponse.json({ error: 'meshyTaskId required' }, { status: 400 });
  }

  try {
    const task = await getImageTo3DTask(meshyTaskId);

    if (task.status !== 'SUCCEEDED') {
      return NextResponse.json({ error: 'Model not ready', status: task.status }, { status: 409 });
    }

    const glbUrl = task.model_urls?.glb ?? task.model_url;
    if (!glbUrl) {
      return NextResponse.json({ error: 'No GLB URL on task' }, { status: 404 });
    }

    const assetRes = await fetch(glbUrl, { cache: 'no-store' });
    if (!assetRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch model from Meshy' }, { status: 502 });
    }

    const buffer = await assetRes.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[api/tryon/glb]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
