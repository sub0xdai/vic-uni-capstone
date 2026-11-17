# PR 85: how to get it ready to merge

For Jamal.
Branch `jamal-branch`, pull request 85.
Every check below was run on a clean copy of commit `08ffbd1` with a fresh `pnpm install`, so the output you should expect is recorded here.

## The short version

Four things block the merge.
None of them is hard, and three of them are small edits.

| # | Problem | What a reviewer sees | Time |
|---|---|---|---|
| 1 | The branch does not compile | `pnpm check` fails, so the pull request cannot merge | 15 min |
| 2 | The database function the route calls is not in the repo | it works on your machine only, and a fresh database returns 500 | 30 min |
| 3 | A failed image still spends one of the daily three | a broken setting or a Cloudflare error costs the user an image | 30 min |
| 4 | The two Cloudflare settings are undocumented | a deployment fails with a message nobody can fix from the README | 10 min |

After that, one manual test pass, then the pull request.

## Read this first

- Work on `jamal-branch` and push to it.
  Do not open a second branch.
- Touch only the files named in each step.
  If you think you need another one, ask first.
- Run `cd web && pnpm check` before every push.
  It is the same command a reviewer runs.
- Do not add a dependency.
  Everything here uses what the repo already has.
- Do not fix the database by hand only.
  The repo is the record. A change that lives only in the Supabase dashboard is lost the day somebody builds a fresh project.
- Do not commit `.env.local`.

---

## Step 1: make the branch compile

### What happened

The branch was merged with `master`, and the merge kept two copies of the same function in one file.
The second copy also mentions `"video_generation"`, which does not exist in this app, and leaves a variable unused.
TypeScript refuses to build a file with two functions of the same name, so the whole app fails to build, not just the panel.

### What to do

Open `web/components/generator-panel.tsx`.
Look for the block that starts like this:

```ts
  const isMediaMode =
    selectedMode === "image_generation" ||
    selectedMode === "video_generation";
```

Delete from `const isMediaMode =` all the way to the closing `}` of the second `selectMode` function below it.
Keep the first `selectMode`, the one directly above it.
When you are done, exactly one `selectMode` remains and it looks like this:

```ts
  function selectMode(mode: GeneratorMode) {
    setSelectedMode(mode);

    if (mode !== "image_generation") {
      onChange({
        ...value,
        contentType: mode,
      });
    }
  }
```

That is the whole fix.
The rest of the file stays as it is.

One note about the file.
The repo's line-length rule also flags about a dozen long `className` lines that came in with the redesign.
`pnpm check` does not care about them, so they do not block the merge.
If your editor's agent hook lists them when you save, that is the hook, not your change.

### Check

```bash
cd web
pnpm check
```

Expected: typecheck passes, lint passes, `tests 123`, `fail 0`.
Before this step it stops at `TS2393: Duplicate function implementation`.

---

## Step 2: put the database function in the repo

### What happened

The route calls a database function named `consume_image_generation`, and that function is not in the repository.
Somebody created it by hand in the Supabase SQL editor.
It exists in the live project today, which is why the page works for you, but nothing in the repo creates it.
A fresh database, or a new teammate following `web/README.md`, gets a 500 on every image.

There is also no way to give a spent image back, which is step 3.

### What to do

Create a new file at `web/supabase/2026-11-18-image-generation.sql` with exactly this content:

```sql
create table image_generation_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  used smallint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day),
  constraint image_generation_usage_non_negative check (used >= 0)
);

alter table image_generation_usage enable row level security;

create policy image_generation_usage_select on image_generation_usage
  for select to authenticated using (auth.uid() = user_id);

grant select on image_generation_usage to authenticated;

create or replace function consume_image_generation()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  daily_limit constant integer := 3;
  remaining smallint;
begin
  if auth.uid() is null then
    raise exception 'consume_image_generation needs a signed-in user';
  end if;

  insert into image_generation_usage (user_id, day, used)
  values (auth.uid(), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set used = image_generation_usage.used + 1,
        updated_at = now()
    where image_generation_usage.used < daily_limit
  returning used into remaining;

  return remaining is not null;
end;
$$;

create or replace function refund_image_generation()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update image_generation_usage
     set used = greatest(used - 1, 0),
         updated_at = now()
   where user_id = auth.uid()
     and day = (now() at time zone 'utc')::date;
end;
$$;

revoke all on function consume_image_generation() from public, anon;
revoke all on function refund_image_generation() from public, anon;
grant execute on function consume_image_generation() to authenticated;
grant execute on function refund_image_generation() to authenticated;
```

### What it does, in plain words

- `image_generation_usage` is one row per person per day, holding how many images that person asked for.
- `consume_image_generation()` takes one from that person's allowance and answers `true`.
  If the allowance is used up it answers `false` and changes nothing.
  The check and the increase happen in the same statement, so two tabs cannot both take the last image.
- `refund_image_generation()` puts one back.
  It never goes below zero.
- Only signed-in users may call either function.
  Nobody can rewrite their own count from the app, because the app has no write permission on the table.
  All writes go through the two functions.
- The daily limit is written once, inside the function, as `daily_limit constant integer := 3`.

### Apply it to the live project

Open the Supabase SQL editor for the project and paste the same file, then run it.

Two things may happen.

- If it runs cleanly, done.
- If Postgres says `cannot change return type of existing function`, then the version created by hand returns something other than `true` or `false`.
  Run `drop function if exists consume_image_generation();` and paste the file again.
  That is safe: the app keeps working only once the new version is in place, and it is applied in the same minute.

The old counts, if the hand-made version stored any, do not carry over.
The new table starts empty.
That is acceptable for three images a day, and it is worth saying in the pull request.

Then look for leftovers:

```sql
select table_name
from information_schema.tables
where table_schema = 'public' and table_name like '%image%';
```

You should see `image_generation_usage` only.
If there is another image table that the hand-made function used, drop it after you have confirmed the new one works.

### Prove the live database is set up correctly

Run these two queries.

```sql
select proname from pg_proc
where proname in ('consume_image_generation', 'refund_image_generation');
```

Expected: two rows.

```sql
select proname, proacl from pg_proc
where proname = 'consume_image_generation';
```

Expected: the access list mentions `authenticated=X` and does not mention `anon=X`.
This matters.
Before this change, the signed-out role was explicitly refused, and nobody has checked whether the signed-in role was ever allowed.
If `authenticated` is missing from that list, every logged-in image request returns `Could not check your daily image limit.` and this is the reason.

### Keep a fresh project working

Paste the same SQL at the end of `web/supabase/schema.sql`.
That file is what a new project runs, and the new table and functions have to be in it or the next person starts broken.

### Add it to the list in the README

In `web/README.md`, under "Data", the numbered list of dated migrations needs a fifth line:

```
5. `2026-11-18-image-generation.sql` adds `image_generation_usage` and the two quota functions.
```

### Check

The SQL above was run against a real Postgres 16 before it was written here, with four checks:

- three calls in one day answer `true`, the fourth answers `false`;
- a call after a refund answers `true`;
- a second user gets their own three;
- the signed-out role cannot execute either function or read the table.

You cannot easily repeat that in the dashboard.
Instead, run the two `pg_proc` queries above and confirm what they return.

---

## Step 3: a failed image must not spend an image

### What happened

The route takes one from the allowance first, then checks whether Cloudflare is configured, then calls Cloudflare.
So a missing setting, a network timeout or a Cloudflare error still costs the user one of their three images for the day.
At three a day, one bug costs a third of the allowance.

### What to do

Three edits, all in `web/app/api/generate-image/route.ts`.

1. The two Cloudflare settings move above the allowance, and are read with `optionalEnv` from `lib/env.ts` instead of `process.env`.
   `process.env` cannot tell the difference between a variable that is missing and one that is empty, and the repo reads settings one way everywhere else.
2. The allowance is taken, and if anything after it fails, it is given back in the same `finally` block that already releases the lock.
   One place, so no exit path can forget it.
3. The prompt parsing and the `data:image/...` string move into a small file with tests, because that is where the rest of the repo keeps the parts worth testing.

Replace the whole file with this.
It is the version that was compiled and tested for this guide.

```ts
import { NextResponse } from "next/server";
import { MissingEnvError, optionalEnv } from "@/lib/env";
import { imageDataUrl, parseImagePrompt } from "@/lib/image";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const LOCK_TTL_MS = 90_000;

type QueryClient = Awaited<ReturnType<typeof supabaseServer>>;

type QuotaResult = "reserved" | "limit" | "failed";

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function reserveQuota(supabase: QueryClient): Promise<QuotaResult> {
  const { data, error } = await supabase.rpc("consume_image_generation");
  if (error !== null) {
    console.error(`Could not reserve an image generation: ${error.message}`);
    return "failed";
  }
  return data === true ? "reserved" : "limit";
}

async function refundQuota(supabase: QueryClient): Promise<void> {
  const { error } = await supabase.rpc("refund_image_generation");
  if (error !== null) {
    console.error(`Could not refund an image generation: ${error.message}`);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return fail("Request body must be JSON.", 400);
  }

  if (body === null || typeof body !== "object") {
    return fail("Request body must be an object.", 400);
  }

  const parsedPrompt = parseImagePrompt((body as Record<string, unknown>).prompt);
  if (!parsedPrompt.ok) {
    return fail(parsedPrompt.error, 400);
  }
  const prompt = parsedPrompt.value;

  let supabase: QueryClient;

  try {
    supabase = await supabaseServer();
  } catch (error) {
    if (error instanceof MissingEnvError) {
      return fail("Database is not configured.", 500);
    }
    throw error;
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError !== null || auth.user === null) {
    return fail("You must be logged in to generate images.", 401);
  }

  const userId = auth.user.id;

  const staleBefore = new Date(Date.now() - LOCK_TTL_MS).toISOString();

  const { error: clearError } = await supabase
    .from("generation_lock")
    .delete()
    .eq("user_id", userId)
    .lt("acquired_at", staleBefore);

  if (clearError !== null) {
    console.error("Could not clear stale image generation lock.");
    return fail("Image generation could not start.", 500);
  }

  const { error: lockError } = await supabase
    .from("generation_lock")
    .insert({ user_id: userId });

  if (lockError !== null) {
    if (lockError.code === "23505") {
      return fail("Another generation is already running. Please wait.", 429);
    }

    console.error("Could not acquire image generation lock.");
    return fail("Image generation could not start.", 500);
  }

  let reserved = false;
  let delivered = false;

  try {
    const accountId = optionalEnv("CLOUDFLARE_ACCOUNT_ID");
    const apiToken = optionalEnv("CLOUDFLARE_API_TOKEN");

    if (accountId === null || apiToken === null) {
      console.error(
        "Image generation is not configured: " +
          "CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is missing",
      );
      return fail("Image generation is not configured.", 500);
    }

    const quota = await reserveQuota(supabase);

    if (quota === "failed") {
      return fail("Could not check your daily image limit.", 500);
    }

    if (quota === "limit") {
      return fail("You've reached your limit of 3 images today. Try again tomorrow.", 429);
    }

    reserved = true;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    let response: Response;

    try {
      response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            steps: 4,
          }),
          signal: controller.signal,
        }
      );
    } catch {
      return fail("Cloudflare image generation could not be reached. Please try again.", 502);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error(`Cloudflare image generation failed: HTTP ${response.status}`);
      return fail("Image generation failed. Please try again.", 502);
    }

    const result = await response.json() as {
      success?: boolean;
      result?: { image?: string };
    };

    if (
      result.success !== true ||
      typeof result.result?.image !== "string" ||
      result.result.image.length === 0
    ) {
      console.error("Cloudflare returned an unusable image response.");
      return fail("The image service returned an invalid result.", 502);
    }

    delivered = true;
    return NextResponse.json({
      imageDataUrl: imageDataUrl(result.result.image),
      prompt,
    });
  } catch (error) {
    console.error("Image generation request failed:", error);
    return fail("An unexpected image generation error occurred.", 500);
  } finally {
    if (reserved && !delivered) {
      await refundQuota(supabase);
    }

    const { error } = await supabase
      .from("generation_lock")
      .delete()
      .eq("user_id", userId);

    if (error !== null) {
      console.error("Could not release image generation lock.");
    }
  }
}
```

Then create `web/lib/image.ts`:

```ts
import { invariant } from "./assert.ts";
import { err, ok, type Result } from "./types.ts";

export const IMAGE_PROMPT_MAX = 2048;
export const IMAGE_MIME = "image/jpeg";

export function parseImagePrompt(value: unknown): Result<string> {
  if (typeof value !== "string" || value.trim().length === 0) {
    return err("Please enter an image description.");
  }
  const prompt = value.trim();
  if (prompt.length > IMAGE_PROMPT_MAX) {
    return err(`Image description must be ${IMAGE_PROMPT_MAX} characters or fewer.`);
  }
  return ok(prompt);
}

export function imageDataUrl(base64: string): string {
  invariant(typeof base64 === "string" && base64.length > 0, "no image data to wrap");
  return `data:${IMAGE_MIME};base64,${base64}`;
}
```

And `web/lib/image.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { IMAGE_MIME, IMAGE_PROMPT_MAX, imageDataUrl, parseImagePrompt } from "./image.ts";

test("a usable prompt is trimmed and accepted", () => {
  assert.deepEqual(parseImagePrompt("  A coffee cup on a table  "), {
    ok: true,
    value: "A coffee cup on a table",
  });
});

test("a missing or blank prompt is refused", () => {
  assert.equal(parseImagePrompt(undefined).ok, false);
  assert.equal(parseImagePrompt("   ").ok, false);
  assert.equal(parseImagePrompt(42).ok, false);
});

test("the prompt limit is inclusive", () => {
  assert.equal(parseImagePrompt("a".repeat(IMAGE_PROMPT_MAX)).ok, true);
  assert.equal(parseImagePrompt("a".repeat(IMAGE_PROMPT_MAX + 1)).ok, false);
});

test("the data URL names the type the browser is handed", () => {
  assert.equal(imageDataUrl("abc123"), `data:${IMAGE_MIME};base64,abc123`);
  assert.throws(() => imageDataUrl(""));
});
```

### Why one test file is enough

The repo asks for one runnable check on new logic that branches.
The branching here is the prompt rules and the image string, and both now live in `lib/image.ts`.
The rest of the route is database and network calls, and the manual pass in step 5 covers those.

### Check

```bash
cd web
pnpm check
pnpm build
```

Expected: `tests 127`, `fail 0`, and the build ends with the route list and no error.
Before these three edits the build stopped at `Failed to type check`.

---

## Step 4: document the two Cloudflare settings

### What to do

In `web/.env.local.example`, add:

```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

In `web/README.md`, under "Environment", add two rows to the variable table:

| Variable | Used for | When it is missing |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | image generation | the image generator answers that it is not configured, and the reason is logged with the variable name |
| `CLOUDFLARE_API_TOKEN` | image generation | the same |

Where the values come from: the Cloudflare dashboard.
The account id is on the account home page, and the token is a Workers AI token with permission to run models.
Do not paste either value into the pull request or into a commit.

---

## Step 5: prove it works, by hand

Automatic checks do not prove the flow, so do this once and write down what you saw.
Use a real signed-in account.

1. Open `/generate`, choose AI Image Generator, type a description, press Generate.
   Expected: an image, with the download button.
2. Do it twice more.
   Expected: three images.
3. Do it a fourth time.
   Expected: the message about the limit of 3, and no new image.
4. Check the counter:
   ```sql
   select user_id, day, used from image_generation_usage order by day;
   ```
   Expected: your row says `3`.
5. Now break it on purpose.
   Empty `CLOUDFLARE_API_TOKEN` in `web/.env.local`, stop the server, start it again, and generate.
   Expected: `Image generation is not configured.`
   Then check the counter again.
   Expected: still `3`. This is the proof that step 3 works.
6. Put the token back, restart, and confirm an image still generates.
   You will need to wait for the next day, or delete your row in the SQL editor, to test a fresh allowance.

If step 5 shows `4`, the refund is not running and step 3 is not finished.

---

## Step 6: the pull request

- Update the branch first. `master` has moved since you last merged it:
  ```bash
  git fetch origin
  git merge origin/master
  ```
  Fix any conflict by keeping both sides, then run `pnpm check` again.
- Push to `jamal-branch`.
- In the pull request body, say these five things:
  1. what the feature does, in three lines;
  2. that `web/supabase/2026-11-18-image-generation.sql` must be applied before the deploy, and that it replaces a function previously created by hand;
  3. the two new environment variables;
  4. the manual test result from step 5, including the counter staying at 3 after a failed generation;
  5. that image generations are not yet saved to `generated_content`, so they do not appear on the dashboard and are not part of the monthly cost figure.
- Attach two screenshots: the image generator after a successful generation, and `/preview`.

Item 5 is not a blocker, but a reviewer will ask.
Saying it first is cheaper than being asked.

## What not to do

- Do not install a package to solve any of this.
- Do not catch the database error and return a happy answer.
  If the function is missing, the page must say so, because that is the only signal that the migration was not applied.
- Do not create the SQL only in the Supabase dashboard.
  If it is not in `web/supabase/`, it does not exist for the next person.
- Do not change the monthly text limit, the quality weights or the scoring.
  None of them is involved here.
- Do not commit `.env.local`.

## Done when

- [ ] `cd web && pnpm check` passes, with `tests 127`.
- [ ] `cd web && pnpm build` passes.
- [ ] `web/supabase/2026-11-18-image-generation.sql` exists and is listed in `web/README.md`.
- [ ] `web/supabase/schema.sql` creates the same table and functions.
- [ ] The live project answers the two `pg_proc` queries as described, and `authenticated` has execute permission.
- [ ] A failed generation leaves the daily counter unchanged.
- [ ] `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are in `.env.local.example` and the README table.
- [ ] The pull request body has the five points and two screenshots.

## If something in this guide does not match the file

The branch may have moved since 18 November.
Read the code before pasting anything, and run `pnpm check` after each step instead of at the end.
If a step fights you for more than fifteen minutes, stop and ask in the team channel with the exact error message.
