"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  LogOut,
} from "lucide-react";
import { supabaseBrowserResult } from "@/lib/supabase/client";

const OLD_LINK = "text-sm font-medium text-[#27395b] hover:text-indigo-600";

const OLD_SIGN_OUT =
  "ml-auto rounded-lg border border-[#bcd2ff] bg-white px-4 py-2 text-sm font-bold " +
  "text-indigo-600 hover:bg-indigo-50";

const OLD_NAV =
  "flex items-center gap-6 border-b border-[#e2eaf5] bg-white px-6 py-2 md:px-12";

const APP_HEADER =
  "sticky top-0 z-50 border-b border-[#e4eaf5] bg-white/95 shadow-sm backdrop-blur-xl";

const APP_NAV =
  "mx-auto flex min-h-20 max-w-7xl flex-wrap items-center gap-4 px-5 py-2 md:px-8";

const BRAND_LINK = "flex shrink-0 items-center gap-2";

const LINK_ROW = "flex flex-1 flex-wrap items-center justify-center gap-1 md:gap-3";

const APP_LINK =
  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold " +
  "transition-all duration-200";

const SIGN_OUT =
  "ml-auto flex items-center gap-2 rounded-xl border border-[#dbe5f5] bg-white px-4 py-2.5 " +
  "text-sm font-semibold text-[#52617d] transition hover:border-red-200 hover:bg-red-50 " +
  "hover:text-red-600";

const LOG_IN =
  "ml-auto rounded-xl bg-[#1464f4] px-5 py-2.5 text-sm font-bold text-white " +
  "transition hover:bg-[#0f4fc4]";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/generate", label: "AI Generator", Icon: Sparkles },
  { href: "/onboarding", label: "My Business", Icon: Building2 },
];

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const client = supabaseBrowserResult();

    if (!client.ok) return;

    const supabase = client.value;

    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(data.user !== null);
    });

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSignedIn(session !== null);
      }
    );

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

  if (pathname === "/") {
    return null;
  }

  if (pathname === "/login") {
    return <LoginNav signedIn={signedIn} onSignOut={() => void signOut()} />;
  }

  return (
    <AppHeader signedIn={signedIn} pathname={pathname} onSignOut={() => void signOut()} />
  );
}

function LoginNav({ signedIn, onSignOut }: { signedIn: boolean | null; onSignOut: () => void }) {
  return (
    <nav className={OLD_NAV}>
      <Link href="/" className="shrink-0">
        <Image
          src="/contentcraft-logo.png"
          alt="ContentCraft"
          width={160}
          height={160}
          priority
          className="h-24 w-24 object-contain"
        />
      </Link>

      {signedIn === true ? (
        <>
          <Link href="/dashboard" className={OLD_LINK}>Dashboard</Link>
          <Link href="/generate" className={OLD_LINK}>Generate</Link>
          <Link href="/onboarding" className={OLD_LINK}>Business profile</Link>
          <button type="button" onClick={onSignOut} className={OLD_SIGN_OUT}>
            Sign out
          </button>
        </>
      ) : (
        <Link href="/login" className={`${OLD_LINK} ml-auto`}>
          Log in
        </Link>
      )}
    </nav>
  );
}

function AppHeader({
  signedIn,
  pathname,
  onSignOut,
}: {
  signedIn: boolean | null;
  pathname: string;
  onSignOut: () => void;
}) {
  return (
    <header className={APP_HEADER}>
      <nav className={APP_NAV}>
        <Link href="/dashboard" className={BRAND_LINK}>
          <Image
            src="/contentcraft-logo.png"
            alt="ContentCraft"
            width={72}
            height={72}
            priority
            className="h-16 w-16 object-contain"
          />
          <span className="text-xl font-extrabold tracking-tight text-[#101c3a]">
            Content<span className="text-[#1464f4]">Craft</span>
          </span>
        </Link>

        {signedIn === true ? (
          <>
            <div className={LINK_ROW}>
              {LINKS.map(({ href, label, Icon }) => {
                const active = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`${APP_LINK} ${
                      active
                        ? "bg-[#eaf2ff] text-[#1464f4]"
                        : "text-[#52617d] hover:bg-[#f3f7ff] hover:text-[#1464f4]"
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </Link>
                );
              })}
            </div>

            <button type="button" onClick={onSignOut} className={SIGN_OUT}>
              <LogOut size={17} />
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className={LOG_IN}>
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
