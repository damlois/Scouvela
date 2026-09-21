# Scouvela

Scouvela is an Apify-powered discovery platform for Nigerian entrepreneurs. It helps users:

1. Find current SME funding opportunities, including loans, grants, accelerators and support programmes.
2. Find local service providers such as tailors, bakers, shoemakers, printers and packaging vendors by location.

This repository is a pnpm monorepo. The web app, Apify Actor and shared contracts live in one Git repository so Lois and Tomike can work in parallel without duplicating types.

## Architecture overview

- `apps/web` is a Next.js App Router application. It owns the UI and a server-only `POST /api/search` route.
- `apps/actor` is a TypeScript Apify Actor. It will collect publicly listed records, normalise them, deduplicate them and push valid items to an Apify Dataset.
- `packages/shared` is the contract layer. Zod schemas and inferred TypeScript types are defined once and imported by both apps.

The frontend never talks to Apify directly. The Next.js route keeps `APIFY_TOKEN` on the server, starts the Actor, waits for completion, validates Dataset items, and returns a typed response.

Until approved public sources are wired into the Actor, set `USE_MOCK_DATA=true` so Tomike can build the UI against realistic sample records.

```text
Browser UI  →  POST /api/search  →  mock data or Apify Actor  →  validated JSON
                                      ↑
                               APIFY_TOKEN stays server-side
```

## Repository structure

```text
scouvela/
├── apps/
│   ├── web/                 # Next.js UI and search API
│   └── actor/               # Apify Actor, crawlers and transformers
├── packages/
│   └── shared/              # Zod schemas and shared types
├── .github/
│   └── pull_request_template.md
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── tsconfig.base.json
```

## Prerequisites

- Node.js 20 or newer
- [pnpm](https://pnpm.io/) 9, via Corepack: `corepack enable && corepack prepare pnpm@9.15.9 --activate`
- An Apify account only when you are ready to run or deploy the Actor
- A Vercel account only when you are ready to deploy the web app

## Installation

From the repository root:

```bash
pnpm install
pnpm --filter @scouvela/shared build
```

The shared package compiles to `packages/shared/dist`. Rebuild it after changing schemas.

## Environment-variable setup

Copy the example file into the Next.js app. Do not commit real credentials.

```bash
cp .env.example apps/web/.env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example apps/web/.env.local
```

Placeholders:

```env
APIFY_TOKEN=
APIFY_ACTOR_ID=
USE_MOCK_DATA=true
ACTOR_RUN_TIMEOUT_SECONDS=60
```

Rules:

- `APIFY_TOKEN` is server-only. Never prefix it with `NEXT_PUBLIC_`.
- `USE_MOCK_DATA=true` returns sample funding and vendor records without calling Apify.
- `USE_MOCK_DATA=false` requires both `APIFY_TOKEN` and `APIFY_ACTOR_ID`.
- `ACTOR_RUN_TIMEOUT_SECONDS` defaults to 60 and is capped at 300.

## Local development commands

```bash
pnpm install
pnpm dev          # shared build, then Next.js at http://localhost:3000
pnpm dev:web      # frontend only
pnpm dev:actor    # Actor entrypoint (needs Apify local storage / `apify run`)
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Useful pages while the UI is still a placeholder:

- `/` landing page
- `/funding` funding search
- `/vendors` vendor search

## How mock mode works

When `USE_MOCK_DATA=true`, `POST /api/search` validates the request with the shared Zod schema and returns records from `apps/web/src/lib/mock-data.ts`. It does not start an Actor run and does not use `APIFY_TOKEN`.

Mock records are labelled with `sourceName: "Scouvela mock dataset"` and always include a `sourceUrl`. They exist so the frontend can be developed independently. They are not scraped results.

Turn mock mode off only after the Actor is deployed and `APIFY_ACTOR_ID` points at that deployment.

## How to run the Actor locally

Install the [Apify CLI](https://docs.apify.com/cli) if you do not already have it:

```bash
npm install -g apify-cli
```

From `apps/actor`:

```bash
cd apps/actor
pnpm --filter @scouvela/shared build
apify run
```

`apps/actor/INPUT.json` is a safe sample input:

```json
{
  "mode": "funding",
  "query": "MSME loan",
  "state": "Lagos",
  "maxResults": 10
}
```

The crawlers are scaffolding. They will not visit arbitrary websites. Approved public sources and source-specific selectors still need to be added in:

- `apps/actor/src/crawlers/funding-crawler.ts`
- `apps/actor/src/crawlers/vendor-crawler.ts`

Cheerio is the default crawler. Playwright exists only as an optional fallback in `apps/actor/src/crawlers/playwright-fallback.ts`.

You can also start the compiled TypeScript entrypoint after building shared:

```bash
pnpm dev:actor
```

That command expects Apify local storage. Prefer `apify run` during Actor development.

## How to deploy the web app to Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Set the Root Directory to the repository root, or configure Vercel to build the `apps/web` workspace.
4. Use these build settings if you configure them manually:
   - Install command: `pnpm install`
   - Build command: `pnpm --filter @scouvela/shared build && pnpm --filter @scouvela/web build`
   - Output: Next.js default for `apps/web`
5. Add server environment variables in the Vercel project settings:
   - `USE_MOCK_DATA`
   - `APIFY_TOKEN` (never expose this to the browser)
   - `APIFY_ACTOR_ID`
   - `ACTOR_RUN_TIMEOUT_SECONDS`
6. Keep `USE_MOCK_DATA=true` until the Actor is ready, then switch it to `false` for a live demo.

If Vercel asks for a project directory, `apps/web` is the Next.js app. It still needs the workspace root so it can resolve `@scouvela/shared`.

## How to deploy the Actor to Apify

1. Create an Actor in the Apify Console named `scouvela-discovery`, or let the CLI create it.
2. From `apps/actor`, log in and push:

```bash
cd apps/actor
apify login
apify push
```

The Actor Dockerfile uses the repository root as `dockerContextDir`, so it can install `packages/shared` and `apps/actor` together.

3. Copy the deployed Actor ID into `APIFY_ACTOR_ID`.
4. Store `APIFY_TOKEN` only in server or Apify secret settings.

Do not scrape a source until it is publicly available and approved. Keep crawler logic and transformers separate.

## Team responsibilities

- **Lois**: Apify Actor, scraping, data processing, API integration and deployment.
- **Tomike**: frontend UI, responsiveness and user experience.

Shared work:

- Changes to `packages/shared` should be reviewed by both people.
- Do not duplicate Zod schemas or result types in the frontend or Actor.

## Git workflow

Do not create remote branches until the team is ready. Use this branch layout:

| Branch | Purpose |
| --- | --- |
| `main` | Stable, demo-ready code |
| `develop` | Shared integration branch |
| `frontend-ui` | Tomike’s frontend branch |
| `apify-actor` | Lois’s Actor and data branch |

Commands the team should run when you are ready to create local branches:

```bash
git checkout -b main
git checkout -b develop
git checkout -b frontend-ui
git checkout -b apify-actor
```

Suggested daily flow:

1. Start work from the latest `develop`.
2. Tomike commits UI work on `frontend-ui`.
3. Lois commits Actor and API work on `apify-actor`.
4. Open pull requests into `develop`.
5. Promote `develop` to `main` only when the demo path is stable.

Pull requests should use `.github/pull_request_template.md`.

## Current MVP limitations

- The UI is a routing and contract placeholder, not the final visual design.
- Actor crawlers have no approved sources or selectors yet, so live runs currently return zero Dataset items.
- Playwright is optional and unused until a JavaScript-rendered source is approved.
- There is no authentication, payments, database or user accounts.
- Vendor records are `source-listed` or `unverified` only. Scouvela does not claim that a vendor is verified.
- Mock data is for frontend development. It is not a substitute for collected public records.
- Result counts are capped at 50.
- The platform only processes publicly available business information and always preserves the original `sourceUrl`.
