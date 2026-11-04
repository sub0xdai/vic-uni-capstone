import { isContentType, type ContentType, type Draft } from "./types.ts";

export type GeneratorValues = {
  contentType: ContentType;
  topic: string;
  keywords: string[];
};

const TYPE = "type";
const TOPIC = "topic";
const KEYWORD = "keyword";

export function reuseHref(draft: Draft): string {
  const params = new URLSearchParams();
  params.set(TYPE, draft.contentType);
  params.set(TOPIC, draft.topic);
  for (const keyword of draft.keywords) {
    params.append(KEYWORD, keyword);
  }
  return `/generate?${params.toString()}`;
}

export function requestFromSearch(search: string): GeneratorValues | null {
  const params = new URLSearchParams(search);
  const type = params.get(TYPE);
  const topic = params.get(TOPIC);
  if (!isContentType(type)) {
    return null;
  }
  if (topic === null || topic.trim().length === 0) {
    return null;
  }
  const keywords = params
    .getAll(KEYWORD)
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
  return { contentType: type, topic: topic.trim(), keywords };
}
