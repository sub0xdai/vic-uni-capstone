"use client";

import { Card } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card title="Something went wrong" subtitle="The page could not finish loading.">
        <p className="text-sm text-neutral-700">{error.message}</p>
        {error.digest === undefined ? null : (
          <p className="mt-1 text-xs text-neutral-500">Reference: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </Card>
    </main>
  );
}
