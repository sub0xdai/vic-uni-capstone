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
  { key: "message", label: "Key Message (Optional)", placeholder: "Free pastry with every coffee" },
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

const CARD =
  "flex h-full flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 " +
  "shadow-[0_4px_16px_rgba(15,23,42,0.05)]";

const LABEL = "mb-1 block text-[11px] font-medium text-[#475569]";

const INPUT =
  "h-[34px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2 text-xs " +
  "text-[#0f172a] outline-none focus:border-[#1a65f2]";

const COLUMN_TITLE =
  "mb-2 text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]";

const OUTLINE_BUTTON =
  "inline-flex items-center gap-1 rounded-md border border-[#cbd5e1] px-2 py-1 " +
  "text-[10px] font-semibold text-[#475569] transition hover:border-[#1a65f2] " +
  "hover:text-[#1a65f2]";

const BADGE =
  "inline-flex w-fit rounded-full bg-[#e8f7ee] px-2 py-0.5 text-[9px] " +
  "font-semibold text-[#12864a]";

const MENU_ITEM = "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium";

const WORKSPACE_ICON =
  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a65f2] text-white";

const UPGRADE_BUTTON =
  "mt-2 inline-flex rounded-md border border-[#1a65f2] px-2 py-0.5 " +
  "text-[10px] font-semibold text-[#1a65f2]";

const READY_TAG =
  "mt-1 inline-flex rounded-full bg-[#e8f7ee] px-1.5 py-0.5 text-[8px] " +
  "font-semibold text-[#12864a]";

const OUTPUT_BOX =
  "mt-1.5 flex-1 whitespace-pre-wrap rounded-lg border border-[#e2e8f0] " +
  "bg-[#f8fafc] p-2 text-xs leading-[1.45] text-[#334155]";

const PRIMARY_BUTTON =
  "w-full rounded-lg bg-[#1a65f2] px-3 py-2 text-xs font-bold text-white " +
  "transition hover:bg-[#1552c4]";

export function LandingPreview() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_3fr_1fr]">
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
    <div className={CARD}>
      <div className="flex items-center gap-2">
        <span className={WORKSPACE_ICON}>
          <LayoutGrid className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[13px] font-bold text-[#0f172a]">My Workspace</p>
          <p className="text-[10px] text-[#64748b]">Small Business</p>
        </div>
      </div>

      <nav aria-label="Workspace" className="mt-3">
        <ul className="space-y-0.5">
          {items.map(({ label, icon: Icon, active }) => (
            <li key={label}>
              <span
                className={`${MENU_ITEM} ${
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

      <div className="mt-auto rounded-lg bg-[#eef4ff] p-2.5">
        <p className="text-[11px] font-bold text-[#0f172a]">Upgrade to Pro</p>
        <p className="mt-0.5 text-[10px] leading-4 text-[#64748b]">
          More drafts, more images, one flat price.
        </p>
        <span className={UPGRADE_BUTTON}>
          Upgrade Now
        </span>
      </div>
    </div>
  );
}

function RecentCard() {
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-[#0f172a]">Recent Content</p>
        <span className="text-[10px] font-semibold text-[#1a65f2]">View All</span>
      </div>

      <ul className="mt-2 space-y-2">
        {RECENT.map(({ type, snippet }) => {
          const Icon = TYPE_ICONS[type];
          return (
            <li key={type} className="rounded-lg border border-[#e2e8f0] px-2 py-1.5">
              <div className="flex items-center gap-1">
                <Icon className="h-3 w-3 text-[#1a65f2]" />
                <span className="text-[10px] font-semibold text-[#0f172a]">{type}</span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-[9px] leading-3 text-[#64748b]">
                {snippet}
              </p>
              <span className={READY_TAG}>
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

  function build() {
    setOutput(generateCopy(type, brief));
    setFlash(null);
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
    <div className={CARD}>
      <p className="text-[13px] font-bold text-[#0f172a]">AI Content Generator</p>
      <p className="mt-0.5 text-[11px] leading-4 text-[#64748b]">
        Enter your business details and let AI create amazing content for you.
      </p>

      <div className="mt-3 grid flex-1 gap-3 sm:grid-cols-3">
        <div>
          <p className={COLUMN_TITLE}>Content Type</p>
          <ul className="space-y-1">
            {CONTENT_TYPES.map((option) => {
              const Icon = TYPE_ICONS[option];
              const active = option === type;
              return (
                <li key={option}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectType(option)}
                    className={`flex w-full items-center gap-1.5 rounded-lg border px-2 py-1.5 ` +
                      `text-left text-[10px] font-semibold transition ${
                        active
                          ? "border-[#1a65f2] bg-[#eaf1ff] text-[#1a65f2]"
                          : "border-[#e2e8f0] text-[#64748b] hover:border-[#1a65f2]"
                      }`}
                  >
                    <Icon className="h-3 w-3" />
                    {option}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className={COLUMN_TITLE}>Your Business Details</p>

          <label className="block">
            <span className={LABEL}>Business Name</span>
            <input
              className={INPUT}
              placeholder={BRIEF_FIELDS[0].placeholder}
              value={brief.businessName}
              onChange={(event) => setBrief({ ...brief, businessName: event.target.value })}
            />
          </label>

          <label className="mt-2 block">
            <span className={LABEL}>Business Type</span>
            <select
              className={INPUT}
              value={brief.businessType}
              onChange={(event) => setBrief({ ...brief, businessType: event.target.value })}
            >
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-2 block">
            <span className={LABEL}>Target Audience</span>
            <input
              className={INPUT}
              placeholder={BRIEF_FIELDS[1].placeholder}
              value={brief.audience}
              onChange={(event) => setBrief({ ...brief, audience: event.target.value })}
            />
          </label>

          <label className="mt-2 block">
            <span className={LABEL}>Key Message</span>
            <input
              className={INPUT}
              placeholder={BRIEF_FIELDS[2].placeholder}
              value={brief.message}
              onChange={(event) => setBrief({ ...brief, message: event.target.value })}
            />
          </label>

          <button type="button" onClick={build} className={`${PRIMARY_BUTTON} mt-2.5`}>
            + Generate Content
          </button>
        </div>

        <div className="flex flex-col">
          <p className={COLUMN_TITLE}>Generated Content</p>
          <span className={BADGE}>Demo Output Preview - Sample Only</span>

          <div className={OUTPUT_BOX}>
            {output}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1">
            <button type="button" className={OUTLINE_BUTTON} onClick={() => void copy()}>
              <Copy className="h-3 w-3" />
              {flash === "copied" ? "Copied" : "Copy"}
            </button>
            <button type="button" className={OUTLINE_BUTTON} onClick={() => announce("saved")}>
              <Save className="h-3 w-3" />
              {flash === "saved" ? "Saved" : "Save"}
            </button>
            <button type="button" className={OUTLINE_BUTTON} onClick={build}>
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
