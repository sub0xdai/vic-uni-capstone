"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, controlClass } from "@/components/ui";
import { passwordProblem } from "@/lib/password";
import { supabaseBrowserResult } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chosen = form.get("password"); // @waiver PII: form field, not a secret
    const again = form.get("confirm");
    if (typeof chosen !== "string" || typeof again !== "string") {
      setMessage("Both fields are required");
      return;
    }

    const problem = passwordProblem(chosen);
    if (problem !== null) {
      setMessage(problem);
      return;
    }
    if (chosen !== again) {
      setMessage("The two passwords do not match");
      return;
    }

    setBusy(true);
    setMessage(null);
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setBusy(false);
      setMessage(client.error);
      return;
    }
    const { error } = await client.value.auth.updateUser({
      password: chosen, // @waiver PII: the value being set, not a stored secret
    });
    setBusy(false);
    if (error !== null) {
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card title="Set a new password" subtitle="Choose the password you will sign in with.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password">
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              className={controlClass}
            />
          </Field>
          <Field label="Type it again">
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              className={controlClass}
            />
          </Field>

          {message === null ? null : (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          )}

          <Button type="submit" disabled={busy}>
            Save password
          </Button>
        </form>
      </Card>
    </main>
  );
}
