import OpenAI from "openai"
import { getOpenAiApiKey } from "@/lib/env"

const MODEL = "gpt-4o-mini"

export type MeasurementEstimate = {
  chest_in?: number
  waist_in?: number
  hips_in?: number
  neck_in?: number
  shoulders_in?: number
  sleeve_in?: number
  inseam_in?: number
  thigh_in?: number
  calf_in?: number
  bicep_in?: number
  height_text?: string
  weight_lbs?: number
}

export type EstimateResult =
  | { ok: true; estimates: MeasurementEstimate; note: string }
  | { ok: false; httpStatus: 400 | 503; message: string }

const SYSTEM = `You are a body measurement estimator for a clothing fit app.
Analyze the full-body photo and estimate the person's body measurements based on their visible proportions and build.
Respond ONLY with a JSON object in this exact shape (inch measurements as numbers, weight in lbs):
{
  "chest_in": number,
  "waist_in": number,
  "hips_in": number,
  "shoulders_in": number,
  "neck_in": number,
  "sleeve_in": number,
  "inseam_in": number,
  "thigh_in": number,
  "calf_in": number,
  "bicep_in": number,
  "height_text": string,
  "weight_lbs": number,
  "confidence": "low" | "medium" | "high"
}

Rules:
- Round all inch values to 1 decimal place; use typical human proportions as reference ranges.
- height_text: natural format like "5'10\\"" or "180 cm" based on what you can estimate.
- weight_lbs: rough visual estimate based on build and proportions.
- If a body part is partially obscured use proportional inference — never omit a field.
- confidence: "high" if the full body is clearly visible, "medium" if some parts are obscured, "low" if very uncertain.`

export async function estimateMeasurementsFromPhoto(
  imageBuffer: Buffer,
  mimeType: string
): Promise<EstimateResult> {
  const apiKey = getOpenAiApiKey()
  if (!apiKey) {
    return {
      ok: false,
      httpStatus: 503,
      message:
        "AI estimation needs an OpenAI key. Add OPENAI_API_KEY to .env.local and restart the dev server.",
    }
  }

  const client = new OpenAI({ apiKey })
  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`

  let raw: string
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 350,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Estimate this person's body measurements." },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    })
    raw = completion.choices[0]?.message?.content?.trim() ?? ""
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[body-lab/estimate-measurements] OpenAI error", e)
    return { ok: false, httpStatus: 503, message: `Could not analyse the photo (${msg}). Try again.` }
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return { ok: false, httpStatus: 503, message: "AI returned an unexpected response. Please try again." }
  }

  const num = (v: unknown): number | undefined => {
    const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN
    return Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : undefined
  }
  const str = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined

  const estimates: MeasurementEstimate = {
    chest_in: num(parsed.chest_in),
    waist_in: num(parsed.waist_in),
    hips_in: num(parsed.hips_in),
    shoulders_in: num(parsed.shoulders_in),
    neck_in: num(parsed.neck_in),
    sleeve_in: num(parsed.sleeve_in),
    inseam_in: num(parsed.inseam_in),
    thigh_in: num(parsed.thigh_in),
    calf_in: num(parsed.calf_in),
    bicep_in: num(parsed.bicep_in),
    height_text: str(parsed.height_text),
    weight_lbs: num(parsed.weight_lbs),
  }

  const confidence = parsed.confidence
  const note =
    confidence === "low"
      ? "Rough estimates — the photo made precise proportions hard to read. Review carefully before saving."
      : "AI estimates filled in from your photo. Review and adjust, then save."

  return { ok: true, estimates, note }
}
