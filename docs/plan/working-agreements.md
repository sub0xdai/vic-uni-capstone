# Working agreements

How we work on the code in `web/`.
This was written after the review of pull request #54, which is the first time the repository held two versions of the same app.

## What happened

The pull request added login, the business profile, the dashboard and the navigation bar.
That was real work, and the team needed all of it.
The plan lists the profile form as a card, and it was still a placeholder that said "not built".
None of the problems below are a complaint about the idea.

Three things went wrong.

The branch was four commits behind the main branch.
In between, the app moved into the `web/` folder.
So the branch added a second Next.js app at the top of the repository, with its own settings and its own lockfile.
There was no merge conflict, because the two copies never touched the same file.
That is the dangerous part. Git was silent, and the result would have been two apps to maintain.

The form did not match the database in `web/supabase/schema.sql`.
The brand tone column only accepts lowercase values, and the form sent `Professional`, so a save would have failed.
Row ids are long text, and the code treated them as numbers.
The dashboard read a `quality_score` column that does not exist.
That one would not have crashed. It would have shown every score as zero, which is worse, because it looks right.

The branch replaced the project readme with the starter template's readme, and added leftover files at the top of the repository.

## Rules for everyone

1. Pull the latest main branch before you start, and update your branch before you ask for a review.
   A short lived branch is easy to merge. A two week old one is not.
2. There is one app, in `web/`, with pnpm.
   If you think you need a new top level folder, ask first.
3. Read `web/supabase/schema.sql` before you build a form.
   Copy the column names and the allowed values exactly.
   If you need a column that is not there, add it to that file in the same pull request.
4. Run `pnpm check` and `pnpm build` in `web/` before you say the work is ready.
   The check runs the type check, the lint and the tests, and it takes about a minute.
5. Do not silence a missing setting with `process.env.NAME!`.
   Read it once, and show a clear message when it is not set.
6. Test anything that touches data.
   One small test that feeds a database row into your code and checks the result catches the `quality_score` kind of bug in seconds.
7. Keep the team's files.
   Do not replace the readme with a template, and do not leave generated or abandoned files in the commit.
8. One card, one pull request.
   A branch with one screen is easy to review and easy to fix.
   Eight thousand lines at once is very hard to say yes to.

## Environment

You need `web/.env.local` to run the app against a database.
It is gitignored, so it never leaves your machine.

```bash
cd web
cp .env.local.example .env.local
```

Two of those values are public and two are secret.

| Variable | Secret | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | no | The project address |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Identifies the project. It ships in the JavaScript the browser downloads, so every visitor already has it |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | Bypasses the row level security policies. Nothing reads it yet, so leave it empty |
| `GEMINI_API_KEY` | **yes** | Bills to whoever owns the key |

The two public values can be shared in the group chat.
That is not a leak, that is how they work.

The two secret ones are never shared.
Do not send them in chat, a screenshot, a commit or a pull request.
If you need to test generation, make your own free key at aistudio.google.com.

The protection for the data is not the key, it is the policies in `schema.sql`.
A public key with a missing policy reads the whole table from any browser with no login.
That is why the two user check in the readme matters more than any of this.

Sign up with your own account. Do not share logins.
One shared project is fine, and each account sees only its own rows.

Deployment settings live in the Vercel project, not in the repository and not in your file.

If a port is busy, it is your own leftover, not someone else's machine.

```bash
lsof -ti:3000 | xargs kill
```

## Checklist before you open a pull request

- [ ] I pulled the latest main branch today.
- [ ] My code is inside `web/`, next to the existing app.
- [ ] Every column name and every allowed value comes from `schema.sql`.
- [ ] `pnpm check` passes.
- [ ] `pnpm build` passes.
- [ ] The diff contains no starter template files and no leftovers.
- [ ] The pull request covers one card from `build-plan.md`.

## When you pick up someone else's work

Put their name on the commit that carries their code.
Pull request #54 became commits on the main branch, and the commit with the four screens is authored by Semir, the person who wrote them.
Do the same when you build on top of someone else's branch.

## Merging

`master` is protected.
A direct push is rejected for everyone except the repository owner, who keeps an admin bypass.

1. Branch off the latest master, named after the card, such as `W2.4-profile-route`.
2. Touch only the files your card names.
3. Run `pnpm check` and open a pull request.
4. Someone else approves it, then it is squash merged, so the history reads as one card per commit.

The bypass exists so the owner's own cards do not wait for an approval from someone who cannot review the change.
Everyone else needs one approval.
