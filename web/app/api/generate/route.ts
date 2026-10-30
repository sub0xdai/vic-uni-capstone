import { NextResponse } from "next/server";
import { MissingEnvError, optionalEnv } from "@/lib/env";
import {
  GEMINI_DEFAULT_MODEL,
  GEMINI_TEMPERATURE,
  extractGeminiText,
  geminiBody,
  geminiUrl,
} from "@/lib/gemini";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { parseBusinessProfile, parseDraft } from "@/lib/rows";
import { supabaseServer } from "@/lib/supabase/server";
import { MONTHLY_LIMIT, parseGenerationRequest } from "@/lib/types";

export const runtime = "nodejs";

const AI_FAILED = "The AI service could not generate content. Please try again.";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function startOfMonthUtc(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Request body must be JSON.", 400);
  }
  const parsed = parseGenerationRequest(body);
  if (!parsed.ok) {
    return fail(parsed.error, 400);
  }
  const input = parsed.value;

  let supabase: Awaited<ReturnType<typeof supabaseServer>>;
  try {
    supabase = await supabaseServer();
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error(`Supabase is not configured: ${error.variable} is not set`);
      return fail("The database is not set up yet.", 500);
    }
    throw error;
  }
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError !== null || auth.user === null) {
    return fail("You must be logged in to generate content.", 401);
  }
  const user = auth.user;

  const { data: profileRow, error: profileError } = await supabase
    .from("business_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError !== null) {
    return fail("Could not load your business profile.", 500);
  }
  if (profileRow === null) {
    return fail("Create your business profile before generating content.", 409);
  }
  const profile = parseBusinessProfile(profileRow);
  if (!profile.ok) {
    return fail(profile.error, 500);
  }

  const { count, error: countError } = await supabase
    .from("generated_content")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonthUtc(new Date()));
  if (countError !== null) {
    return fail("Could not check your monthly limit.", 500);
  }
  if ((count ?? 0) >= MONTHLY_LIMIT) {
    return fail("You have reached your monthly generation limit.", 429);
  }

  const system = buildSystemPrompt(profile.value);
  if (!system.ok) {
    return fail(system.error, 400);
  }
  const userPrompt = buildUserPrompt({ ...input, profile: profile.value });
  if (!userPrompt.ok) {
    return fail(userPrompt.error, 400);
  }

  const apiKey = optionalEnv("GEMINI_API_KEY");
  if (apiKey === null) {
    console.error("GEMINI_API_KEY is not set");
    return fail("The AI service is not set up yet.", 500);
  }
  const model = optionalEnv("GEMINI_MODEL") ?? GEMINI_DEFAULT_MODEL;

  let text: string;
  try {
    const response = await fetch(geminiUrl(model), {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(geminiBody(system.value, userPrompt.value, GEMINI_TEMPERATURE)),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.error(`Gemini request failed with status ${response.status}`);
      return fail(AI_FAILED, 502);
    }
    const extracted = extractGeminiText(await response.json());
    if (!extracted.ok) {
      console.error(`Gemini response was not usable: ${extracted.error}`);
      return fail(AI_FAILED, 502);
    }
    text = extracted.value;
  } catch (error) {
    console.error("Gemini request error:", error instanceof Error ? error.name : "unknown");
    return fail("The AI service did not respond. Please try again.", 504);
  }

  const { data: saved, error: saveError } = await supabase
    .from("generated_content")
    .insert({
      user_id: user.id,
      content_type: input.contentType,
      topic: input.topic,
      keywords: input.keywords,
      content_text: text,
      model,
      temperature: GEMINI_TEMPERATURE,
      system_prompt: system.value,
      user_prompt: userPrompt.value,
    })
    .select("*")
    .single();
  if (saveError !== null) {
    console.error(`Could not save the draft: ${saveError.message}`);
    return fail("The draft could not be saved. Please try again.", 500);
  }
  const draft = parseDraft(saved);
  if (!draft.ok) {
    return fail(draft.error, 500);
  }
  return NextResponse.json({ draft: draft.value }, { status: 201 });
}