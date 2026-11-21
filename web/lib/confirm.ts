const REASONS: Record<string, string> = {
  missing: "That link had no code in it. Sign up again, or log in if your account works.",
  expired: "That link expired or was already used. Log in, or sign up again.",
  unconfigured: "The database is not set up on this host.",
};

export function confirmReason(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  return REASONS[value] ?? null;
}
