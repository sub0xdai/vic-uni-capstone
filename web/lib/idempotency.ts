import { type Result, err, ok } from "./types.ts";

const KEY = /^[A-Za-z0-9_-]{8,100}$/;

export function parseIdempotencyKey(header: string | null): Result<string | null> {
  if (header === null) {
    return ok(null);
  }
  const trimmed = header.trim();
  if (trimmed.length === 0) {
    return ok(null);
  }
  if (!KEY.test(trimmed)) {
    return err("Idempotency-Key must be 8 to 100 characters of A-Z, a-z, 0-9, - or _.");
  }
  return ok(trimmed);
}
