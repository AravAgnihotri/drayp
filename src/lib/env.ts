/**
 * Server-only env (API routes, server components, `lib/` used from those).
 * Values come from project-root `.env` / `.env.local`, loaded by Next.js and `next.config.mjs`.
 */
export function getOpenAiApiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || undefined;
}
