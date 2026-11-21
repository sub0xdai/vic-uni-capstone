"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, controlClass } from "@/components/ui";
import { passwordProblem } from "@/lib/password";
import { supabaseBrowserResult } from "@/lib/supabase/client";

export function LoginForm({ reason }: { reason: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password"); // @waiver PII: form field, not a secret
    if (typeof email !== "string" || typeof password !== "string") {
      setMessage("Email and password are required");
      return;
    }

    setBusy(true);
    setMessage(null);
    setSent(null);
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
    const password = form.get("password"); // @waiver PII: form field, not a secret
    if (typeof email !== "string" || typeof password !== "string") {
      setMessage("Email and password are required");
      return;
    }

    const problem = passwordProblem(password);
    if (problem !== null) {
      setMessage(problem);
      return;
    }

    setBusy(true);
    setMessage(null);
    setSent(null);
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setBusy(false);
      setMessage(client.error);
      return;
    }
    const { data, error } = await client.value.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setBusy(false);
    if (error !== null) {
      setMessage(error.message);
      return;
    }
    if (data.session !== null) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setSent(`Account created. Open the link sent to ${email}, then log in.`);
  }

  async function forgot(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const field = event.currentTarget.form;
    if (field === null) {
      return;
    }
    const email = new FormData(field).get("email");
    if (typeof email !== "string" || email.length === 0) {
      setMessage("Type your email address first, then choose Forgot password.");
      return;
    }

    setBusy(true);
    setMessage(null);
    setSent(null);
    const client = supabaseBrowserResult();
    if (!client.ok) {
      setBusy(false);
      setMessage(client.error);
      return;
    }
    await client.value.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    setBusy(false);
    setSent("If that address has an account, a reset link is on its way.");
  }

  const notice = message ?? sent ?? reason;
  const tone = message === null && sent !== null ? "text-green-700" : "text-red-600";

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

          {notice === null ? null : (
            <p className={`text-sm ${tone}`} role="alert">
              {notice}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy}>
              Log in
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={signUp}>
              Sign up
            </Button>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={forgot}
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            Forgot password?
          </button>
        </form>
      </Card>
    </main>
  );
}
