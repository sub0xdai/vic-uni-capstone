import type { ReactNode } from "react";

export function Placeholder({
  task,
  title,
  items,
}: {
  task: string;
  title: string;
  items: string[];
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-400/70 bg-amber-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        {task} not built
      </p>
      <p className="mt-1 text-base font-semibold text-neutral-900">{title}</p>
      <ul className="mt-3 space-y-1 text-sm text-neutral-700">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}
