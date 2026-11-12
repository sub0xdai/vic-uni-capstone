"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, controlClass } from "@/components/ui";
import { supabaseBrowserResult } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    if (typeof email !== "string" || typeof password !== "string") {
      setMessage("Email and password are required");
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
    const { error } = await client.value.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function signUp(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const field = event.currentTarget.form;
    if (field === null) {
      return;
    }
    const form = new FormData(field);
    const email = form.get("email");
    const password = form.get("password");
    if (typeof email !== "string" || typeof password !== "string") {
      setMessage("Email and password are required");
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
    const { error } = await client.value.auth.signUp({ email, password });
    setBusy(false);
    setMessage(
      error === null
        ? "Account created. Check your email if confirmation is required, then log in."
        : error.message,
    );
  }

  return (
    <main className="mx-auto w-full max-w-md p-6">
      <Card title="Log in" subtitle="Sign in to reach your dashboard and brand profile.">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <input name="email" type="email" autoComplete="email" className={controlClass} />
          </Field>
          <Field label="Password">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className={controlClass}
            />
          </Field>

          {message === null ? null : (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              Log in
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={signUp}>
              Sign up
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
