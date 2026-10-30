"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowserResult } from "@/lib/supabase/client";

const LINK = "text-sm font-medium text-[#27395b] hover:text-indigo-600";
const SIGN_OUT =
  "ml-auto rounded-lg border border-[#bcd2ff] bg-white px-4 py-2 text-sm font-bold " +
  "text-indigo-600 hover:bg-indigo-50";

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
    <nav className="flex items-center gap-6 border-b border-[#e2eaf5] bg-white px-6 py-4 md:px-12">
      <Link href="/" className="text-2xl font-extrabold text-neutral-900">
        Content<span className="text-indigo-600">Craft</span>
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