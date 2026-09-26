# BrandDeal Web (`creator-brand-deals-ui`)

Next.js 16 frontend for BrandDeal, a marketplace connecting Indian D2C brands with Instagram/Facebook
micro-influencers.

- **Separate deployment** (Vercel). The browser calls the BrandDeal API directly (`NEXT_PUBLIC_API_URL`).
- **API contract, product docs and decision log** live in the API repo `creator-brand-deals` (`contracts/`, `docs/`).
  This repo vendors a copy of the contract in `contracts/openapi.yaml` and generates types from it.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3000 (start the API on :8080 first)
```

## Update the API contract

```bash
npm run contract:sync   # from ../creator-brand-deals (or set CONTRACT_SOURCE to a path/URL)
npm run api:types       # regenerate src/lib/api/schema.d.ts
```

## Verify

```bash
npm run lint && npm run typecheck && npm run api:check && npm run build
```

## Deploy (Vercel)

Set `NEXT_PUBLIC_API_URL` per environment (e.g. `https://api.branddeal.in/api/v1`). Use a custom domain on the same
parent domain as the API (e.g. `app.branddeal.in`) so auth cookies work. Add that origin to the API's
`CORS_ALLOWED_ORIGINS`.
