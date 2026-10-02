import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { invariant } from "../assert.ts";
import { requireEnv } from "../env.ts";

export async function supabaseServer() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  invariant(url.startsWith("https://"), "supabase url must use https");
  invariant(key.length > 20, "supabase anon key looks truncated");

  const store = await cookies();
  invariant(typeof store.getAll === "function", "cookie store cannot be read");

  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          store.set(name, value, options);
        }
      },
    },
  });
}
