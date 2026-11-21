export const MIN_LENGTH = 8;

export function passwordProblem(value: string): string | null {
  return value.length < MIN_LENGTH
    ? `Use at least ${MIN_LENGTH} characters for the password.`
    : null;
}
