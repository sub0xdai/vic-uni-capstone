import { NextResponse } from "next/server";
import { MissingEnvError } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const DASHBOARD = "/dashboard";
const LOGIN = "/login";

function bounce(request: Request, path: string, reason: string | null = null) {
  const url = new URL(path, request.url);
  if (reason !== null) {
    url.searchParams.set("reason", reason);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");

  if (code === null || code.length === 0) {
    return bounce(request, LOGIN, "missing");
  }

  let supabase: Awaited<ReturnType<typeof supabaseServer>>;

  try {
    supabase = await supabaseServer();
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error(`Confirmation could not run: ${error.variable} is not set`);
      return bounce(request, LOGIN, "unconfigured");
    }
    throw error;
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error !== null) {
    console.error(`Confirmation was refused: ${error.message}`);
    return bounce(request, LOGIN, "expired");
  }

  return bounce(request, DASHBOARD);
}
