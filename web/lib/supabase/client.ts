"use client";

import { createBrowserClient } from "@supabase/ssr";
import { invariant } from "../assert.ts";
import { requireEnv } from "../env.ts";

export function supabaseBrowser() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  invariant(url.startsWith("https://"), "supabase url must use https");
  invariant(key.length > 20, "supabase anon key looks truncated");

  return createBrowserClient(url, key);
}
