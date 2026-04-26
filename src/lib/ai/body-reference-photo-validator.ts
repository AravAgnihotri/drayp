import OpenAI from "openai"
import { getOpenAiApiKey } from "@/lib/env"

const MODEL = "gpt-4o-mini"

export type BodyReferencePhotoValidation =
  | { ok: true }
  | { ok: false; httpStatus: 400 | 503; message: string }

const SYSTEM = `You are a strict reviewer for a body-measurement / fit app.
You must respond with a single JSON object only (no markdown), using this exact shape:
{"accept":boolean,"code":"full_body"|"not_full_body"|"no_clear_human"|"multiple_people"|"other","brief":"short user-facing reason if accept is false"}

Set accept to true only if ALL are true:
- One clearly visible adult human (reject drawings, heavy filters that erase body edges, or ambiguous CGI unless clearly a normal photograph).
- True full-body framing: top of head (or hair) through both feet/shoes visible in frame; reject if feet, ankles, or head are cropped out, or if the body is mostly off-screen.
- Standing or neutral upright pose so height and proportions can be estimated (reject lying down, seated shots where legs are hidden, extreme perspective that hides true proportions, or heavy occlusion of torso/arms/legs).

Set accept to false for: face-only, selfie arms dominating with no body context, mirror selfies that crop feet, multiple people, crowd shots, animals, text/screenshots, very dark unusable images, or when you are not confident it is a usable full-body reference.`

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
