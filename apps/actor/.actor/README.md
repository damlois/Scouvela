# African SME Opportunities Scraper & AI Matcher

**One Actor. Thousands of opportunities for African businesses.**

Scouvela discovers grants, loans, accelerators, training programmes, competitions and other growth opportunities for African SMEs from public sources. It normalises fragmented pages, removes duplicates, and returns structured, source-linked records you can export as JSON, CSV or Excel — or consume through the Apify API, a webhook, a schedule, or an AI agent.

Standard extraction needs **no external API key**. Optional AI matching uses **your own OpenAI key**, so you stay in control of LLM cost.

## The problem

African entrepreneurs miss useful programmes because the information sits on government portals, foundation sites, corporate pages and development websites. It is hard to search, inconsistently formatted, often undated, and rarely available as an API.

## What this Actor does

1. Reads your country, sector, opportunity-type and keyword filters.
2. Selects matching public sources.
3. Extracts opportunities from index and detail pages.
4. Normalises dates, countries and categories.
5. Removes duplicates.
6. Marks each record `active`, `closing-soon`, `expired`, `ongoing` or `unverified`.
7. Keeps the original `sourceUrl`.
8. Optionally uses your OpenAI key to plan the search, summarise results and score matches.
9. Saves validated rows to the Dataset.

It does not apply on anyone’s behalf, invent missing amounts or deadlines, or claim full African coverage.

## MVP sources

This version crawls four reviewed public sources:

| Source | Geography | Types |
| --- | --- | --- |
| Bank of Industry SME products | Nigeria | Loans, funding, support programmes |
| Tony Elumelu Foundation programme pages | Africa-wide | Accelerator, training, seed support |
| Ghana Enterprises Agency programme pages | Ghana | Training, grants, business support |
| Kenya Climate Innovation Center programmes | Kenya | Accelerator, incubator, competition |

South Africa and Rwanda are accepted as filters for later sources. They are not crawled in this version.

## Public Instagram pages

You can add `"instagram"` to `sourceTypes` and submit public post, reel, or profile URLs in `startUrls`. Scouvela fetches those pages itself. It does not log in, search all of Instagram, or bypass a login wall. If a page is withheld, that URL is skipped and the rest of the run continues. See the Actor README for the input example and verification statuses.

## How to run

```json
{
  "query": "opportunities for women-owned fashion SMEs",
  "countries": ["Nigeria", "Ghana"],
  "opportunityTypes": ["grant", "accelerator", "training"],
  "maxResults": 10,
  "ai": { "enabled": false }
}
```

Optional AI:

```json
{
  "query": "Find grants and accelerator programmes for a woman-owned Nigerian fashion business",
  "countries": ["Nigeria"],
  "maxResults": 10,
  "ai": {
    "enabled": true,
    "provider": "openai",
    "model": "gpt-4.1-mini",
    "apiKey": "YOUR_OPENAI_KEY",
    "generateReport": true
  }
}
```

The API key is an Apify secret. It is never written to the Dataset, logs, or Actor output.

## Output

Every row includes title, provider, opportunity type, description, countries, status, source URL, source name and scrape time. Optional fields include eligibility, deadline, benefits, application URL and an `ai` object with a labelled summary and match reasons.

Confidence is extraction completeness, not an endorsement.

## Pricing

Scouvela uses transparent pay-per-event pricing. You pay only when the Actor successfully produces a chargeable result or optional AI output.

| Event | Price | When you are charged |
|---|---:|---|
| Opportunity result | **$0.01 per result** | When a valid, normalized opportunity is saved to the default Dataset |
| AI search plan | **$0.01 per plan** | When Scouvela successfully converts a natural-language request into a validated search plan |
| AI-enriched opportunity | **$0.02 per result** | When one opportunity is successfully summarized, classified and matched using AI |
| AI opportunity report | **$0.05 per report** | When a complete AI opportunity report is successfully generated and saved |

### Example costs

A standard run that returns 10 opportunities costs:

```text
10 opportunity results × $0.01 = $0.10
```

A run with 10 opportunities and every optional AI feature enabled costs:

```text
10 opportunity results        $0.10
1 AI search plan              $0.01
10 AI-enriched results        $0.20
1 AI opportunity report       $0.05
Total                         $0.36
```

The current maximum is 50 opportunity results per run. A standard 50-result run costs up to **$0.50** in Scouvela event charges.

### Optional AI costs

AI features are optional. Standard opportunity extraction works without an AI key.

When AI is enabled, you provide your own supported LLM API key through a secret Actor input. Your AI provider bills you separately for model usage. Scouvela never writes your API key to logs, Dataset records or reports.

You are not charged a successful-result event for duplicate, rejected or invalid records that are not saved to the Dataset. Failed AI operations are not charged as successful AI events.

## Limits

- No CAPTCHA, login, or WAF bypass.
- Bank of Industry may return a datacenter interstitial. Other sources still run.
- TEFConnect and other application portals are not crawled — only public programme pages.
- Missing facts stay missing.
- Always confirm terms on the original `sourceUrl`.

## About Scouvela

Scouvela is opportunity-intelligence infrastructure for African enterprise. It works as a Store Actor, a scheduled monitor, an automation step, and a data source for AI agents.

GitHub: [https://github.com/damlois/Scouvela](https://github.com/damlois/Scouvela)
