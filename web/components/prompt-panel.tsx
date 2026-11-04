import type { GenerationParameters } from "@/lib/types";

export type PromptPanelProps = {
  parameters: GenerationParameters | null;
};

const LABEL = "font-bold text-neutral-900";
const PROMPT =
  "mt-1 whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-xs text-neutral-700";

export function PromptPanel({ parameters }: PromptPanelProps) {
  if (parameters === null) {
    return (
      <p className="text-sm text-neutral-500">
        This draft has no prompt on record. It was saved before the prompt was stored.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
        <div className="flex gap-1">
          <dt className={LABEL}>Model</dt>
          <dd>{parameters.model}</dd>
        </div>
        <div className="flex gap-1">
          <dt className={LABEL}>Temperature</dt>
          <dd>{parameters.temperature}</dd>
        </div>
        <div className="flex gap-1">
          <dt className={LABEL}>Prompt version</dt>
          <dd>{parameters.promptVersion ?? "not recorded"}</dd>
        </div>
      </dl>

      <div>
        <p className="text-[13px] font-bold text-neutral-900">System prompt</p>
        <pre className={PROMPT}>{parameters.systemPrompt}</pre>
      </div>

      <div>
        <p className="text-[13px] font-bold text-neutral-900">User prompt</p>
        <pre className={PROMPT}>{parameters.userPrompt}</pre>
      </div>
    </div>
  );
}
