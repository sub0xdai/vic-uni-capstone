"use client";

import { useState } from "react";
import { DraftEditor } from "@/components/draft-editor";
import { DraftList } from "@/components/draft-list";
import {
  statusCounts,
} from "@/lib/types";
import { GeneratorPanel } from "@/components/generator-panel";
import { ProfileForm } from "@/components/profile-form";
import { PromptPanel } from "@/components/prompt-panel";
import { Button, Card, Field, Stars, controlClass, controlErrorClass } from "@/components/ui";
import type {
  BusinessProfile,
  ContentType,
  Draft,
  QualityReport,
  StatusFilter,
} from "@/lib/types";

const PROFILE: BusinessProfile = {
  id: "00000000-0000-0000-0000-000000000001",
  userId: "00000000-0000-0000-0000-000000000002",
  businessName: "Footscray Coffee Roasters",
  industry: "Hospitality",
  description: "Small batch coffee roaster and cafe.",
  targetAudience: "Local coffee drinkers and home baristas.",
  brandTone: "friendly",
};

const ANALYSIS: QualityReport = {
  overallScore: 0.74,
  readabilityScore: 0.7,
  toneScore: 0.6,
  keywordScore: 1.0,
  structureScore: 0.7,
  userSatisfactionScore: 0.7,
};

const DRAFT: Draft = {
  id: "00000000-0000-0000-0000-000000000003",
  userId: PROFILE.userId,
  contentType: "social_caption",
  topic: "Single origin Ethiopian launch",
  keywords: ["single origin", "Ethiopia"],
  contentText: [
    "Something new just landed on the shelf. Our single origin Ethiopian is",
    "bright, floral and made for slow mornings.",
    "",
    "Book a bag this week and tell us what you taste.",
  ].join("\n"),
  rating: 4,
  status: "draft",
  statusChangedAt: null,
  analysis: ANALYSIS,
  parameters: {
    model: "gemini-3.5-flash-lite",
    temperature: 0.7,
    systemPrompt: "You are a marketing content specialist for a small business.",
    userPrompt: "Write a social caption about the single origin Ethiopian launch.",
    promptVersion: "builtin:1",
  },
  usage: { inputTokens: 190, outputTokens: 240 },
  createdAt: new Date("2026-10-02T09:00:00Z").toISOString(),
};

const PREVIEW_DRAFTS: Draft[] = [
  DRAFT,
  {
    ...DRAFT,
    id: "00000000-0000-0000-0000-000000000004",
    contentType: "email_newsletter",
    topic: "October roast club email",
    rating: null,
    status: "published",
    statusChangedAt: new Date("2026-10-03T10:00:00Z").toISOString(),
    analysis: null,
  },
  {
    ...DRAFT,
    id: "00000000-0000-0000-0000-000000000005",
    topic: "Winter hours announcement",
    rating: 2,
    status: "discarded",
    statusChangedAt: new Date("2026-10-04T10:00:00Z").toISOString(),
  },
];

const OVER_LIMIT: Draft = {
  ...DRAFT,
  id: "00000000-0000-0000-0000-000000000006",
  topic: "Long caption sample",
  contentText: [
    "Something new just landed on the shelf, and if you like bright, floral",
    "coffee with a little acidity then this one is for you. Our single origin",
    "Ethiopian is picked by hand, roasted in small batches every Monday, and",
    "it is at its best in the first three weeks after roasting. Come in before",
    "the weekend, ask the counter for a taste, and tell us what you notice.",
  ].join(" "),
};

export default function PreviewPage() {
  const [draftFilter, setDraftFilter] = useState<StatusFilter>("all");
  const [generator, setGenerator] = useState<{
    contentType: ContentType;
    topic: string;
    keywords: string[];
  }>({ contentType: "blog_outline", topic: "", keywords: [] });
  const [stars, setStars] = useState<number | null>(3);

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">
          Component preview
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Everything below renders with fake data, no login and no API keys.
          Amber panels are tasks that are not built yet.
        </p>
      </header>

      <Card
        title="Design primitives"
        subtitle="Copy these. Same classes everywhere, so the screens match without extra work."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Example field" hint="hint text sits under the control">
            <input className={controlClass} placeholder="your email address" />
          </Field>
          <Field label="Field with an error" error="This field is required">
            <input
              className={controlErrorClass}
              placeholder="you can type in this one"
              aria-invalid
            />
          </Field>
          <Field label="Select control">
            <select className={controlClass} defaultValue="friendly">
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="friendly">Friendly</option>
            </select>
          </Field>
          <Field label="Long text control">
            <textarea className={controlClass} rows={3} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button>Primary action</Button>
          <Button variant="ghost">Secondary action</Button>
          <Button disabled>Disabled</Button>
          <Stars value={stars} onChange={setStars} />
          <span className="text-sm text-neutral-500">
            rating: {stars === null ? "not rated" : stars}
          </span>
        </div>
      </Card>

      <Card
        title="W2.1 Brand profile form"
        subtitle="Owner A. Props: onSave(formData)."
      >
        <ProfileForm onSave={async () => ({ ok: true, value: null })} />
      </Card>

      <Card
        title="W3.1 Generator input panel"
        subtitle="Owner B. Controlled: value, pending, onChange, onGenerate."
      >
        <GeneratorPanel
          value={generator}
          pending={false}
          onChange={setGenerator}
          onGenerate={() => {}}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="W3.2 Draft editor"
          subtitle="Owner B. Editable text plus save, copy and rating."
        >
          <DraftEditor
            draft={DRAFT}
            onSave={() => {}}
            onRate={(rating) => setStars(rating)}
            onCopy={() => {}}
          />
        </Card>

        <Card
          title="W3.2 Draft editor, over the caption limit"
          subtitle="Owner B. The budget turns red and a missing structure stays grey."
        >
          <DraftEditor
            draft={OVER_LIMIT}
            onSave={() => {}}
            onRate={() => {}}
            onCopy={() => {}}
          />
        </Card>

        <Card
          title="W3.3 Dashboard draft list"
          subtitle="Owner B. Status filter with counts, mark ready, discard, delete, empty states."
        >
          <DraftList
            drafts={
              draftFilter === "all"
                ? PREVIEW_DRAFTS
                : PREVIEW_DRAFTS.filter((draft) => draft.status === draftFilter)
            }
            filter={draftFilter}
            counts={statusCounts(PREVIEW_DRAFTS)}
            onFilter={setDraftFilter}
            onDelete={() => {}}
            onRate={() => {}}
            onStatus={() => {}}
            onReuse={() => {}}
          />
        </Card>
      </div>

      <Card
        title="P1.1 How the draft was made"
        subtitle="The prompt text stored with a draft, and the version that produced it."
      >
        <PromptPanel parameters={DRAFT.parameters} />
      </Card>
    </main>
  );
}