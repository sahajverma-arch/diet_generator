import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { zodResponseFormat } from "openai/helpers/zod";
import { DietReportSchema, DaysPatchSchema, type DietReport } from "@/lib/schemas";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";
import { serverEnv } from "@/lib/env";

let _client: OpenAI | null = null;

function client(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: serverEnv.openaiApiKey,
      baseURL: serverEnv.openaiBaseUrl, // undefined => OpenAI default
      // Fail fast instead of hanging. Some OpenAI-compatible providers (e.g. the
      // NVIDIA free tier) accept the connection but stall when throttled/queued;
      // without this the SDK would wait up to 10 minutes per call.
      timeout: 55_000, // 55s — under the Vercel 60s function ceiling
      maxRetries: 1,
    });
  }
  return _client;
}

export class DietReportGenerationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "DietReportGenerationError";
  }
}

// Derive a plain JSON Schema from the Zod schema (reusing OpenAI's converter)
// so we can describe the exact expected shape to *any* model in the prompt.
const JSON_SCHEMA_STRING = JSON.stringify(
  zodResponseFormat(DietReportSchema, "diet_report").json_schema.schema,
);

// Some OpenAI-compatible providers don't accept `response_format`. Discovered
// lazily and remembered for the process.
let responseFormatSupported = true;

function looksLikeResponseFormatError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  const msg = (err as { message?: string })?.message?.toLowerCase() ?? "";
  return (
    (status === 400 || status === 422) &&
    (msg.includes("response_format") || msg.includes("json_object") || msg.includes("json mode"))
  );
}

/** Extract a JSON object from a model reply (handles ```json fences / prose). */
function extractJson(text: string): unknown {
  let t = text.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) t = fenced[1].trim();
  if (!t.startsWith("{")) {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  }
  return JSON.parse(t);
}

async function complete(
  messages: ChatCompletionMessageParam[],
  opts: { timeoutMs?: number; maxRetries?: number } = {},
): Promise<string> {
  try {
    // Per-call overrides. The repair pass uses a short timeout AND maxRetries: 0
    // so it truly fails fast (the client default retries once, which would
    // otherwise double the wait) instead of eating the whole serverless budget.
    const reqOpts: { timeout?: number; maxRetries?: number } = {};
    if (opts.timeoutMs) reqOpts.timeout = opts.timeoutMs;
    if (opts.maxRetries !== undefined) reqOpts.maxRetries = opts.maxRetries;

    const res = await client().chat.completions.create(
      {
        model: serverEnv.openaiModel,
        temperature: 0.2,
        // A full week of 7 meals/day is a lot of structured JSON; give it room so
        // the array is never truncated mid-object (which would fail JSON parsing).
        max_tokens: 8000,
        ...(responseFormatSupported
          ? { response_format: { type: "json_object" as const } }
          : {}),
        messages,
      },
      Object.keys(reqOpts).length ? reqOpts : undefined,
    );
    return res.choices[0]?.message?.content ?? "";
  } catch (err) {
    if (responseFormatSupported && looksLikeResponseFormatError(err)) {
      // Provider rejected JSON mode — retry once relying on the prompt alone.
      responseFormatSupported = false;
      return complete(messages, opts);
    }
    const name = (err as { name?: string })?.name ?? "";
    const status = (err as { status?: number })?.status;
    if (name.includes("Timeout") || name.includes("Connection") || status === 429) {
      throw new DietReportGenerationError(
        "The AI provider did not respond in time. The NVIDIA free-tier endpoint is " +
          "likely throttled or queued right now — wait a minute and try again, or " +
          "switch OPENAI_MODEL to a smaller model.",
        err,
      );
    }
    throw new DietReportGenerationError(
      "The AI provider rejected the request. Check OPENAI_BASE_URL, OPENAI_MODEL and the API key.",
      err,
    );
  }
}

/**
 * Repair pass: the small model sometimes returns a day with fewer meals than
 * the rest (it skips the afternoon/evening meals on long multi-day docs). When
 * that happens, re-ask for ONLY the short days and merge back any that come out
 * more complete. Costs one extra call, and only when a gap is detected. Any
 * failure here is swallowed by the caller so it can never break generation.
 */
async function repairShortDays(
  report: DietReport,
  extractedText: string,
): Promise<DietReport> {
  const { days } = report;
  if (days.length < 2) return report;

  const maxMeals = Math.max(...days.map((d) => d.meals.length));
  if (maxMeals < 2) return report;

  const shortLabels = days.filter((d) => d.meals.length < maxMeals).map((d) => d.label);
  if (shortLabels.length === 0) return report; // already uniform — no extra call

  const MAX_CHARS = 24_000;
  const text =
    extractedText.length > MAX_CHARS
      ? `${extractedText.slice(0, MAX_CHARS)}\n\n[...truncated for length...]`
      : extractedText;

  const countList = days.map((d) => `- "${d.label}": ${d.meals.length} meals`).join("\n");

  // Short timeout: the repair is a best-effort bonus. If the (slow, free-tier)
  // provider can't answer quickly, we skip it rather than risk the serverless
  // deadline — the caller falls back to the original report.
  const content = await complete(
    [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `From the diet document below, your previous extraction produced these days and meal counts:\n${countList}\n\n` +
        `Most days have ${maxMeals} meals, but these came back with fewer and are likely MISSING meals: ${shortLabels
          .map((l) => `"${l}"`)
          .join(", ")}.\n` +
        `Re-read the document and extract EVERY food/drink meal for ONLY those days, in chronological order from early morning to bedtime — do not skip the afternoon (~3 PM) or evening (~5 PM) meals, and include small drinks (warm/elaichi water, green tea, warm milk). Exclude non-food notes (greetings, "walk", "goodnight").\n` +
        `For each meal give time (HH:MM), name, foods, calories, protein_g, carbs_g, fats_g.\n` +
        `Return ONLY JSON of this exact shape (no commentary): {"days":[{"label":"<exact day label>","meals":[{"time":"","name":"","foods":"","calories":0,"protein_g":0,"carbs_g":0,"fats_g":0}]}]}\n\n` +
        `--- BEGIN DIET DOCUMENT ---\n${text}\n--- END DIET DOCUMENT ---`,
    },
    ],
    { timeoutMs: 20_000, maxRetries: 0 },
  );

  let json: unknown;
  try {
    json = extractJson(content);
  } catch {
    return report;
  }
  const parsed = DaysPatchSchema.safeParse(json);
  if (!parsed.success) return report;

  const patchByLabel = new Map(
    parsed.data.days.map((d) => [d.label.trim().toLowerCase(), d.meals]),
  );

  // Only replace a day's meals when the repair genuinely recovered more of them.
  const mergedDays = days.map((d) => {
    const patch = patchByLabel.get(d.label.trim().toLowerCase());
    return patch && patch.length > d.meals.length ? { ...d, meals: patch } : d;
  });

  return { ...report, days: mergedDays };
}

/**
 * Analyse extracted diet text and return a validated structured report.
 *
 * Provider-agnostic: works with OpenAI or any OpenAI-compatible endpoint
 * (NVIDIA, Groq, OpenRouter, Ollama, …) via OPENAI_BASE_URL. Uses JSON mode +
 * Zod validation, and asks the model to self-correct if the JSON is invalid.
 */
export async function generateDietReport(params: {
  clientName: string;
  extractedText: string;
}): Promise<{ data: DietReport; model: string }> {
  const model = serverEnv.openaiModel;
  const startedAt = Date.now();

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content:
        `${buildUserPrompt(params)}\n\n` +
        `Return ONLY a single JSON object (no markdown, no commentary) that strictly ` +
        `conforms to this JSON Schema:\n${JSON_SCHEMA_STRING}`,
    },
  ];

  let lastIssue = "";

  for (let attempt = 0; attempt < 3; attempt++) {
    const content = await complete(messages);

    let json: unknown;
    try {
      json = extractJson(content);
    } catch {
      lastIssue = "the response was not valid JSON";
      messages.push(
        { role: "assistant", content },
        {
          role: "user",
          content:
            "That was not valid JSON. Respond with ONLY the corrected JSON object, nothing else.",
        },
      );
      continue;
    }

    const result = DietReportSchema.safeParse(json);
    if (result.success) {
      // Best-effort completeness repair — but only if the first pass left enough
      // time budget (the free-tier provider is slow; two long calls could exceed
      // the serverless deadline). Never let it break a valid report.
      const elapsedMs = Date.now() - startedAt;
      const data =
        elapsedMs < 30_000
          ? await repairShortDays(result.data, params.extractedText).catch(() => result.data)
          : result.data;
      return { data, model };
    }

    lastIssue = result.error.issues
      .slice(0, 8)
      .map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    messages.push(
      { role: "assistant", content },
      {
        role: "user",
        content:
          `The JSON did not match the schema. Fix these problems and return ONLY the ` +
          `corrected JSON object:\n${lastIssue}`,
      },
    );
  }

  throw new DietReportGenerationError(
    `The model did not return schema-valid JSON after 3 attempts. Last issues:\n${lastIssue}`,
  );
}
