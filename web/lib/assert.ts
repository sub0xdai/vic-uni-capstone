export class InvariantError extends Error {
  readonly detail: string;

  constructor(detail: string) {
    super(`Invariant failed: ${detail}`);
    this.name = "InvariantError";
    this.detail = detail;
  }
}

export function invariant(condition: unknown, detail: string): asserts condition {
  if (typeof detail !== "string" || detail.length === 0) {
    throw new InvariantError("invariant called without a description");
  }
  if (!condition) {
    throw new InvariantError(detail);
  }
}

export function assertInRange(value: number, low: number, high: number, label: string): void {
  invariant(Number.isFinite(value), `${label} is not a finite number`);
  invariant(low < high, `${label} has an empty range`);
  invariant(value >= low && value <= high, `${label} out of range: ${value}`);
}
