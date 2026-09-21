# Source review

Reviewed: 2026-09-21.

Cursor must not treat this file as permission to crawl. Read it before any live run. Live HTTP crawls stay disabled until you set the matching approval environment variable after you agree with the notes below.

## Funding source

### Candidate A — Bank of Industry public product pages (selected)

- **Source name:** Bank of Industry
- **Base URL:** https://www.boi.ng/
- **Page types used:** SME product index `https://www.boi.ng/product-category/smes/` (including `page/2/`) and product detail pages under `https://www.boi.ng/product/...`
- **Fields available:** product title, narrative description, sometimes loan amount, eligibility or security lists, occasional explicit “loan” / “grant” language. Deadlines are often absent.
- **Access considerations:**
  - `https://www.boi.ng/robots.txt` (retrieved 2026-09-21) allows `User-agent: *` except `/wp-admin/`.
  - Product pages return server-rendered HTML (`h2.entry-title`, `h1.entry-title`, `.page-content`).
  - Pages include `index, follow` robots meta.
  - Subdomains `fgnboimsmeinterventionloan.boi.ng`, `glow.boi.ng` and `rapid.boi.ng` publish terms that prohibit robots and spiders. Those hosts are **not** crawled.
  - A dedicated terms page on **www.boi.ng** could not be confirmed (guessed `/terms/` URLs timed out). Do not invent a conclusion from the portal terms.
- **Why it was selected:** It is the official Nigerian development-finance website requested in the brief. Public SME product pages have stable URLs and do not require login or a CAPTCHA in the HTML retrieved for this review.
- **Known limitations:** Amounts and deadlines are often missing. Funding type is recorded only when the page text explicitly supports it. Live access still needs your approval because www.boi.ng terms affecting automated access were not confirmed.
- **Date reviewed:** 2026-09-21
- **Live approval variable:** `SCOUVELA_FUNDING_SOURCE_APPROVED=true`

### Candidate B — SMEDAN (not selected)

- **Source name:** Small and Medium Enterprises Development Agency of Nigeria
- **Base URL:** https://smedan.gov.ng/
- **Access considerations:** `robots.txt` retrieved on 2026-09-21 was a defacement banner, not a usable policy. That is not a stable access rule.
- **Why it was not selected:** Access rules could not be trusted.

## Vendor source

### Candidate A — Finelib.com (selected adapter, live access gated)

- **Source name:** Finelib.com
- **Base URL:** https://www.finelib.com/
- **Page types used:** allowlisted Lagos category pages such as `/cities/lagos/business/clothing/tailoring` and listing pages `/listing/{slug}/{id}/`. `search.php` is not used.
- **Fields available:** business name, address, public phone, short description, sometimes website and locality microdata. Emails are ignored.
- **Access considerations:**
  - `https://www.finelib.com/robots.txt` allows `/` with `Crawl-delay: 1` and disallows `/search.php`, `/account.php`, `/admin/`, `/signup.php`.
  - Category and listing pages are server-rendered HTML.
  - Terms of use (https://www.finelib.com/terms-conditions.php, retrieved 2026-09-21) say site contents may not be copied or distributed and may be retrieved for personal use only. That is **not** a robots disallow, but it is a copyright / use restriction on republication.
- **Why it was selected for the adapter:** It is a public Nigerian directory with category and listing URLs, no login wall on those pages, and robots.txt permission for those paths. Selectors stay inside the vendor adapter.
- **Known limitations:** Live crawling is off until you confirm you have the right to use the listings this way. Only Lagos category slugs are allowlisted. Locality (Ikeja, Yaba) is applied as a filter on listing text, because `/cities/lagos/ikeja/...` returns 404.
- **Date reviewed:** 2026-09-21
- **Live approval variable:** `SCOUVELA_VENDOR_SOURCE_APPROVED=true`

### Candidate B — BusinessList.com.ng (rejected)

- **Source name:** Nigeria Business Directory (businesslist.com.ng)
- **Base URL:** https://www.businesslist.com.ng/
- **Access considerations:** Terms of use retrieved 2026-09-21 allow automated access by internet search engines and explicitly say you must not access the site through scripts or webcrawlers. Data Hub terms also prohibit scrapers.
- **Why it was not selected:** Automated access for this Actor is explicitly disallowed.

## Operator approval

The Actor throws `SourceNotApprovedError` until the relevant variable is `true`. Fixture tests do not need these variables.

```bash
# Only after you have read this file and accepted the residual risk
set SCOUVELA_FUNDING_SOURCE_APPROVED=true
set SCOUVELA_VENDOR_SOURCE_APPROVED=true
```

PowerShell:

```powershell
$env:SCOUVELA_FUNDING_SOURCE_APPROVED = 'true'
$env:SCOUVELA_VENDOR_SOURCE_APPROVED = 'true'
```

Do not enable Apify Proxy for these sources unless the operator later documents a permitted need.
