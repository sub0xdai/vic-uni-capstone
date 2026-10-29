"use client";

import { createBrowserClient } from "@supabase/ssr";
import { invariant } from "../assert.ts";
import { MissingEnvError, requireEnv } from "../env.ts";
import { err, ok, type Result } from "../types.ts";

export function supabaseBrowser() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  invariant(url.startsWith("https://"), "supabase url must use https");
  invariant(key.length > 20, "supabase anon key looks truncated");

  return createBrowserClient(url, key);
}

export function supabaseBrowserResult(): Result<ReturnType<typeof supabaseBrowser>> {
  try {
    return ok(supabaseBrowser());
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return err(
        `${error.variable} is not set. Copy .env.local.example to .env.local and fill it in.`,
      );
    }
    throw error;
  }
}
