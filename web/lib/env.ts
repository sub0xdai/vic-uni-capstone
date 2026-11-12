import { invariant } from "./assert.ts";

export class MissingEnvError extends Error {
  readonly variable: string;

  constructor(variable: string) {
    super(`Missing environment variable: ${variable}`);
    this.name = "MissingEnvError";
    this.variable = variable;
  }
}

export function optionalEnv(name: string): string | null {
  invariant(name.length > 0, "optionalEnv called without a name");
  const value = process.env[name];
  invariant(value === undefined || typeof value === "string", `${name} is not a string`);
  return value === undefined || value === "" ? null : value;
}

export function requireEnv(name: string): string {
  invariant(name.length > 0, "requireEnv called without a name");
  const value = optionalEnv(name);
  if (value === null) {
    throw new MissingEnvError(name);
  }
  invariant(value.length > 0, `${name} resolved to an empty value`);
  return value;
}
