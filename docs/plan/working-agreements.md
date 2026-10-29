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
