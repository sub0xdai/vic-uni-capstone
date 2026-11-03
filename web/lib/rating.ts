import { type Result, err, ok } from "./types.ts";

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export type RatingRequest = {
  id: string;
  rating: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseRatingRequest(body: unknown): Result<RatingRequest> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return err("Request body must be a JSON object.");
  }
  const id: unknown = Reflect.get(body, "id");
  const rating: unknown = Reflect.get(body, "rating");

  if (typeof id !== "string" || !UUID.test(id)) {
    return err("id must be the id of a draft.");
  }
  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < RATING_MIN ||
    rating > RATING_MAX
  ) {
    return err(`rating must be a whole number from ${RATING_MIN} to ${RATING_MAX}.`);
  }
  return ok({ id, rating });
}