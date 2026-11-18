import Link from "next/link";
import {
  Building2,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  Library,
  MousePointerClick,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

const CONTAINER = "mx-auto w-full max-w-[1140px] px-5";
const SECTION = `${CONTAINER} scroll-mt-20 py-16`;
const PILL =
  "inline-flex items-center gap-1 rounded-full bg-[#eaf1ff] px-2.5 py-1 " +
  "text-[11px] font-bold text-[#1a65f2]";
const H2 = "mt-3 text-[26px] font-extrabold tracking-tight text-[#0f172a] sm:text-[30px]";
const LEAD = "mt-2 text-[13px] leading-6 text-[#64748b]";

const CARD =
  "flex h-full flex-col rounded-xl border border-[#e2e8f0] bg-white p-6 " +
  "shadow-[0_4px_16px_rgba(15,23,42,0.05)]";

const ICON_BOX =
  "flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf1ff] text-[#1a65f2]";

const PRIMARY_BUTTON =
  "mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#1a65f2] " +
  "px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1552c4]";

const OUTLINE_BUTTON =
  "mt-5 inline-flex w-full items-center justify-center rounded-lg border " +
  "border-[#cbd5e1] bg-white px-4 py-2.5 text-sm font-bold text-[#1a65f2] " +
  "transition hover:border-[#1a65f2]";

const FEATURES = [
  {
    icon: LayoutGrid,
    title: "Multi-format output",
    body: "Social posts, email newsletters, blog outlines and images, all from one brief.",
  },
  {
    icon: Building2,
    title: "Business profile memory",
    body: "Save the business name, industry, tone and audience once; every draft starts from it.",
  },
  {
    icon: RefreshCw,
    title: "Instant variations",
    body: "Ask again for a different take. Every draft is scored, so the versions are comparable.",
  },
  {
    icon: Library,
    title: "Organised content library",
    body: "Every draft on one dashboard, with its status, star rating and quality score.",
  },
];

const STEPS = [
  {
    title: "Enter your business details",
    body: "Add the business type, the audience you want to reach, and the message to land.",
  },
  {
    title: "Choose your format",
    body: "Pick a social post, an email newsletter, a blog outline, or an image prompt.",
  },
  {
    title: "Generate and save",
    body: "Copy the draft, mark it ready, or rate it so the quality score learns what you like.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    note: "For trying the workflow",
    highlight: false,
    items: [
      "20 draft generations a month",
      "3 images a day",
      "All four formats",
      "Dashboard with draft history",
    ],
    action: "Get Started Free",
    href: "/login",
  },
  {
    name: "Pro",
    price: "$19",
    note: "For a business that publishes every week",
    highlight: true,
    items: [
      "Unlimited generations",
      "Saved brand profiles",
      "Full content library",
      "Priority generation speed",
      "Export tools",
    ],
    action: "Upgrade to Pro",
    href: "/login",
  },
  {
    name: "Team",
    price: "$49",
    note: "For agencies and multi-location businesses",
    highlight: false,
    items: [
      "Up to 5 team seats",
      "Multiple business workspaces",
      "Shared content library",
      "Usage analytics",
      "Priority support",
    ],
    action: "Contact Sales",
    href: "#contact",
  },
];

const STATS = [
  { icon: LayoutGrid, value: "4 formats", label: "Post, email, blog, image" },
  { icon: Sparkles, value: "20 a month", label: "Drafts on the free plan" },
  { icon: ImageIcon, value: "3 a day", label: "Images on the free plan" },
  { icon: Globe, value: "100% web", label: "Nothing to install" },
];

const CONTACT_URL = "https://github.com/sub0xdai/vic-uni-capstone/issues";

const STEP_LINE =
  "absolute left-[16%] right-[16%] top-5 hidden border-t border-dashed " +
  "border-[#cbd5e1] md:block";

const STEP_BADGE =
  "mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#1a65f2] " +
  "text-sm font-bold text-white";

const POPULAR_BADGE =
  "absolute right-4 top-4 rounded-full bg-[#1a65f2] px-2 py-0.5 text-[10px] " +
  "font-bold text-white";

const PRICE =
  "mt-2 text-[28px] font-extrabold leading-none tracking-tight text-[#0f172a]";

const ABOUT_CARD =
  "rounded-xl border border-[#e2e8f0] bg-white p-8 " +
  "shadow-[0_4px_16px_rgba(15,23,42,0.05)]";

const CTA_BANNER =
  "flex flex-col items-center gap-4 rounded-xl bg-[#1a65f2] px-6 py-8 text-center " +
  "sm:flex-row sm:justify-between sm:text-left";

const CTA_BUTTON =
  "inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm " +
  "font-bold text-[#1a65f2] transition hover:bg-[#eef4ff]";

export function FeaturesSection() {
  return (
    <section id="features" className={SECTION}>
      <div className="text-center">
        <span className={PILL}>Features</span>
        <h2 className={H2}>Everything you need to market your business</h2>
        <p className={LEAD}>Four things the build does, without a second tool.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className={CARD}>
            <span className={ICON_BOX}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[13px] font-bold text-[#0f172a]">{title}</p>
            <p className="mt-1.5 text-[12px] leading-5 text-[#64748b]">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className={SECTION}>
      <div className="text-center">
        <span className={PILL}>How It Works</span>
        <h2 className={H2}>From idea to published post in 3 steps</h2>
      </div>

      <div className="relative mt-10">
        <div aria-hidden="true" className={STEP_LINE} />

        <ol className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="text-center">
              <span className={STEP_BADGE}>{index + 1}</span>
              <p className="mt-3 text-[13px] font-bold text-[#0f172a]">{step.title}</p>
              <p className="mx-auto mt-1.5 max-w-[280px] text-[12px] leading-5 text-[#64748b]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className={SECTION}>
      <div className="text-center">
        <span className={PILL}>Pricing</span>
        <h2 className={H2}>Simple, transparent pricing</h2>
        <p className={LEAD}>Start free. Upgrade when you need more volume.</p>
        <p className="mt-2 text-[11px] text-[#94a3b8]">
          Planned pricing for the next release. This build has one free plan: twenty drafts
          and three images a day.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        {PLANS.map(({ name, price, note, highlight, items, action, href }) => (
          <div
            key={name}
            className={`relative flex h-full flex-col rounded-xl bg-white p-6 ${
              highlight
                ? "border-2 border-[#1a65f2] shadow-[0_10px_30px_rgba(26,101,242,0.14)]"
                : "border border-[#e2e8f0] shadow-[0_4px_16px_rgba(15,23,42,0.05)]"
            }`}
          >
            {highlight ? (
              <span className={POPULAR_BADGE}>Most Popular</span>
            ) : null}

            <p className="text-[13px] font-bold text-[#0f172a]">{name}</p>
            <p className={PRICE}>
              {price}
              <span className="ml-1 text-[12px] font-medium text-[#64748b]">/ month</span>
            </p>
            <p className="mt-1.5 text-[11px] text-[#64748b]">{note}</p>

            <ul className="mt-4 flex-1 space-y-1.5">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[12px] text-[#475569]">
                  <MousePointerClick className="mt-0.5 h-3 w-3 shrink-0 text-[#1a65f2]" />
                  {item}
                </li>
              ))}
            </ul>

            <Link href={href} className={highlight ? PRIMARY_BUTTON : OUTLINE_BUTTON}>
              {action}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section id="about" className={SECTION}>
      <div className={ABOUT_CARD}>
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[3fr_2fr]">
          <div>
            <span className={PILL}>About</span>
            <h2 className={H2}>Built for small business owners, not prompt engineers</h2>
            <p className="mt-3 text-[13px] leading-6 text-[#64748b]">
              Most copy tools hand you an empty box and a blinking cursor. ContentCraft starts
              from a brand profile you fill in once, so every draft already knows the business,
              the audience and the voice it has to sound like.
            </p>
            <p className="mt-3 text-[13px] leading-6 text-[#64748b]">
              Each draft arrives with a quality score and the reason behind every failed check,
              so the owner can see what is weak before it is published. Less time writing
              marketing copy, more time running the business.
            </p>
            <p id="contact" className="mt-4 scroll-mt-24 text-[12px] leading-5 text-[#475569]">
              Questions, a bug, or the Team plan: open an issue at{" "}
              <a
                href={CONTACT_URL}
                className="font-semibold text-[#1a65f2] underline hover:text-[#1552c4]"
              >
                github.com/sub0xdai/vic-uni-capstone
              </a>
              .
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={value} className="rounded-xl bg-[#eef4ff] p-4">
                <Icon className="h-4 w-4 text-[#1a65f2]" />
                <p className="mt-2 text-[15px] font-extrabold text-[#0f172a]">{value}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#64748b]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CallToAction() {
  return (
    <section className={`${CONTAINER} pb-10`}>
      <div className={CTA_BANNER}>
        <div>
          <p className="text-lg font-extrabold text-white">
            Ready to turn your ideas into content?
          </p>
          <p className="mt-1 text-[12px] text-[#dbe7ff]">
            Free to start. No card, no install, one brand profile.
          </p>
        </div>
        <Link href="/login" className={CTA_BUTTON}>
          Get Started Free
          <Users className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
