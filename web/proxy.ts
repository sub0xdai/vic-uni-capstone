import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { invariant } from "@/lib/assert";
import { optionalEnv } from "@/lib/env";

const GUARDED = ["/dashboard", "/onboarding", "/generate"];
const SIGN_IN = "/login";

export async function proxy(request: NextRequest) {
  invariant(request.nextUrl.pathname.startsWith("/"), "request path is not absolute");
  invariant(GUARDED.length > 0, "no routes are guarded");

  const url = optionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (url === null || key === null) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = data?.claims !== undefined && data?.claims !== null;
  const path = request.nextUrl.pathname;
  const guarded = GUARDED.some((prefix) => path.startsWith(prefix));

  if (guarded && !signedIn) {
    const target = request.nextUrl.clone();
    target.pathname = SIGN_IN;
    invariant(target.pathname === SIGN_IN, "redirect target was not applied");
    return NextResponse.redirect(target);
  }

  if (path === SIGN_IN && signedIn) {
    const target = request.nextUrl.clone();
    target.pathname = GUARDED[0];
    invariant(target.pathname === GUARDED[0], "redirect target was not applied");
    return NextResponse.redirect(target);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|preview).*)"],
};
