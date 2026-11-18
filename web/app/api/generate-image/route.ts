
import { NextResponse } from "next/server";
import { MissingEnvError, optionalEnv } from "@/lib/env";
import { imageDataUrl, parseImagePrompt } from "@/lib/image";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const LOCK_TTL_MS = 90_000;

type QueryClient = Awaited<ReturnType<typeof supabaseServer>>;

type QuotaResult = "reserved" | "limit" | "failed";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function reserveQuota(supabase: QueryClient): Promise<QuotaResult> {
  const { data, error } = await supabase.rpc("consume_image_generation");
  if (error !== null) {
    console.error(`Could not reserve an image generation: ${error.message}`);
    return "failed";
  }
  return data === true ? "reserved" : "limit";
}

async function refundQuota(supabase: QueryClient): Promise<void> {
  const { error } = await supabase.rpc("refund_image_generation");
  if (error !== null) {
    console.error(`Could not refund an image generation: ${error.message}`);
  }
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

  const parsedPrompt = parseImagePrompt((body as Record<string, unknown>).prompt);
  if (!parsedPrompt.ok) {
    return fail(parsedPrompt.error, 400);
  }
  const prompt = parsedPrompt.value;

  let supabase: QueryClient;

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

  let reserved = false;
  let delivered = false;

  try {
    const accountId = optionalEnv("CLOUDFLARE_ACCOUNT_ID");
    const apiToken = optionalEnv("CLOUDFLARE_API_TOKEN");

    if (accountId === null || apiToken === null) {
      console.error(
        "Image generation is not configured: " +
          "CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is missing",
      );
      return fail("Image generation is not configured.", 500);
    }

    const quota = await reserveQuota(supabase);

    if (quota === "failed") {
      return fail("Could not check your daily image limit.", 500);
    }

    if (quota === "limit") {
      return fail("You've reached your limit of 3 images today. Try again tomorrow.", 429);
    }

    reserved = true;

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
            prompt,
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

    if (
      result.success !== true ||
      typeof result.result?.image !== "string" ||
      result.result.image.length === 0
    ) {
      console.error("Cloudflare returned an unusable image response.");
      return fail("The image service returned an invalid result.", 502);
    }

    delivered = true;
    return NextResponse.json({
      imageDataUrl: imageDataUrl(result.result.image),
      prompt,
    });
  } catch (error) {
    console.error("Image generation request failed:", error);
    return fail("An unexpected image generation error occurred.", 500);
  } finally {
    if (reserved && !delivered) {
      await refundQuota(supabase);
    }

    const { error } = await supabase
      .from("generation_lock")
      .delete()
      .eq("user_id", userId);

    if (error !== null) {
      console.error("Could not release image generation lock.");
    }
  }
}
