
"use client";

import { createBrowserClient } from "@supabase/ssr";
import { invariant } from "../assert.ts";
import { err, ok, type Result } from "../types.ts";

// LOCAL TEST ONLY. Next.js needs public environment variables
// written explicitly so they are included in the browser bundle.
function readKeys() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function supabaseBrowser() {
  const { url, key } = readKeys();

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");

  invariant(url.startsWith("https://"), "supabase url must use https");
  invariant(key.length > 20, "supabase anon key looks truncated");

  return createBrowserClient(url, key);
}

export function supabaseBrowserResult(): Result<
  ReturnType<typeof supabaseBrowser>
> {
  const { url, key } = readKeys();

  if (!url) {
    return err(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Copy .env.local.example to .env.local and fill it in.",
    );
  }

  if (!key) {
    return err(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Copy .env.local.example to .env.local and fill it in.",
    );
  }

  return ok(supabaseBrowser());
}
