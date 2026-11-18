"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  Copy,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutGrid,
  Library,
  Mail,
  MessageSquare,
  PenLine,
  RefreshCw,
  Save,
  Settings,
} from "lucide-react";

import { Field, controlClass } from "@/components/ui";
import {
  CONTENT_TYPES,
  generateCopy,
  sampleCopy,
  type LandingBrief,
  type LandingContentType,
} from "@/lib/landing";

const TYPE_ICONS: Record<LandingContentType, typeof MessageSquare> = {
  "Social Media Post": MessageSquare,
  "Email Newsletter": Mail,
  "Blog Outline": FileText,
  "Image Prompt": ImageIcon,
};

const BRIEF_FIELDS: Array<{ key: keyof LandingBrief; label: string; placeholder: string }> = [
  { key: "businessName", label: "Business Name", placeholder: "Sunrise Cafe" },
  { key: "audience", label: "Target Audience", placeholder: "Local customers, coffee lovers" },
  {
    key: "message",
    label: "Key Message (Optional)",
    placeholder: "Free pastry with every large coffee",
  },
];

const INDUSTRIES = ["Cafe / Restaurant", "Retail", "Fitness", "Beauty", "Trades", "Other"];

const RECENT = [
  {
    type: "Social Media Post" as const,
    snippet: "Freshly roasted, ready before your first meeting",
  },
  { type: "Email Newsletter" as const, snippet: "We saved you a seat. Tuesdays from 2pm" },
  { type: "Blog Outline" as const, snippet: "Four ways to fill a quiet afternoon" },
  { type: "Image Prompt" as const, snippet: "Warm product photo, morning light, no logos" },
];

const EMPTY_BRIEF: LandingBrief = {
  businessName: "",
  businessType: INDUSTRIES[0],
  audience: "",
  message: "",
};

const cardClass =
  "rounded-xl border border-[#e2e8f0] bg-white shadow-[0_6px_20px_rgba(15,23,42,0.05)]";
const outlineButton =
  "inline-flex items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-2.5 py-1.5 " +
  "text-[11px] font-semibold text-[#64748b] transition hover:border-[#1a65f2] hover:text-[#1a65f2]";
const iconBubble =
  "flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a65f2] text-white";
const promoButton =
  "mt-2.5 inline-flex rounded-lg border border-[#1a65f2] px-2.5 py-1 " +
  "text-[11px] font-semibold text-[#1a65f2]";
const readyBadge =
  "mt-1.5 inline-flex rounded-full bg-[#e8f7ee] px-2 py-0.5 " +
  "text-[9px] font-semibold text-[#12864a]";
const demoBadge =
  "inline-flex w-fit rounded-full bg-[#e8f7ee] px-2 py-0.5 " +
  "text-[9px] font-semibold text-[#12864a]";
const typeButton =
  "flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left " +
  "text-[11px] font-semibold transition";
const primaryButton =
  "w-full rounded-lg bg-[#1a65f2] px-3 py-2 text-xs font-bold text-white " +
  "transition hover:bg-[#1552c4]";
const outputBox =
  "mt-2 flex-1 whitespace-pre-wrap rounded-lg border border-[#e2e8f0] " +
  "bg-[#f8fafc] p-2.5 text-[11px] leading-5 text-[#334155]";

export function LandingPreview() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1fr_3fr_1fr]">
      <SidebarCard />
      <GeneratorCard />
      <RecentCard />
    </div>
  );
}

function SidebarCard() {
  const items = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Generate Content", icon: PenLine, active: false },
    { label: "My Business", icon: Building2, active: false },
    { label: "Content Library", icon: Library, active: false },
    { label: "Analytics", icon: BarChart3, active: false },
    { label: "Settings", icon: Settings, active: false },
  ];

  return (
    <div className={`${cardClass} flex flex-col gap-5 p-4`}>
      <div className="flex items-center gap-2.5">
        <span className={iconBubble}>
          <LayoutGrid className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#0f172a]">My Workspace</p>
          <p className="text-[11px] text-[#64748b]">Small Business</p>
        </div>
      </div>

      <nav aria-label="Workspace">
        <ul className="space-y-1">
          {items.map(({ label, icon: Icon, active }) => (
            <li key={label}>
              <span
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ${
                  active ? "bg-[#eaf1ff] text-[#1a65f2]" : "text-[#64748b]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto rounded-lg bg-[#eef4ff] p-3">
        <p className="text-xs font-bold text-[#0f172a]">Upgrade to Pro</p>
        <p className="mt-1 text-[11px] leading-4 text-[#64748b]">
          More drafts, more images, one flat price.
        </p>
        <span className={promoButton}>
          Upgrade Now
        </span>
      </div>
    </div>
  );
}

function RecentCard() {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#0f172a]">Recent Content</p>
        <span className="text-[11px] font-semibold text-[#1a65f2]">View All</span>
      </div>

      <ul className="mt-4 space-y-3">
        {RECENT.map(({ type, snippet }) => {
          const Icon = TYPE_ICONS[type];
          return (
            <li key={type} className="rounded-lg border border-[#e2e8f0] p-2.5">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-[#1a65f2]" />
                <span className="text-[11px] font-semibold text-[#0f172a]">{type}</span>
              </div>
              <p className="mt-1 text-[10px] leading-4 text-[#64748b]">{snippet}</p>
              <span className={readyBadge}>
                Ready
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GeneratorCard() {
  const [type, setType] = useState<LandingContentType>("Social Media Post");
  const [brief, setBrief] = useState<LandingBrief>(EMPTY_BRIEF);
  const [output, setOutput] = useState(() => sampleCopy("Social Media Post"));
  const [flash, setFlash] = useState<"copied" | "saved" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  function announce(next: "copied" | "saved") {
    setFlash(next);
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setFlash(null), 1500);
  }

  function selectType(next: LandingContentType) {
    setType(next);
    setOutput(sampleCopy(next));
    setFlash(null);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      announce("copied");
    } catch {
      setFlash(null);
    }
  }

  return (
    <div className={`${cardClass} p-4`}>
      <p className="text-sm font-bold text-[#0f172a]">AI Content Generator</p>
      <p className="mt-1 text-[11px] leading-4 text-[#64748b]">
        Enter your business details and let AI create amazing content for you.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
            Content Type
          </p>
          <ul className="mt-2 space-y-1">
            {CONTENT_TYPES.map((option) => {
              const Icon = TYPE_ICONS[option];
              const active = option === type;
              return (
                <li key={option}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectType(option)}
                    className={`${typeButton} ${
                      active
                        ? "border-[#1a65f2] bg-[#eaf1ff] text-[#1a65f2]"
                        : "border-[#e2e8f0] text-[#64748b] hover:border-[#1a65f2]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#94a3b8]">
            Your Business Details
          </p>
          {BRIEF_FIELDS.slice(0, 1).map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <input
                className={controlClass}
                placeholder={placeholder}
                value={brief[key]}
                onChange={(event) => setBrief({ ...brief, [key]: event.target.value })}
              />
            </Field>
          ))}

          <Field label="Business Type">
            <select
              className={controlClass}
              value={brief.businessType}
              onChange={(event) => setBrief({ ...brief, businessType: event.target.value })}
            >
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </Field>

          {BRIEF_FIELDS.slice(1).map(({ key, label, placeholder }) => (
            <Field key={key} label={label}>
              <input
                className={controlClass}
                placeholder={placeholder}
                value={brief[key]}
                onChange={(event) => setBrief({ ...brief, [key]: event.target.value })}
              />
            </Field>
          ))}

          <button
            type="button"
            onClick={() => {
              setOutput(generateCopy(type, brief));
              setFlash(null);
            }}
            className={primaryButton}
          >
            + Generate Content
          </button>
        </div>

        <div className="flex flex-col">
          <span className={demoBadge}>
            Demo Output Preview - Sample Only
          </span>

          <div className={outputBox}>
            {output}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" className={outlineButton} onClick={() => void copy()}>
              <Copy className="h-3 w-3" />
              {flash === "copied" ? "Copied" : "Copy"}
            </button>
            <button type="button" className={outlineButton} onClick={() => announce("saved")}>
              <Save className="h-3 w-3" />
              {flash === "saved" ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              className={outlineButton}
              onClick={() => {
                setOutput(generateCopy(type, brief));
                setFlash(null);
              }}
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
