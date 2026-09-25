# Scouvela African SME Opportunities Actor

Scouvela discovers public SME opportunities from official websites and public social-media pages, converts unstructured announcements into normalized opportunity records, evaluates their completeness and credibility, and optionally uses AI to classify and match them to African businesses.

Scouvela performs its own scraping. It does not call another Apify Store Actor or an unofficial paid scraping API.

The Store listing lives in [`.actor/README.md`](./.actor/README.md). Reviewed website sources are in [SOURCES.md](./SOURCES.md). Pricing is in [docs/MONETIZATION.md](./docs/MONETIZATION.md).

## Curated websites

These four public sources stay in the default run:

- Bank of Industry SME product pages (Nigeria)
- Tony Elumelu Foundation programme pages (Africa-wide)
- Ghana Enterprises Agency programme pages (Ghana)
- Kenya Climate Innovation Center programme pages (Kenya)

Leave `sourceTypes` at `["curated-websites"]` to run only those sites. South Africa and Rwanda are accepted as filters for later sources. They are not crawled yet.

## Social opportunity discovery

You can also submit public Instagram URLs. Scouvela fetches those pages itself, looks for opportunity language, and saves a normalized record only when the post looks like an SME opportunity.

Supported Instagram URLs:

- `https://www.instagram.com/p/...` public posts
- `https://www.instagram.com/reel/...` and `/reels/...` public reels
- `https://www.instagram.com/{handle}/` public profiles

When `discoverFromProfiles` is true, a profile URL may include up to `maxPostsPerProfile` recent posts that are already visible in the public page HTML. The default is 5, and the maximum is 10.

Instagram support is best-effort. Scouvela does not provide full Instagram search, a topic crawl, or access to private accounts. If Instagram withholds a page, shows a login wall, or serves a CAPTCHA, that URL is recorded as blocked or unavailable and the rest of the run continues. Scouvela does not log in, accept social credentials, or bypass access controls.

Submitted URLs must be public `http` or `https` links. Localhost, private-network addresses, and URLs with embedded passwords are rejected. One bad URL does not fail the run.

## Example input

`examples/instagram-discovery.json`:

```json
{
  "sourceTypes": [
    "curated-websites",
    "instagram"
  ],
  "startUrls": [
    {
      "url": "https://www.instagram.com/example_organisation/"
    },
    {
      "url": "https://www.instagram.com/p/example_post/"
    }
  ],
  "discoverFromProfiles": true,
  "maxPostsPerProfile": 5,
  "countries": ["Nigeria"],
  "opportunityTypes": [
    "grant",
    "tender",
    "accelerator",
    "training"
  ],
  "includeExpired": false,
  "maxResults": 20,
  "ai": {
    "enabled": false,
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "generateReport": false
  }
}
```

## Example output

A saved record keeps the scraped facts separate from optional AI fields. Social posts also include where they were found:

```json
{
  "title": "Applications are open for the SME working-capital grant.",
  "provider": "Bank of Industry",
  "opportunityType": "grant",
  "sourcePlatform": "website",
  "countries": ["Nigeria"],
  "status": "active",
  "deadline": "2026-09-30",
  "verification": {
    "status": "verified-application-page",
    "score": 85,
    "reasons": ["An application URL is present.", "The application page was fetched successfully."],
    "warnings": []
  },
  "applicationUrl": "https://www.boi.ng/product/sme-grant",
  "sourceUrl": "https://www.boi.ng/product/sme-grant",
  "discoveredFrom": [
    "https://www.boi.ng/product/sme-grant",
    "https://www.instagram.com/p/AbCdEf"
  ],
  "ai": null,
  "scrapedAt": "2026-09-25T00:00:00.000Z"
}
```

Curated website records use `"sourcePlatform": "website"`. Instagram records use `"sourcePlatform": "instagram"` and a `contentType` of `social-post`, `social-reel`, or `social-profile`.

## Verification

Every saved record has `verification.status`, `verification.score`, `reasons`, and `warnings`.

- `verified-application-page`: the opportunity is supported by an application page Scouvela actually fetched.
- `official-source`: the content appears to come from the provider’s own public website or a public account whose name matches the provider, and no separate application page was confirmed. Instagram’s own verification badge is not treated as proof.
- `unverified`: the post may be a repost, or the provider’s identity could not be established.
- `incomplete`: an application link or application method is missing.

Scouvela does not describe a source as official unless the saved reasons say why.

## AI and pay per event

Standard extraction works with AI off. No OpenAI key is required.

When `ai.enabled` is true, you supply your own OpenAI key. Scouvela may plan the search, summarise a saved opportunity, or cite a phrase that is already in a social post. It does not invent deadlines, application links, or funding amounts, and it does not overwrite scraped facts. The key is not written to the Dataset, logs, or `RUN_SUMMARY`.

Pay-per-event charges run only after a successful AI response:

- `ai-search-plan`
- `ai-enriched-result`
- `ai-opportunity-report`

A failed or rejected AI call is not charged. You still pay OpenAI directly for requests that reach their API.

## Reliability

- One inaccessible Instagram page, malformed URL, non-opportunity post, incomplete post, AI failure, expired record, or unsupported social URL does not fail the whole run.
- The Actor fails only when curated sources were selected, every one of them failed, and no submitted URL was processed.
- A run summary is stored in the default key-value store as `RUN_SUMMARY`. It counts social attempts, blocked pages, skipped non-opportunities, and duplicates. It does not contain API keys or page HTML.
- The same provider, title, application URL, deadline, and opportunity type found on a website and on Instagram is saved once. Extra source URLs stay in `discoveredFrom`.

## Local run

From the repository root:

```bash
npm run check:actor
npm start -w @scouvela/actor
```

To pass the sample input through the Apify CLI, from `apps/actor`:

```bash
apify run --input-file examples/instagram-discovery.json
```

Live Instagram requests are not part of the normal test run. Set `RUN_LIVE_INSTAGRAM_TESTS=true` only when you intentionally want one public-page smoke request.
