import { NextResponse } from "next/server";
import { MissingEnvError } from "@/lib/env";
import { parseRatingRequest } from "@/lib/rating";
import { parseDraft } from "@/lib/rows";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Request body must be JSON.", 400);
  }
  const parsed = parseRatingRequest(body);
  if (!parsed.ok) {
    return fail(parsed.error, 400);
  }
  const { id, rating } = parsed.value;

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
    return fail("You must be logged in to rate a draft.", 401);
  }
  const user = auth.user;

  const { data: saved, error: saveError } = await supabase
    .from("generated_content")
    .update({ rating })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();
  if (saveError !== null) {
    console.error(`Could not save the rating: ${saveError.message}`);
    return fail("The rating could not be saved. Please try again.", 500);
  }
  if (saved === null) {
    return fail("That draft was not found.", 404);
  }
  const draft = parseDraft(saved);
  if (!draft.ok) {
    return fail(draft.error, 500);
  }
  return NextResponse.json({ draft: draft.value }, { status: 200 });
}