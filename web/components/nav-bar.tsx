"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowserResult } from "@/lib/supabase/client";

const LINK = "text-sm font-medium text-neutral-700 hover:text-indigo-600";
const SIGN_OUT =
  "ml-auto rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium " +
  "text-neutral-800 hover:bg-neutral-50";

export function NavBar() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const client = supabaseBrowserResult();
    if (!client.ok) {
      return;
    }
    const supabase = client.value;
    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(data.user !== null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(session !== null);
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const client = supabaseBrowserResult();
    if (client.ok) {
      await client.value.auth.signOut();
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="flex items-center gap-6 border-b border-black/10 bg-white px-6 py-4">
      <Link href="/" className="text-base font-semibold text-neutral-900">
        ContentCraft
      </Link>

      {signedIn === true ? (
        <>
          <Link href="/dashboard" className={LINK}>
            Dashboard
          </Link>
          <Link href="/onboarding" className={LINK}>
            Business profile
          </Link>
          <button type="button" onClick={signOut} className={SIGN_OUT}>
            Sign out
          </button>
        </>
      ) : (
        <Link href="/login" className={`${LINK} ml-auto`}>
          Log in
        </Link>
      )}
    </nav>
  );
}
