<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BrandDeal web (`creator-brand-deals-ui`)

Next.js frontend for BrandDeal. It is **deployed separately** from the API (Vercel) and talks to it directly from the
browser. Product docs, the decision log, event flows and the **API contract are owned by the API repo**
(`creator-brand-deals`: `docs/`, `contracts/openapi.yaml`). Don't duplicate them here. Link to them instead.

## Key rules
- **Follow SOLID and DRY.**
  - One responsibility per component or module: pages compose; data fetching lives in hooks/`src/lib`; UI
    primitives live in `src/components/ui.tsx`; pure helpers (formatting, errors, uploads) live in `src/lib`.
  - Extend through props and composition (e.g. `PasswordField`, `ImageUpload`, `ActionItems`) instead of copying
    a component and tweaking it.
  - Components depend on small typed props, not on whole API objects they don't use.
  - One source of truth: API types come from the generated `schema.d.ts` (never hand-written copies), design
    tokens from `globals.css`, user-facing error text from `src/lib/errors.ts`, money/date formatting from
    `src/lib/format.ts`.
  - Extract on the second real duplicate; keep it simple otherwise.
- Navigation: the top bar (`app-shell.tsx`) holds only work pages; personal pages (profile, verification, earnings/spend, account, sign-out) live in the slide-in `components/profile-panel.tsx`, opened from the avatar. It doubles as the mobile menu. In e2e use `openProfileMenu(page)` from `e2e/helpers.ts`.
- API URL modes: **direct** (default, ADR 0008): `NEXT_PUBLIC_API_URL=https://api.<domain>/api/v1`. **Proxy**: set
  `API_ORIGIN` and `NEXT_PUBLIC_API_URL=/api/v1`; `next.config.ts` then rewrites `/api/v1/*` to the API so cookies are
  first-party (needed when web and API don't share a parent domain, e.g. two `*.up.railway.app` hosts). Both are
  build-time values.
- API access: always use the typed client in `src/lib/api/client.ts` (`api.GET/POST…` + `unwrap`). It sends
  `credentials: 'include'` and the `X-Requested-With: fetch` CSRF header, and refreshes once on a 401 (ADR 0008).
- Never read or store auth tokens in JS. They are httpOnly cookies set by the API.
- Contract changes happen in the API repo first. Then run `npm run contract:sync && npm run api:types` and commit
  `contracts/openapi.yaml` + `src/lib/api/schema.d.ts` together.
- Env: `NEXT_PUBLIC_API_URL` (e.g. `https://api.exposurestreet.com/api/v1`). The API's `CORS_ALLOWED_ORIGINS` must include
  this app's origin, and both must share the parent domain in prod.
- Money from the API is in paise. Format with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

## Commands
| Task | Command |
|------|---------|
| Dev server | `npm run dev` (http://localhost:3000, API at http://localhost:8080) |
| Sync contract + types | `npm run contract:sync && npm run api:types` |
| Verify | `npm run lint && npm run typecheck && npm run api:check && npm run build` |
| E2E (real browser) | API repo: `docker compose up -d` + bootRun with `ADMIN_EMAILS=admin@branddeal.local` and relaxed OTP limits (see README); here: `npm run e2e` (reads OTPs from Mailpit) |

### E2E notes
- The API usually runs in Docker locally (see "Local development notes" in the API repo's `AGENTS.md`); it must have
  `ADMIN_EMAILS=admin@branddeal.local` and the relaxed OTP limits. Mailpit (http://localhost:8025) supplies codes.
- `e2e/global-setup.ts` signs the admin in once per run into `e2e/.auth/admin.json`; admin steps use
  `browser.newContext({ storageState: ADMIN_STATE })` and API setup uses `api-fixtures.ts` (e.g. `createBrandWithCampaign`
  verifies the brand through the admin API, since new brands can't publish until verified).
- The first sign-in right after an API restart can be slow and time out once; rerun before debugging.
- Prefer `page.goto(url)` over clicking nav links right after a `reload()` (clicks can land before hydration).
- Screenshots for design checks: write a temporary `e2e/zz-*.tmp.spec.ts`, run it, delete it.
- `global-setup.ts` also sets the admin's password on a fresh database (otherwise admin pages stop at onboarding).
- **CI runs the whole suite** (`.github/workflows/ci.yml`, job "E2E") on every PR and push to `master`: Postgres,
  Mailpit and S3Mock as service containers, the API built from the API repo branch **with the same name** (else
  `master`), `next start`, then `npx playwright test` (1 retry, HTML report + API/web logs uploaded on failure). It
  needs the `API_REPO_READ_TOKEN` secret (fine-grained, read-only Contents on `creator-brand-deals`); without it the
  job is skipped. Reproduce a CI failure locally: fresh database, `./gradlew bootJar` + `java -jar` with the same env
  as the workflow, `npm run build && npx next start`, then `CI=true npx playwright test`.
- Specs tagged `{ tag: "@smoke" }` form the staging smoke test (`e2e-staging.yml`, started by hand with the staging
  URLs; `MAILPIT_AUTH` for a password-protected Mailpit). Keep the tag on a few end-to-end happy paths only.
- Feature flags are global: specs must not leave one on. `instagram-verification.spec.ts` only switches
  INSTAGRAM_VERIFICATION on with `E2E_TOGGLE_FLAGS=1` and an API that has `INSTAGRAM_APP_ID/SECRET/REDIRECT_URI`
  (dummy values are fine); run that file alone, since screenshot submissions in parallel specs get 409 meanwhile.

## Design system (look & feel)
- Palette (Tailwind v4 `@theme` in `src/app/globals.css`): `ink` #121212, `ivory` #faf7f2, `cream`, `sand`, `gold` #b08d57
  (+ `gold-soft`, `gold-deep`). The `zinc-*` scale is remapped to warm neutrals, so existing `zinc` classes stay on-palette.
- Type: `font-display` = Playfair Display (headings, numbers, quotes), `font-sans` = Inter (body). Eyebrows are small
  uppercase gold text with wide tracking (`<Eyebrow>`).
- Primitives in `src/components/ui.tsx`: `Button` (primary/gold/secondary/ghost/danger, pill, hover lift), `Input`/`Select`/
  `Textarea` (gold focus ring), `Field`, `Switch` (accessible on/off, `role="switch"`), `Card` (`interactive` lifts), `PageTitle`, `SectionTitle`, `StatusBadge`,
  `Spinner`, `Skeleton`.
- Motion in `src/components/motion.tsx` (no animation library): `Reveal` (scroll reveal via IntersectionObserver,
  `delay` to stagger), `Counter`, `Parallax`, `AnimatedWords`, `useScrolled`. CSS keyframes: `animate-fade-up`,
  `animate-fade-in`, `animate-page-in`, `animate-float`. Route changes fade in via `src/app/template.tsx`.
- Rules: animate only `transform`/`opacity`; durations 300–900ms with `--ease-premium`; everything respects
  `prefers-reduced-motion` (global override in `globals.css`). Keep copy refined and specific; no fake metrics or
  testimonials (landing stories are labelled "Illustrative").
- Landing page lives in `src/app/(marketing)/` (route group, URL `/`). Signed-in screens use `AppShell`; auth screens
  use `AuthLayout`.

## Structure
- `src/lib/api/client.ts`: typed client, refresh-on-401, `unwrap()` → `ApiRequestError`
- `src/lib/session.ts`: `useMe()` (null when signed out), `homeFor(me)` routing rules
- `src/components/require-session.tsx`: client route guard (UX only; the API enforces access)
- `src/app/login`, `src/app/onboarding`, `src/app/creator`, `src/app/brand`: screens per role
- `src/lib/upload.ts`: presign → direct PUT to storage → fileId (ADR 0006)
- Error monitoring (O-21): `src/instrumentation-client.ts` (browser, error-only masked replay), `src/instrumentation.ts` (server), `src/app/global-error.tsx`; shared options and URL/header scrubbing in `src/lib/monitoring.ts`. Off unless `NEXT_PUBLIC_SENTRY_DSN` is set, so dev and e2e send nothing
- `src/app/creator/profile`, `src/app/creator/verification`, `src/app/brand/profile`, `src/app/admin`: M2 screens
- `src/app/brand/campaigns` (incl. `[id]/applicants`), `src/app/creator/campaigns` (incl. the apply panel),
  `src/app/brand/creators` (discover verified creators; `[id]` profile + invite panel), `src/app/creator/applications`, `src/app/deals` (shared by both roles; `[id]/messages-panel.tsx` is the polling message thread): M3–M5 screens; `src/app/admin` (M6): `admin-shell.tsx` (guard + section tabs) and `admin-bits.tsx` (paged list hook, table, reason-required actions) shared by overview, verifications, users, campaigns, deals, pricing and audit pages; `src/components/notification-bell.tsx` in the app shell; shared pieces in
  `src/components/campaign-brief.tsx`, `src/components/campaign-bits.tsx` and `src/lib/campaigns.ts`
- `e2e/`: Playwright specs against the running web + API (`helpers.ts`: UI sign-in/sign-up/OTP helpers;
  `api-fixtures.ts`: API-level setup such as a verified creator or an approved deal; `global-setup.ts` signs the
  bootstrap admin in once per run (email code) and saves `e2e/.auth/admin.json` for specs to reuse)

## Docs
Product docs live in the API repo (`creator-brand-deals/docs`). A web PR that adds or changes a page, navigation or a
user-visible flow also needs a matching API-repo PR updating `docs/06-web-pages.md` (and `docs/08-roadmap.md` /
`docs/01-prd.md` when it finishes a roadmap item), unless the web change ships with an API PR that already does it.
See the docs checklist in the API repo's `AGENTS.md`. Name the docs updated in the PR description ("Docs: …").

## Git
- Commit author `krishna-singh1` (repo-local config). Short, action-only commit messages (e.g. "Add catalog API").
  No co-author trailers.
- The default branch is `master`. (`main` is an old mirror of it; don't use it.)
- **Every change goes through a branch and a pull request. Never commit or push to `master`.**
  1. Start from the latest `master`: `git checkout master && git pull --ff-only origin master`.
  2. Create a branch for the feature or fix: `git checkout -b <type>/<short-kebab-name>`, with `<type>` one of
     `feat`, `fix`, `chore`, `docs`. One branch per feature.
  3. **Keep the branch current with `master`.** Before any new code or change on an existing branch, and again
     before every push or PR: `git fetch origin && git merge origin/master`. Resolve conflicts on the branch (keep
     what `master` changed and re-apply the branch's intent), re-run the checks, then continue. Merge, don't rebase,
     so no force-push is ever needed. Do the same in the other repo when the feature spans both.
  4. Commit after each tested unit of work.
  5. When the feature is complete and verified (see "Verification" / "Commands"), push the branch
     (`git push -u origin <branch>`) and open a PR into `master`: title = what it does; body = what changed, why,
     and how it was tested. Use `gh pr create --base master` when the GitHub CLI is available; otherwise share
     `https://github.com/krishna-singh1/creator-brand-deals-ui/compare/master...<branch>?expand=1`.
  6. Don't merge PRs, force-push, or delete branches: the user reviews and merges.
- Features that span both repos use the same branch name in each (this repo and `creator-brand-deals (API)`), one PR per repo,
  each linking the other.
