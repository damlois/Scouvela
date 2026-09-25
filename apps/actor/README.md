# Scouvela African SME Opportunities Actor

Apify Actor that discovers publicly listed African SME opportunities — grants, loans, accelerators, training programmes and competitions — then normalises, deduplicates and saves source-linked records.

The Store listing lives in [`.actor/README.md`](./.actor/README.md). Source review is in [SOURCES.md](./SOURCES.md). Pricing is in [docs/MONETIZATION.md](./docs/MONETIZATION.md).

Scouvela aggregates publicly available information and preserves the original source. Users should verify current funding terms and vendor information at the source before acting.

## Selected sources

See [SOURCES.md](./SOURCES.md) for the full review.

- **Funding:** Bank of Industry public SME product pages on `www.boi.ng`.
- **Vendors:** Finelib.com Lagos category and listing pages.

Live HTTP crawls are **off** until you read `SOURCES.md` and set:

- `SCOUVELA_FUNDING_SOURCE_APPROVED=true`
- `SCOUVELA_VENDOR_SOURCE_APPROVED=true`

## Access and ethical constraints

- Only public business information is collected. Personal emails are ignored.
- Original `sourceUrl` is stored on every record.
- robots.txt is checked during source selection. `/search.php` and `/account.php` are never requested.
- CAPTCHAs, logins, rate-limit bypasses, Google Search/Maps and social platforms are out of scope.
- Untrusted input is never used as a CSS selector or as an unrestricted crawl URL. Vendor categories and states map through an allowlist.
- If a source becomes unreachable or loses its listing markup, the Actor exits with an error. A search that simply finds nothing still succeeds and saves zero records.
- No fabricated fallback records are written.

## Architecture

```text
Actor input (Zod)
  → source adapter (start URLs + selectors)
  → CheerioCrawler (allowlisted hosts only)
  → transformers (trim, dates, IDs)
  → dedupe + merge complementary fields
  → Zod output validation
  → Actor.pushData()
```

Selectors live in:

- `src/sources/funding/boi-funding-source.ts`
- `src/sources/vendors/finelib-vendor-source.ts`

Cheerio is the default. Playwright remains an unused fallback in `src/crawlers/playwright-fallback.ts` because both selected sources render listing HTML on the server.

## Input fields

| Field | Required | Notes |
| --- | --- | --- |
| `mode` | yes | `funding` or `vendors` |
| `query` | vendors: query **or** `serviceCategory` | Trimmed. Never interpolated into a URL path |
| `serviceCategory` | vendors: query **or** this field | Allowlisted values such as tailoring, bakery, shoemaker, printing, packaging |
| `businessCategory` | no | Accepted but unused in this version |
| `state` | no | Vendor allowlist currently supports Lagos only |
| `locality` | no | Applied as a text filter (Ikeja, Yaba) |
| `fundingType` | no | Filters records that state an explicit type |
| `maxResults` | no | Default 5, minimum 1, maximum 20 |
| `enrichWithLlm` | no | Default `false`. Adds `aiSummary` from already extracted fields and charges the `ai-enrichment` PPE event |

## Output schemas

Shared Zod contracts in `packages/shared`:

- Funding: `kind: "funding"` plus title, provider, optional fundingType, optional amount/eligibility/deadline/location/description, `status`, `sourceUrl`, `sourceName`, `discoveredAt`, optional `aiSummary`
- Vendor: `kind: "vendor"` plus name, category, state, optional locality/address/phone/website/rating/description, `verificationStatus: "source-listed"`, `sourceUrl`, `sourceName`, `discoveredAt`, optional `aiSummary`

Uncertain funding status is `unverified`. Vendors are never labelled verified.

## Local run

```bash
npm run build -w @scouvela/shared
cd apps/actor
apify run
```

Default input is `INPUT.json` / `storage/key_value_stores/default/INPUT.json`. Tests do not overwrite that file. Use the example files instead:

```bash
apify run --input-file examples/funding.json
apify run --input-file examples/vendors-ikeja.json
```

Without the approval environment variables, a live run exits with `SourceNotApprovedError`. That is expected until you review `SOURCES.md`.

## Tests

```bash
npm test -w @scouvela/actor
```

Fixture HTML is minimal class-compatible markup. Whole web pages are not copied into the repo.

## Live smoke tests

Disabled by default:

```bash
# PowerShell
$env:RUN_LIVE_CRAWL_TESTS = 'true'
$env:SCOUVELA_FUNDING_SOURCE_APPROVED = 'true'
$env:SCOUVELA_VENDOR_SOURCE_APPROVED = 'true'
npm test -w @scouvela/actor
```

Live tests use `maxResults: 3`.

## Apify deployment

Follow [APIFY_SETUP.md](./APIFY_SETUP.md). Short version:

```bash
cd apps/actor
apify login
npm run apify:push
apify call --input-file examples/funding.json
```

## Dataset inspection

Open the run → **Dataset**. Export JSON or CSV from Console. Locally, Crawlee writes to `apps/actor/storage/datasets/default/`.

## Known limitations

- Live sources require explicit operator approval.
- Vendor discovery is Lagos-only in this version.
- BOI products often omit deadlines, so status is frequently `unverified` unless the page says applications are open or states a date.
- Funding type is recorded only when the page clearly states loan, grant, accelerator or support programme. Listings without that language are still saved; the type is left blank rather than guessed.
- Pagination is capped at two index pages. Detail pages are visited from the full index, not only the first `maxResults` cards.
- Optional AI summaries require `APIFY_TOKEN` on platform (OpenRouter proxy) or `OPENROUTER_API_KEY` locally. The Actor still saves structured rows if enrichment is skipped.

## If source HTML changes

1. Re-fetch a single index and detail page manually.
2. Update selectors only inside the relevant adapter.
3. Replace the tiny fixtures in `test/fixtures/`.
4. Run `npm test -w @scouvela/actor`.
5. If product links disappear entirely, the Actor should throw `SourceStructureError` rather than invent records.

## Sample inputs

```json
{
  "mode": "funding",
  "query": "SME",
  "maxResults": 5
}
```

`examples/funding-loans.json` adds `"fundingType": "loan"`. Many BOI products are titled “Fund” or “Programme” and never use the word loan, so that filter skips them. `examples/funding-llm.json` turns on optional AI summaries.

```json
{
  "mode": "vendors",
  "serviceCategory": "tailoring",
  "state": "Lagos",
  "locality": "Ikeja",
  "maxResults": 5
}
```

## Sample output shapes

```json
{
  "id": "funding-…",
  "kind": "funding",
  "title": "SME Working Capital Loan",
  "provider": "Bank of Industry",
  "fundingType": "loan",
  "status": "unverified",
  "sourceName": "Bank of Industry",
  "sourceUrl": "https://www.boi.ng/product/sme-working-capital-loan",
  "discoveredAt": "2026-09-21T08:00:00.000Z"
}
```

```json
{
  "id": "vendor-…",
  "kind": "vendor",
  "name": "Ikeja Stitch Studio",
  "category": "tailoring",
  "state": "Lagos",
  "locality": "Ikeja",
  "verificationStatus": "source-listed",
  "sourceName": "Finelib.com",
  "sourceUrl": "https://www.finelib.com/listing/Ikeja-Stitch-Studio/1001",
  "discoveredAt": "2026-09-21T08:00:00.000Z"
}
```
