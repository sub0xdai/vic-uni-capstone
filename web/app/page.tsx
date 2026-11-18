import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Gauge,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  MessageSquare,
  Play,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

import { LandingPreview } from "@/components/landing-preview";
import { optionalEnv } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AIContentPro",
  description:
    "Marketing content for small businesses, written in seconds and scored before you publish.",
};

const NAV_LINKS = [
  { label: "Home", href: "#top", active: true },
  { label: "Features", href: "#features", active: false },
  { label: "How It Works", href: "#preview", active: false },
];

const SAMPLES = [
  { label: "Social Media Posts", icon: MessageSquare, position: "left-0 top-6" },
  { label: "Blog Ideas", icon: FileText, position: "right-0 top-20" },
  { label: "Email Newsletters", icon: Mail, position: "left-2 bottom-20" },
  { label: "Image Prompts", icon: ImageIcon, position: "right-2 bottom-6" },
];

const FEATURES = [
  { label: "Small businesses", icon: Users, detail: "For the owner who writes the posts too" },
  { label: "4 formats", icon: LayoutGrid, detail: "Social post, email, blog, image" },
  { label: "Simple workflow", icon: Workflow, detail: "Describe, generate, edit, publish" },
  { label: "Dashboard", icon: Gauge, detail: "Every draft, score and cost together" },
];

const primaryLink =
  "inline-flex items-center gap-2 rounded-xl bg-[#1a65f2] px-5 py-3 " +
  "text-sm font-bold text-white transition hover:bg-[#1552c4]";
const outlineLink =
  "inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-5 py-3 " +
  "text-sm font-bold text-[#0f172a] transition hover:border-[#1a65f2] hover:text-[#1a65f2]";
const navPill =
  "rounded-lg border border-[#1a65f2] px-4 py-2 text-sm font-semibold " +
  "text-[#1a65f2] transition hover:bg-[#eaf1ff]";
const navSolid =
  "rounded-lg bg-[#1a65f2] px-4 py-2 text-sm font-semibold text-white " +
  "transition hover:bg-[#1552c4]";
const heroSection =
  "mx-auto grid w-full max-w-[1200px] items-center gap-10 px-5 py-14 lg:grid-cols-2";
const heroBadge =
  "inline-flex items-center gap-1.5 rounded-full bg-[#eaf1ff] px-3 py-1.5 " +
  "text-xs font-bold text-[#1a65f2]";
const glow =
  "absolute inset-x-8 top-1/2 h-[260px] -translate-y-1/2 rounded-full " +
  "bg-[radial-gradient(circle,#d9e7ff_0%,rgba(217,231,255,0)_70%)]";
const samplePill =
  "absolute z-20 inline-flex items-center gap-1.5 rounded-full border border-[#e2e8f0] " +
  "bg-white px-3 py-1.5 text-[11px] font-semibold shadow-[0_6px_20px_rgba(15,23,42,0.08)]";
const featureCard =
  "grid grid-cols-1 gap-6 rounded-xl border border-[#e2e8f0] bg-white p-6 " +
  "shadow-[0_6px_20px_rgba(15,23,42,0.05)] sm:grid-cols-2 lg:grid-cols-4";
const featureIcon =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg " +
  "bg-[#eaf1ff] text-[#1a65f2]";

export default async function Home() {
  const configured =
    optionalEnv("NEXT_PUBLIC_SUPABASE_URL") !== null &&
    optionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") !== null;

  if (configured) {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims !== undefined) {
      redirect("/dashboard");
    }
  }

  return (
    <div id="top" className="min-h-screen bg-[#f4f7fb] text-[#0f172a]">
      <LandingNav />
      <Hero />
      <FeatureStrip />
      <section id="preview" className="mx-auto w-full max-w-[1200px] px-5 pb-16">
        <LandingPreview />
      </section>
      <footer className="border-t border-[#e2e8f0] py-6 text-center text-xs text-[#64748b]">
        AIContentPro, a Victoria University capstone project.
      </footer>
    </div>
  );
}

function LandingNav() {
  return (
    <header className="border-b border-[#e2e8f0] bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-6 px-5 py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <GeometricMark />
          <span className="text-base font-extrabold tracking-tight">
            AI<span className="text-[#1a65f2]">Content</span>Pro
          </span>
        </Link>

        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV_LINKS.map(({ label, href, active }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`block py-2 text-sm font-semibold transition ${
                    active ? "text-[#1a65f2]" : "text-[#64748b] hover:text-[#0f172a]"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className={navPill}>
            Login
          </Link>
          <Link href="/login" className={navSolid}>
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}

function GeometricMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" role="img" aria-label="AIContentPro logo">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="#eaf1ff" />
      <path d="M16 7.5 24 24H8Z" fill="#1a65f2" />
      <path d="M16 16 20 24h-8Z" fill="#94a3b8" />
    </svg>
  );
}

function Hero() {
  return (
    <section className={heroSection}>
      <div>
        <span className={heroBadge}>
          <Sparkles className="h-3.5 w-3.5" />
          AI Powered for Small Business
        </span>

        <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          Turn Your Ideas into
          <br />
          <span className="text-[#1a65f2]">Powerful Content</span>
          <br />
          with AI
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-[#64748b]">
          Create social media posts, email newsletters, blog ideas and more in seconds.
          Save time, grow your business, and connect with more customers.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/login" className={primaryLink}>
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#preview" className={outlineLink}>
            <Play className="h-4 w-4" />
            See the demo
          </a>
        </div>
      </div>

      <HeroArt />
    </section>
  );
}

function HeroArt() {
  return (
    <div className="relative mx-auto h-[320px] w-full max-w-[460px]">
      <div className={glow} />

      <svg
        viewBox="0 0 320 260"
        className="relative z-10 mx-auto h-full w-full max-w-[320px]"
        role="img"
        aria-label="A person working on a laptop"
      >
        <rect x="70" y="196" width="180" height="10" rx="5" fill="#cbd5e1" />
        <path d="M118 96a42 42 0 0 1 84 0v58h-84Z" fill="#1a65f2" />
        <circle cx="160" cy="78" r="26" fill="#f5c9a7" />
        <path d="M134 74a26 26 0 0 1 52 0c-9-7-19-10-26-10s-17 3-26 10Z" fill="#0f172a" />
        <rect x="104" y="126" width="112" height="70" rx="8" fill="#0f172a" />
        <rect x="112" y="134" width="96" height="8" rx="4" fill="#60a5fa" />
        <rect x="112" y="148" width="70" height="6" rx="3" fill="#334155" />
        <rect x="112" y="160" width="82" height="6" rx="3" fill="#334155" />
        <rect x="112" y="172" width="52" height="6" rx="3" fill="#334155" />
        <rect x="92" y="196" width="136" height="8" rx="4" fill="#94a3b8" />
      </svg>

      {SAMPLES.map(({ label, icon: Icon, position }) => (
        <span
          key={label}
          className={`${samplePill} ${position}`}
        >
          <Icon className="h-3.5 w-3.5 text-[#1a65f2]" />
          {label}
        </span>
      ))}
    </div>
  );
}

function FeatureStrip() {
  return (
    <section id="features" className="mx-auto w-full max-w-[1200px] px-5 pb-12">
      <div className={featureCard}>
        {FEATURES.map(({ label, icon: Icon, detail }) => (
          <div key={label} className="flex items-start gap-3">
            <span className={featureIcon}>
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold">{label}</p>
              <p className="mt-0.5 text-xs leading-5 text-[#64748b]">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
