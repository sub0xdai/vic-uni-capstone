
import { NextResponse } from "next/server";
import { MissingEnvError } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const LOCK_TTL_MS = 90_000;

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail("Request body must be JSON.", 400);
  }

  if (body === null || typeof body !== "object") {
    return fail("Request body must be an object.", 400);
  }

  const prompt = (body as Record<string, unknown>).prompt;

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return fail("Please enter an image description.", 400);
  }

  if (prompt.trim().length > 2048) {
    return fail("Image description must be 2048 characters or fewer.", 400);
  }

  let supabase;

  try {
    supabase = await supabaseServer();
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return fail("Database is not configured.", 500);
    }
    throw error;
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError !== null || auth.user === null) {
    return fail("You must be logged in to generate images.", 401);
  }

  const userId = auth.user.id;

  const staleBefore = new Date(Date.now() - LOCK_TTL_MS).toISOString();

  const { error: clearError } = await supabase
    .from("generation_lock")
    .delete()
    .eq("user_id", userId)
    .lt("acquired_at", staleBefore);

  if (clearError !== null) {
    console.error("Could not clear stale image generation lock.");
    return fail("Image generation could not start.", 500);
  }

  const { error: lockError } = await supabase
    .from("generation_lock")
    .insert({ user_id: userId });

  if (lockError !== null) {
    if (lockError.code === "23505") {
      return fail("Another generation is already running. Please wait.", 429);
    }

    console.error("Could not acquire image generation lock.");
    return fail("Image generation could not start.", 500);
  }

  try {
    const { data: allowed, error: usageError } = await supabase.rpc(
      "consume_image_generation"
    );

    if (usageError !== null) {
      console.error("Could not check image generation allowance.");
      return fail("Could not check your daily image limit.", 500);
    }

    if (allowed !== true) {
      return fail("You've reached your limit of 3 images today. Try again tomorrow.", 429);
    }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return fail("Image generation is not configured.", 500);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    let response: Response;

    try {
      response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            steps: 4,
          }),
          signal: controller.signal,
        }
      );
    } catch {
      return fail("Cloudflare image generation could not be reached. Please try again.", 502);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error(`Cloudflare image generation failed: HTTP ${response.status}`);
      return fail("Image generation failed. Please try again.", 502);
    }

    const result = await response.json() as {
      success?: boolean;
      result?: { image?: string };
    };

    if (result.success !== true || typeof result.result?.image !== "string") {
      console.error("Cloudflare returned an unusable image response.");
      return fail("The image service returned an invalid result.", 502);
    }

    return NextResponse.json({
      imageDataUrl: `data:image/jpeg;base64,${result.result.image}`,
      prompt: prompt.trim(),
    });
  } catch (error) {
    console.error("Image generation request failed:", error);
    return fail("An unexpected image generation error occurred.", 500);
  } finally {
    const { error } = await supabase
      .from("generation_lock")
      .delete()
      .eq("user_id", userId);

    if (error !== null) {
      console.error("Could not release image generation lock.");
    }
  }
}

