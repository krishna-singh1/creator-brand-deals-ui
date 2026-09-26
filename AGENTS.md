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

## Git
- Commit author `krishna-singh1` (repo-local config). Short action-only messages. No co-author trailers.
- Commit after each tested unit. The user pushes.
