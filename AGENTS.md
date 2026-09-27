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
- API access: always use the typed client in `src/lib/api/client.ts` (`api.GET/POST…` + `unwrap`). It sends
  `credentials: 'include'` and the `X-Requested-With: fetch` CSRF header, and refreshes once on a 401 (ADR 0008).
- Never read or store auth tokens in JS. They are httpOnly cookies set by the API.
- Contract changes happen in the API repo first. Then run `npm run contract:sync && npm run api:types` and commit
  `contracts/openapi.yaml` + `src/lib/api/schema.d.ts` together.
- Env: `NEXT_PUBLIC_API_URL` (e.g. `https://api.branddeal.in/api/v1`). The API's `CORS_ALLOWED_ORIGINS` must include
  this app's origin, and both must share the parent domain in prod.
- Money from the API is in paise. Format with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

## Commands
| Task | Command |
|------|---------|
| Dev server | `npm run dev` (http://localhost:3000, API at http://localhost:8080) |
| Sync contract + types | `npm run contract:sync && npm run api:types` |
| Verify | `npm run lint && npm run typecheck && npm run api:check && npm run build` |
| E2E (real browser) | API repo: `docker compose up -d` + bootRun with `ADMIN_EMAILS=admin@branddeal.local` and relaxed OTP limits (see README); here: `npm run e2e` (reads OTPs from Mailpit) |

## Design system (look & feel)
- Palette (Tailwind v4 `@theme` in `src/app/globals.css`): `ink` #121212, `ivory` #faf7f2, `cream`, `sand`, `gold` #b08d57
  (+ `gold-soft`, `gold-deep`). The `zinc-*` scale is remapped to warm neutrals, so existing `zinc` classes stay on-palette.
- Type: `font-display` = Playfair Display (headings, numbers, quotes), `font-sans` = Inter (body). Eyebrows are small
  uppercase gold text with wide tracking (`<Eyebrow>`).
- Primitives in `src/components/ui.tsx`: `Button` (primary/gold/secondary/ghost/danger, pill, hover lift), `Input`/`Select`/
  `Textarea` (gold focus ring), `Field`, `Card` (`interactive` lifts), `PageTitle`, `SectionTitle`, `StatusBadge`,
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
- `src/app/creator/profile`, `src/app/creator/verification`, `src/app/brand/profile`, `src/app/admin`: M2 screens
- `e2e/`: Playwright specs against the running web + API (`helpers.ts` has sign-in/sign-up/OTP helpers)

## Git
- Commit author `krishna-singh1` (repo-local config). Short action-only messages. No co-author trailers.
- Commit after each tested unit. The user pushes.
