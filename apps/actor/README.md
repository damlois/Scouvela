# Scouvela Discovery Actor

Apify Actor that collects publicly listed Nigerian SME funding products and local vendors, normalises them, deduplicates them, and pushes valid records to the default Dataset.

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
| `businessCategory` | no | Reserved for later funding filters |
| `state` | no | Vendor allowlist currently supports Lagos only |
| `locality` | no | Applied as a text filter (Ikeja, Yaba) |
| `fundingType` | no | Filters records that state an explicit type |
| `maxResults` | no | Default 5, minimum 1, maximum 20 |

## Output schemas

Shared Zod contracts in `packages/shared`:

- Funding: `kind: "funding"` plus title, provider, fundingType, optional amount/eligibility/deadline/location/description, `status`, `sourceUrl`, `sourceName`, `discoveredAt`
- Vendor: `kind: "vendor"` plus name, category, state, optional locality/address/phone/website/rating/description, `verificationStatus: "source-listed"`, `sourceUrl`, `sourceName`, `discoveredAt`

Uncertain funding status is `unverified`. Vendors are never labelled verified.

## Local run

```bash
pnpm --filter @scouvela/shared build
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
pnpm --filter @scouvela/actor test
```

Fixture HTML is minimal class-compatible markup. Whole web pages are not copied into the repo.

## Live smoke tests

Disabled by default:

```bash
# PowerShell
$env:RUN_LIVE_CRAWL_TESTS = 'true'
$env:SCOUVELA_FUNDING_SOURCE_APPROVED = 'true'
$env:SCOUVELA_VENDOR_SOURCE_APPROVED = 'true'
pnpm --filter @scouvela/actor test
```

Live tests use `maxResults: 3`.

## Apify deployment

Follow [APIFY_SETUP.md](./APIFY_SETUP.md). Short version:

```bash
cd apps/actor
apify login
apify push
apify call --input-file examples/funding.json
```

## Dataset inspection

Open the run → **Dataset**. Export JSON or CSV from Console. Locally, Crawlee writes to `apps/actor/storage/datasets/default/`.

## Known limitations

- Live sources require explicit operator approval.
- Vendor discovery is Lagos-only in this version.
- BOI products often omit deadlines, so status is frequently `unverified` unless the page says applications are open or states a date.
- Funding type is omitted (record skipped) when the page does not clearly say loan, grant, accelerator or support programme.
- Pagination is capped at two index pages.

## If source HTML changes

1. Re-fetch a single index and detail page manually.
2. Update selectors only inside the relevant adapter.
3. Replace the tiny fixtures in `test/fixtures/`.
4. Run `pnpm --filter @scouvela/actor test`.
5. If product links disappear entirely, the Actor should throw `SourceStructureError` rather than invent records.

## Sample inputs

```json
{
  "mode": "funding",
  "query": "SME",
  "fundingType": "loan",
  "maxResults": 5
}
```

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
