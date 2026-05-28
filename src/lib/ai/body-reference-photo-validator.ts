import OpenAI from "openai"
import { getOpenAiApiKey } from "@/lib/env"

const MODEL = "gpt-4o-mini"

export type BodyReferencePhotoValidation =
  | { ok: true }
  | { ok: false; httpStatus: 400 | 503; message: string }

const SYSTEM = `You are a photo reviewer for a body-measurement / fit app.
You must respond with a single JSON object only (no markdown), using this exact shape:
{"accept":boolean,"code":"full_body"|"not_full_body"|"no_clear_human"|"multiple_people"|"other","brief":"short user-facing reason if accept is false"}

Set accept to true when:
- At least one clearly visible human is present (photos, selfies, and mirror shots all count).
- Enough of the body is visible to estimate clothing size — most of the torso plus at least one limb visible. Slight head or foot cropping is fine.
- The image is usable (not pitch black, completely blurred, or a non-photo like a screenshot or drawing).

Only set accept to false for clear-cut failures: face-only close-ups with no body, multiple people making it ambiguous which to measure, crowds, animals, non-photograph images (drawings, screenshots, text), or images so dark/blurry that no body shape is discernible.
When in doubt, accept the image — the measurement estimator can handle partial views.`

export async function validateFullBodyReferencePhoto(input: {
  buffer: Buffer
  mimeType: string
}): Promise<BodyReferencePhotoValidation> {
  const apiKey = getOpenAiApiKey()
  if (!apiKey) {
    return {
      ok: false,
      httpStatus: 503,
      message:
        "Body Lab photo checks use OpenAI. Set OPENAI_API_KEY in your server environment (.env.local), then restart the dev server.",
    }
  }

  const client = new OpenAI({ apiKey })
  const base64 = input.buffer.toString("base64")
  const dataUrl = `data:${input.mimeType};base64,${base64}`

  let raw: string
  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Evaluate this image for accept/reject per your rules. Output JSON only.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "low" },
            },
          ],
        },
      ],
    })
    raw = completion.choices[0]?.message?.content?.trim() ?? ""
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[body-lab/validate-photo] OpenAI", e)
    return {
      ok: false,
      httpStatus: 503,
      message: `Could not verify the photo (${msg}). Try a smaller image or try again.`,
    }
  }

  let parsed: { accept?: unknown; brief?: unknown; code?: unknown }
  try {
    parsed = JSON.parse(raw) as { accept?: unknown; brief?: unknown; code?: unknown }
  } catch {
    return {
      ok: false,
      httpStatus: 503,
      message: "Photo check returned an invalid response. Please try again.",
    }
  }

  if (parsed.accept === true) {
    return { ok: true }
  }

  const brief =
    typeof parsed.brief === "string" && parsed.brief.trim().length > 0
      ? parsed.brief.trim()
      : "This image does not look like a full-body reference photo we can use."

  return {
    ok: false,
    httpStatus: 400,
    message: brief,
  }
}
