# Tenancy check

Run on 3 November 2026 against the live project, at commit `8cb15e2`.
Card `W1.2` asks for this, and until this run the tenancy claim in the report was unverified.

## What was set up

Two accounts created through the public signup endpoint, the same path the app uses: `rls-check-a-<timestamp>@example.com` and `rls-check-b-<timestamp>@example.com`.
Each inserted its own `business_profile` row through the REST API with its own token, so the insert policy was exercised rather than bypassed.

The reads below carry no `user_id` filter on purpose.
Every page adds `.eq("user_id", ...)`, which hides a broken policy behind a working filter.
Only an unfiltered read distinguishes the two.

## Results

| Check | Expected | Observed |
|---|---|---|
| Alice reads `business_profile`, unfiltered | One row, hers | `[{"business_name":"Alice Coffee Co"}]` |
| Bob reads `business_profile`, unfiltered | One row, his | `[{"business_name":"Bob Bakery"}]` |
| No token reads `business_profile` | Empty | `[]` |
| Bob inserts a profile with Alice's `user_id` | Refused | `HTTP 403`, `new row violates row-level security policy for table "business_profile"` |
| Alice updates Bob's row by `user_id` | No rows affected | `HTTP 204`, Bob's row still reads `Bob Bakery` |
| Alice inserts a draft | Accepted | `HTTP 201` |
| Bob reads `generated_content`, unfiltered | Empty | `[]` |
| Alice reads `generated_content`, unfiltered | One row, hers | `[{"topic":"tenancy probe"}]` |
| No token reads `generated_content` | Empty | `[]` |

Every policy that the product depends on holds: select, insert with check, and update on `business_profile`, and select on `generated_content`.

## What this does not cover

- Delete policies on either table were not exercised.
- The cross-tenant `with check` on `generated_content` insert was not attempted, only on `business_profile`. Same policy shape, different table.
- Nothing ran through the browser. `/api/generate`, the session guard and the pages are still unexercised against this project.

## Reproducing it

The full sequence is in the root README, under Database, and takes about ten minutes.

Two facts made it work without a service-role key:

- `mailer_autoconfirm` is `true` on this project, so signup returns a session immediately and no inbox is involved.
- The anon key is enough for signup, sign-in and every table read once a user token is held.

The accounts are disposable. `SUPABASE_SERVICE_ROLE_KEY` is empty in `web/.env.local`, so deleting them needs either that key or the Auth users page in the dashboard.
