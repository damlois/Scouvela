# Scouvela

Scouvela is an Apify Actor that discovers grants, loans, accelerators, training programmes and other public growth opportunities for African SMEs. Standard extraction needs no API key. Optional AI matching uses your own OpenAI key.

MVP sources cover Nigeria, Ghana, Kenya, and Africa-wide programmes. This is not full continental coverage.

This repository is an npm workspaces monorepo. The Apify Actor is the product. Shared Zod contracts keep the optional web app aligned with Actor input and output.

## Architecture overview

- `apps/web` is a Next.js App Router application. It owns the UI and a server-only `POST /api/search` route.
- `apps/actor` is a TypeScript Apify Actor. It will collect publicly listed records, normalise them, deduplicate them and push valid items to an Apify Dataset.
- `packages/shared` is the contract layer. Zod schemas and inferred TypeScript types are defined once and imported by both apps.

The current demo UI searches local mock data in the browser. It does not call Apify and does not call `POST /api/search`. That API route remains in place for later Actor integration and still keeps `APIFY_TOKEN` on the server.

```text
Browser UI  →  local mock data  →  typed result cards
POST /api/search remains available for a later Apify-backed search.
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
├── package-lock.json
├── README.md
└── tsconfig.base.json
```

## Prerequisites

- Node.js 20 or newer
- npm (bundled with Node.js)
- An Apify account only when you are ready to run or deploy the Actor
- A Vercel account only when you are ready to deploy the web app

## Installation

From the repository root:

```bash
npm install
npm run build -w @scouvela/shared
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
- `USE_MOCK_DATA=false` requires both `APIFY_TOKEN` and `APIFY_ACTOR_ID`, and search pages call `POST /api/search` which starts the Actor.
- `ACTOR_RUN_TIMEOUT_SECONDS` defaults to 180 and is capped at 300.

## Local development commands

```bash
npm install
npm run dev          # shared build, then Next.js at http://localhost:3000
npm run dev:web      # frontend only
npm run dev:actor    # Actor entrypoint (needs Apify local storage / `apify run`)
npm run build
npm run lint
npm run typecheck
npm test
```

Useful pages:

- `/` landing page
- `/funding` funding search
- `/vendors` vendor search
- `/funding?state=error` and `/vendors?state=error` preview the error state in development

## Brand assets

The Scouvela lockup and favicon are the official logo (teal S with amber dot, plus the wordmark):

```text
apps/web/public/images/scouvela-wordmark.png
apps/web/public/images/scouvela-mark.png
apps/web/public/favicon.ico
apps/web/src/app/icon.png
apps/web/src/app/apple-icon.png
```

The navbar and footer use the complete wordmark image. The S mark is used for the favicon.

## How search talks to Apify

The funding and vendor pages submit to `POST /api/search`. That route is server-only.

- `USE_MOCK_DATA=true` returns records from `apps/web/src/lib/mock-data.ts`.
- `USE_MOCK_DATA=false` starts Actor `APIFY_ACTOR_ID` with `APIFY_TOKEN`, waits for the run, then returns validated Dataset items.

The homepage still shows a few sample cards from the demo dataset. Search results are live when mock mode is off.

Confirm listings at the original `sourceUrl` before acting on them.

Demo records used in mock mode are fictional, labelled with `sourceName: "Scouvela demo dataset"`, and use `https://example.com/...` placeholder URLs.

## How to run the Actor locally

Install the [Apify CLI](https://docs.apify.com/cli) if you do not already have it:

```bash
npm install -g apify-cli
```

From `apps/actor`:

```bash
cd apps/actor
npm run build -w @scouvela/shared
apify run
```

`apps/actor/INPUT.json` is a safe sample input:

```json
{
  "mode": "funding",
  "query": "SME",
  "maxResults": 5
}
```

The Actor crawls approved public sources only after you review `apps/actor/SOURCES.md` and set the source-approval environment variables. Cheerio is the default crawler. Playwright remains an unused fallback.

You can also start the compiled TypeScript entrypoint after building shared:

```bash
npm run dev:actor
```

That command expects Apify local storage. Prefer `apify run` during Actor development.

## How to deploy the web app to Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Set the Root Directory to the repository root, or configure Vercel to build the `apps/web` workspace.
4. Use these build settings if you configure them manually:
   - Install command: `npm install`
   - Build command: `npm run build -w @scouvela/shared && npm run build -w @scouvela/web`
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
npm run apify:push
```

`npm run apify:push` copies `packages/shared` into the Actor folder, then uploads. Apify does not allow a Docker context outside `apps/actor`.

3. Copy the deployed Actor ID into `APIFY_ACTOR_ID`.
4. Store `APIFY_TOKEN` only in server or Apify secret settings.

Do not scrape a source until it is publicly available and approved. Keep crawler logic and transformers separate.

## Team responsibilities

- **Developer**: Apify Actor, scraping, data processing, API integration and deployment.
- **Developer**: frontend UI, responsiveness and user experience.

Shared work:

- Changes to `packages/shared` should be reviewed by both people.
- Do not duplicate Zod schemas or result types in the frontend or Actor.

## Git workflow

Do not create remote branches until the team is ready. Use this branch layout:

| Branch        | Purpose                      |
| ------------- | ---------------------------- |
| `main`        | Stable, demo-ready code      |
| `develop`     | Shared integration branch    |
| `frontend-ui` | Developer’s frontend branch  |
| `apify-actor` | Developer’s Actor and data branch |

Commands the team should run when you are ready to create local branches:

```bash
git checkout -b main
git checkout -b develop
git checkout -b frontend-ui
git checkout -b apify-actor
```

Suggested daily flow:

1. Start work from the latest `develop`.
2. A developer commits UI work on `frontend-ui`.
3. A developer commits Actor and API work on `apify-actor`.
4. Open pull requests into `develop`.
5. Promote `develop` to `main` only when the demo path is stable.

Pull requests should use `.github/pull_request_template.md`.

## Current MVP limitations

- The UI is a hackathon-ready frontend backed by fictional demo data, not live scraped records.
- Actor live crawls stay off until you review `apps/actor/SOURCES.md` and set the source-approval variables. Fixture tests cover parsing without hitting live sites.
- Playwright is optional and unused until a JavaScript-rendered source is approved.
- There is no authentication, payments, database or user accounts.
- Vendor records are `source-listed` or `unverified` only. Scouvela does not claim that a vendor is verified.
- Mock data is for frontend development. It is not a substitute for collected public records.
- Result counts on the web search API are capped at 50. The Actor defaults to 5 results and caps at 20.
- The platform only processes publicly available business information and always preserves the original `sourceUrl`.
