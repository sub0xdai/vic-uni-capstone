import { optionalEnv } from "./env.ts";

const FALLBACK = "https://aicontentpro-zeta.vercel.app";

export const SITE_URL = optionalEnv("NEXT_PUBLIC_SITE_URL") ?? FALLBACK;

export const SITE_NAME = "ContentCraft";

export const SITE_DESCRIPTION =
  "Marketing content for small businesses, written from a brand profile and scored " +
  "before you publish.";
