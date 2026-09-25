# Scouvela

Scouvela is an **Apify Actor** that discovers public growth opportunities for African SMEs. It scrapes curated official websites and public social pages itself, normalizes announcements into structured opportunity records, scores completeness and credibility, and optionally uses bring-your-own-key (BYOK) AI to classify and match results.

The Actor is the core product. An optional web interface is maintained in a separate repository.

Store-facing customer documentation lives in [`apps/actor/.actor/README.md`](apps/actor/.actor/README.md). Reviewed website sources are listed in [`apps/actor/SOURCES.md`](apps/actor/SOURCES.md).

## Problems Scouvela solves

African founders and SME operators often miss grants, loans, accelerators, and training programmes because announcements are scattered across agency websites and social posts. Scouvela turns those public pages into comparable Dataset records with source URLs preserved so users can verify every listing at the origin.

## Supported opportunity types

Grants, loans, funding programmes, tenders, procurement notices, accelerators, incubators, competitions, training, mentorship, market access, export support, equipment support, and related business-support schemes.

## Supported sources

**Curated websites (default):**

- Bank of Industry SME product pages (Nigeria)
- Tony Elumelu Foundation programme pages (Africa-wide)
- Ghana Enterprises Agency programme pages (Ghana)
- Kenya Climate Innovation Center programme pages (Kenya)

**Submitted public pages:**

- Custom opportunity webpages (`sourceTypes: ["custom-webpages"]`)
- Public Instagram posts, reels, and (optionally) profile post links (`sourceTypes: ["instagram"]`)

## Current public Instagram limitations

Instagram support is best-effort. Scouvela does not offer full Instagram search, topic crawls, private-account access, login, cookies, or CAPTCHA bypass. If a public page is withheld, blocked, or incomplete, that URL is recorded and the rest of the run continues.

## Optional BYOK AI

Standard extraction needs no AI key. When AI is enabled, you supply your own OpenAI API key in Actor input. AI must not invent deadlines, application links, amounts, or official-source labels. PPE events for AI are charged only after a successful AI step. Details: [`apps/actor/docs/MONETIZATION.md`](apps/actor/docs/MONETIZATION.md).

## Repository structure

```text
scouvela/
├── apps/
│   └── actor/              # Apify Actor, crawlers, discovery, tests
├── packages/
│   └── shared/             # Zod schemas and shared TypeScript types
├── .github/
├── .env.example
├── package.json
└── README.md
```

This is an npm workspaces monorepo. Workspaces are `apps/actor` and `packages/shared`.

## Installation

Requires Node.js 20+.

```bash
npm install
npm run build -w @scouvela/shared
```

## Local Actor execution

Install the [Apify CLI](https://docs.apify.com/cli), then from `apps/actor`:

```bash
cd apps/actor
apify run --purge
# or
apify run --purge --input-file examples/instagram-discovery.json
```

Copy `.env.example` to a local `.env` if you need source-approval variables for live curated crawls. Prefer `apify run` over `npm run dev` when you need Apify local storage, Dataset output, and `RUN_SUMMARY`.

## Testing

```bash
npm run check:actor
```

That builds `@scouvela/shared`, typechecks the Actor, runs Actor tests, and lints the Actor package.

Individual root scripts:

```bash
npm run build
npm run typecheck
npm test
npm run lint
```

## Apify deployment

From `apps/actor`:

```bash
cd apps/actor
apify login
npm run apify:push
```

Setup notes: [`apps/actor/APIFY_SETUP.md`](apps/actor/APIFY_SETUP.md).

## PPE monetization

Scouvela uses Apify Pay Per Event for Dataset items and successful AI steps. See [`apps/actor/docs/MONETIZATION.md`](apps/actor/docs/MONETIZATION.md).

## Dataset output

Each saved record is a normalized SME opportunity: title, provider, type, countries, deadlines when explicit, application URL when found, `sourcePlatform`, `sourceUrl`, and a `verification` object with status, score, reasons, and warnings. Confirm every listing at the original `sourceUrl` before acting on it.

## Safety and responsible scraping

- Only public HTTP(S) pages are fetched.
- Localhost, private networks, and URLs with embedded credentials are rejected.
- Curated sources require review of `SOURCES.md` and approval environment variables for live crawls.
- Scouvela does not bypass login walls, CAPTCHAs, or access controls.
- One failed URL or source must not discard successful results from the same run.

## Optional web interface

The optional Scouvela web interface is maintained separately:

https://github.com/damlois/scouvela-web
