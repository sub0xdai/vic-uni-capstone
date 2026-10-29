# web

The ContentCraft application.

## Running it

You need Node 20.9 or newer and pnpm.

```bash
pnpm install
cp .env.local.example .env.local
pnpm dev
```

## Routes

| Route | What it does |
|---|---|
| `/` | Sends you to `/dashboard` when signed in, otherwise to `/login` |
| `/login` | Sign in, or create an account |
| `/onboarding` | Create or edit the business profile |
| `/dashboard` | Draft list with star ratings and the latest quality score |
| `/preview` | Every component with fake data, no database and no login |

`proxy.ts` guards `/dashboard`, `/onboarding` and `/generate`.
A signed out request goes to `/login`.
A signed in request for `/login` goes to `/dashboard`.

## Checks

```bash
pnpm check    # typecheck, lint, tests
pnpm build    # production build
```

`pnpm check` has to pass before anyone reviews your pull request.

## Database

The schema is `supabase/schema.sql`.
Paste the whole file into the Supabase SQL editor and run it.
The row level security policies keep one tenant from reading another tenant's rows.
