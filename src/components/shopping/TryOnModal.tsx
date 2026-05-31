'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, Download, Sparkles, ArrowRight, RotateCcw, Maximize2, Minimize2, Zap } from 'lucide-react';
import type { ShoppingResult } from '@/types';
import { createClient } from '@/lib/supabase/client';
import AvatarModelViewer from '@/components/AvatarModelViewer';

interface Props {
  result: ShoppingResult;
  onClose: () => void;
}

type Stage =
  | 'idle'
  | 'generating-gpt'  // GPT analyzing images + generating try-on
  | 'generating-3d'   // Meshy building the 3D model
  | 'done-2d'         // Only 2D (Meshy not configured or failed)
  | 'done-3d'         // 3D model ready
  | 'error';

function meshyPhaseLabel(progress: number): string {
  if (progress < 5)  return 'Starting up…';
  if (progress < 30) return 'Building 3D mesh…';
  if (progress < 60) return 'Adding geometry & detail…';
  if (progress < 85) return 'Applying textures…';
  if (progress < 99) return 'Finishing up…';
  return 'Almost there…';
}

export default function TryOnModal({ result, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('idle');
  const [garmentImageUrl, setGarmentImageUrl] = useState(result.imageUrl);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [meshyTaskId, setMeshyTaskId] = useState<string | null>(null);
  const [meshyProgress, setMeshyProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const modelContainerRef = useRef<HTMLDivElement>(null);

  // Proxy URL so model-viewer never hits Meshy CDN directly (avoids CORS)
  const glbProxyUrl = meshyTaskId
    ? `/api/tryon/glb?meshyTaskId=${encodeURIComponent(meshyTaskId)}`
    : null;

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      modelContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from('body_measurements')
        .select('reference_photo_url')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.reference_photo_url) setUserPhotoUrl(data.reference_photo_url);
        });
    });

    fetch('/api/credits')
      .then(r => r.json())
      .then(({ credits: c }) => { if (typeof c === 'number') setCredits(c); })
      .catch(() => {});

    fetch('/api/product-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: result.link }),
    })
      .then(r => r.json())
      .then(({ imageUrl }) => { if (imageUrl) setGarmentImageUrl(imageUrl); })
      .catch(() => {});
  }, [result.link]);

  const handleGenerate = async () => {
    if (!userPhotoUrl) {
      setErrorMessage('Upload a reference photo in Body Lab first.');
      return;
    }

    if (credits !== null && credits < 100) {
      setErrorMessage('Not enough credits. You need 100 credits per try-on.');
      return;
    }

    setStage('generating-gpt');
    setErrorMessage(null);
    setTryOnImage(null);
    setMeshyTaskId(null);
    setMeshyProgress(0);

    try {
      const genRes = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userImageUrl: userPhotoUrl,
          garmentImageUrl,
          userId,
          garmentTitle: result.title,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error ?? 'Try-on generation failed');

      // Refresh credit balance after successful deduction
      fetch('/api/credits')
        .then(r => r.json())
        .then(({ credits: c }) => { if (typeof c === 'number') setCredits(c); })
        .catch(() => {});

      const { tryOnImageBase64, tryOnImageUrl, meshyTaskId: taskId } = genData as {
        tryOnImageBase64: string;
        tryOnImageUrl: string | null;
        meshyTaskId: string | null;
      };

      const displayUrl = tryOnImageUrl ?? `data:image/png;base64,${tryOnImageBase64}`;
      setTryOnImage(displayUrl);

      if (!taskId) {
        setStage('done-2d');
        return;
      }

      setMeshyTaskId(taskId);
      setStage('generating-3d');

      // Poll Meshy
      let attempts = 0;
      const poll = async (): Promise<void> => {
        if (attempts++ > 90) throw new Error('3D model generation timed out. Your 2D result is still available.');

        const pollRes = await fetch(`/api/tryon?meshyTaskId=${encodeURIComponent(taskId)}`);
        const pollData = await pollRes.json();

        if (pollData.status === 'SUCCEEDED') {
          setMeshyProgress(100);
          setStage('done-3d');
        } else if (pollData.status === 'FAILED') {
          // Degrade to 2D — don't throw, just show what we have
          setStage('done-2d');
        } else {
          setMeshyProgress(pollData.progress ?? 0);
          await new Promise(r => setTimeout(r, 4000));
          return poll();
        }
      };

      await poll();
    } catch (err) {
      setStage('error');
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const reset = () => {
    setStage('idle');
    setTryOnImage(null);
    setMeshyTaskId(null);
    setMeshyProgress(0);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full sm:max-w-md bg-[#0f0f13] border border-white/[0.08] sm:rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Virtual Try-On</h2>
          </div>
          <div className="flex items-center gap-2">
            {credits !== null && (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                credits < 100
                  ? 'bg-red-500/10 border-red-500/25 text-red-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                <Zap className="w-3 h-3" />
                {credits} credits
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-4">

          {/* ── IDLE ── */}
          {stage === 'idle' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Garment</p>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                    <Image src={garmentImageUrl} alt={result.title} fill className="object-cover" unoptimized />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{result.title}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">You</p>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    {userPhotoUrl
                      ? <Image src={userPhotoUrl} alt="Your photo" fill className="object-cover" unoptimized />
                      : <p className="text-[11px] text-slate-500 text-center px-3">No photo</p>
                    }
                  </div>
                  {!userPhotoUrl && (
                    <a href="/body-lab" className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors">
                      Add in Body Lab <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!userPhotoUrl || (credits !== null && credits < 100)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:bg-white/[0.06] disabled:text-slate-500 text-white text-sm font-semibold py-3 transition-all shadow-lg shadow-violet-500/20 disabled:shadow-none"
              >
                <Sparkles className="w-4 h-4" />
                Generate Try-On
                <span className={`ml-auto flex items-center gap-0.5 text-[11px] font-medium opacity-70 ${
                  credits !== null && credits < 100 ? 'text-red-400 opacity-100' : ''
                }`}>
                  <Zap className="w-3 h-3" />
                  100
                </span>
              </button>

              {credits !== null && credits < 100 && (
                <p className="text-[11px] text-center text-red-400/80">
                  You need 100 credits to generate a try-on.
                </p>
              )}

              {errorMessage && (
                <p className="text-[12px] text-red-400 bg-red-500/10 rounded-xl px-4 py-2.5 border border-red-500/15">
                  {errorMessage}
                </p>
              )}
            </>
          )}

          {/* ── GPT GENERATING ── */}
          {stage === 'generating-gpt' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                <div className="absolute inset-2.5 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
              </div>
              <div className="text-center flex flex-col gap-1">
                <p className="text-sm font-semibold text-white">Analysing your look…</p>
                <p className="text-[12px] text-slate-500">AI is studying the garment and composing your outfit</p>
              </div>
              <StepPill step={1} label="Generating image" active />
              <StepPill step={2} label="Building 3D model" active={false} />
            </div>
          )}

          {/* ── MESHY 3D BUILDING ── */}
          {stage === 'generating-3d' && (
            <div className="flex flex-col gap-5 py-4">
              {/* Pulsing cube placeholder while 3D renders */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] flex flex-col items-center justify-center gap-4">
                <div className="relative w-20 h-20">
                  {/* Rotating ring */}
                  <svg className="absolute inset-0 animate-spin-slow" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="3" />
                    <circle
                      cx="40" cy="40" r="36" fill="none"
                      stroke="#8b5cf6" strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 36 * meshyProgress / 100} ${2 * Math.PI * 36}`}
                      strokeLinecap="round"
                      transform="rotate(-90 40 40)"
                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                  </svg>
                  {/* Percentage */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-white tabular-nums">{meshyProgress}%</span>
                  </div>
                </div>

                <div className="text-center flex flex-col gap-0.5">
                  <p className="text-[13px] font-semibold text-white">{meshyPhaseLabel(meshyProgress)}</p>
                  <p className="text-[11px] text-slate-500">Creating your 3D try-on model</p>
                </div>
              </div>

              {/* Linear progress bar */}
              <div className="flex flex-col gap-1.5">
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(meshyProgress, 2)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Mesh</span>
                  <span>Geometry</span>
                  <span>Textures</span>
                  <span>Done</span>
                </div>
              </div>

              <div className="flex gap-1.5 items-center justify-center">
                <StepPill step={1} label="Image ready" done />
                <StepPill step={2} label="Building 3D model" active />
              </div>
            </div>
          )}

          {/* ── DONE 3D ── */}
          {stage === 'done-3d' && glbProxyUrl && (
            <div className="flex flex-col gap-4">
              {/* 3D viewer with fullscreen container */}
              <div
                ref={modelContainerRef}
                className="tryon-model-container relative w-full aspect-square rounded-xl overflow-hidden border border-white/[0.06] bg-[#0a0a0d] group"
              >
                <AvatarModelViewer src={glbProxyUrl} className="absolute inset-0" />

                {/* Fullscreen toggle button */}
                <button
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  {isFullscreen
                    ? <Minimize2 className="w-4 h-4 text-white" />
                    : <Maximize2 className="w-4 h-4 text-white" />
                  }
                </button>

                {/* Exit fullscreen button (always visible when fullscreen) */}
                {isFullscreen && (
                  <button
                    onClick={toggleFullscreen}
                    aria-label="Exit fullscreen"
                    className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-[12px] font-medium transition-all"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    Exit fullscreen
                  </button>
                )}

                {/* Zoom / rotate hint */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-white/50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full whitespace-nowrap">
                    Scroll to zoom · Drag to rotate
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {tryOnImage && (
                  <a
                    href={tryOnImage}
                    download="drayp-tryon.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-[12px] font-medium py-2.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save Image
                  </a>
                )}
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-[12px] font-medium py-2.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* ── DONE 2D (fallback — Meshy not configured or failed) ── */}
          {stage === 'done-2d' && tryOnImage && (
            <div className="flex flex-col gap-4">
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border border-white/[0.06]">
                <Image src={tryOnImage} alt="Try-on result" fill className="object-cover" unoptimized />
              </div>
              <div className="flex gap-2">
                <a
                  href={tryOnImage}
                  download="drayp-tryon.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 text-[12px] font-medium py-2.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 text-[12px] font-medium py-2.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {stage === 'error' && (
            <div className="flex flex-col gap-3 py-2">
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-[12px] text-red-400 leading-relaxed">{errorMessage}</p>
              </div>
              <button
                onClick={reset}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-[12px] font-medium py-2.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepPill({
  step, label, active = false, done = false,
}: {
  step: number; label: string; active?: boolean; done?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
      done
        ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
        : active
          ? 'bg-violet-500/15 border-violet-500/40 text-violet-300'
          : 'bg-white/[0.03] border-white/[0.06] text-slate-600'
    }`}>
      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
        done
          ? 'bg-violet-500 text-white'
          : active
            ? 'bg-violet-500/30 text-violet-300'
            : 'bg-white/[0.06] text-slate-600'
      }`}>
        {done ? '✓' : step}
      </span>
      {label}
    </div>
  );
}
