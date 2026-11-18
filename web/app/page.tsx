import Image from "next/image";
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

import { LandingNavLinks } from "@/components/landing-nav-links";
import { LandingPreview } from "@/components/landing-preview";
import {
  AboutSection,
  CallToAction,
  FeaturesSection,
  HowItWorksSection,
  PricingSection,
} from "@/components/landing-sections";
import { optionalEnv } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CONTAINER = "mx-auto w-full max-w-[1140px] px-5";

const SAMPLES = [
  { label: "Social Media Posts", icon: MessageSquare, position: "left-0 top-1" },
  { label: "Blog Ideas", icon: FileText, position: "right-0 top-1" },
  { label: "Email Newsletters", icon: Mail, position: "left-0 bottom-1" },
  { label: "Image Prompts", icon: ImageIcon, position: "right-0 bottom-1" },
];

const FEATURES = [
  { label: "Small businesses", icon: Users, detail: "For the owner who writes the posts too" },
  { label: "4 formats", icon: LayoutGrid, detail: "Social post, email, blog, image" },
  { label: "Simple workflow", icon: Workflow, detail: "Describe, generate, edit, publish" },
  { label: "Dashboard", icon: Gauge, detail: "Every draft, score and cost together" },
];

const GLOW =
  "bg-[radial-gradient(circle,rgba(59,130,246,0.22)_0%,rgba(59,130,246,0)_70%)]";

const NAV_LOGIN =
  "rounded-lg border border-[#1a65f2] bg-white px-3.5 py-1.5 text-[13px] " +
  "font-semibold text-[#1a65f2] transition hover:bg-[#eaf1ff]";

const NAV_SIGNUP =
  "rounded-lg bg-[#1a65f2] px-3.5 py-1.5 text-[13px] font-semibold text-white " +
  "transition hover:bg-[#1552c4]";

const HERO_SECTION =
  `${CONTAINER} grid scroll-mt-20 items-center gap-8 py-8 lg:grid-cols-[1fr_420px] lg:py-9`;

const PRIMARY_ACTION =
  "inline-flex items-center gap-2 rounded-lg bg-[#1a65f2] px-4 py-2.5 text-sm " +
  "font-bold text-white transition hover:bg-[#1552c4]";

const SECONDARY_ACTION =
  "inline-flex items-center gap-2 rounded-lg border border-[#cbd5e1] bg-white px-4 " +
  "py-2.5 text-sm font-bold text-[#1a65f2] transition hover:border-[#1a65f2]";

const SAMPLE_PILL =
  "absolute z-20 inline-flex items-center gap-1 rounded-full border border-[#e2e8f0] " +
  "bg-white px-2.5 py-1 text-[11px] font-semibold shadow-[0_4px_14px_rgba(15,23,42,0.08)]";

const FEATURE_CARD =
  "grid grid-cols-1 gap-4 rounded-xl border border-[#e2e8f0] bg-white p-4 " +
  "shadow-[0_4px_14px_rgba(15,23,42,0.04)] sm:grid-cols-2 lg:grid-cols-4";

const FEATURE_ICON =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#1a65f2]";

const HERO_BADGE =
  "inline-flex items-center gap-1 rounded-full bg-[#eaf1ff] px-2.5 py-1 " +
  "text-[11px] font-bold text-[#1a65f2]";

const HERO_HEADLINE =
  "mt-3 text-[30px] font-extrabold leading-[1.12] tracking-tight sm:text-[36px]";

const FOOTER =
  "border-t border-[#e2e8f0] bg-white py-3 text-center text-[11px] text-[#64748b]";

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
      <section id="preview" className={`${CONTAINER} pb-8`}>
        <LandingPreview />
      </section>
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <AboutSection />
      <CallToAction />
      <LandingFooter />
    </div>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
      <div className={`${CONTAINER} flex items-center gap-6 py-2.5`}>
        <Link href="/" className="flex shrink-0 items-center gap-1.5">
          <BrandMark />
          <span className="text-[15px] font-extrabold tracking-tight">
            Content<span className="text-[#1a65f2]">Craft</span>
          </span>
        </Link>

        <LandingNavLinks />

        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className={NAV_LOGIN}>
            Login
          </Link>
          <Link href="/login" className={NAV_SIGNUP}>
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <Image
      src="/contentcraft-owl.png"
      alt=""
      width={128}
      height={128}
      priority
      className="h-8 w-auto object-contain"
    />
  );
}

function Hero() {
  return (
    <section id="home" className={HERO_SECTION}>
      <div>
        <span className={HERO_BADGE}>
          <Sparkles className="h-3 w-3" />
          AI Powered for Small Business
        </span>

        <h1 className={HERO_HEADLINE}>
          Turn Your Ideas into
          <br />
          <span className="text-[#1a65f2]">Powerful Content</span>
          <br />
          with AI
        </h1>

        <p className="mt-3 max-w-lg text-[13px] leading-6 text-[#64748b]">
          Create social media posts, email newsletters, blog ideas and more in seconds.
          Save time, grow your business, and connect with more customers.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Link href="/login" className={PRIMARY_ACTION}>
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#preview" className={SECONDARY_ACTION}>
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
    <div className="relative mx-auto h-[252px] w-full max-w-[400px]">
      <div
        className={`${GLOW} absolute left-1/2 top-1/2 h-[236px] w-[236px] ` +
          `-translate-x-1/2 -translate-y-1/2 rounded-full`}
      />

      <Image
        src="/landing/person-at-laptop.svg"
        alt="A person working at a laptop"
        width={1210}
        height={1333}
        unoptimized
        className="relative z-10 mx-auto h-full w-auto"
      />

      {SAMPLES.map(({ label, icon: Icon, position }) => (
        <span key={label} className={`${SAMPLE_PILL} ${position}`}>
          <Icon className="h-3 w-3 text-[#1a65f2]" />
          {label}
        </span>
      ))}
    </div>
  );
}

function FeatureStrip() {
  return (
    <section className={`${CONTAINER} pb-6`}>
      <div className={FEATURE_CARD}>
        {FEATURES.map(({ label, icon: Icon, detail }) => (
          <div key={label} className="flex items-start gap-2.5">
            <span className={FEATURE_ICON}>
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-bold">{label}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#64748b]">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className={FOOTER}>
      <span>© 2026 ContentCraft. A Victoria University capstone project.</span>
    </footer>
  );
}
