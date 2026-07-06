import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { zodResponseFormat } from "openai/helpers/zod";
import { DietReportSchema, type DietReport } from "@/lib/schemas";
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
): Promise<string> {
  try {
    const res = await client().chat.completions.create({
      model: serverEnv.openaiModel,
      temperature: 0.2,
      max_tokens: 4000, // bound the generation so it can't run away
      ...(responseFormatSupported
        ? { response_format: { type: "json_object" as const } }
        : {}),
      messages,
    });
    return res.choices[0]?.message?.content ?? "";
  } catch (err) {
    if (responseFormatSupported && looksLikeResponseFormatError(err)) {
      // Provider rejected JSON mode — retry once relying on the prompt alone.
      responseFormatSupported = false;
      return complete(messages);
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
      return { data: result.data, model };
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
