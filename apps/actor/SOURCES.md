# Source review

Reviewed: 2026-09-24.

Cursor must not treat this file as permission to crawl. Live HTTP crawls stay disabled until the matching approval environment variable is `true`.

This version implements four public sources. It does not claim full African coverage.

## 1. Bank of Industry — Nigeria (selected)

- **Source name:** Bank of Industry
- **Pages:** `https://www.boi.ng/product-category/smes/` and `/product/...`
- **Types:** loans, grants, funding, support programmes
- **Access:** `robots.txt` allows public product pages except `/wp-admin/`. A dedicated www.boi.ng terms page for automated access was not confirmed. Datacenter IPs can receive a WAF interstitial. Subdomains that prohibit robots are not crawled.
- **Approval:** `SCOUVELA_BOI_SOURCE_APPROVED=true`

## 2. Tony Elumelu Foundation — Africa-wide (selected)

- **Source name:** Tony Elumelu Foundation
- **Pages:** `/tef-entrepreneurship-programme` and the public 2026 programme press release
- **Types:** accelerator, training, seed support
- **Access:** `robots.txt` allows `/` except `/wp-admin/`. `tefconnect.com` registration and login pages are **not** crawled. Application URL is stored as the public TEFConnect homepage when the page names it.
- **Approval:** `SCOUVELA_TEF_SOURCE_APPROVED=true`

## 3. Ghana Enterprises Agency — Ghana (selected)

- **Source name:** Ghana Enterprises Agency
- **Pages:** `https://gea.gov.gh/d4j/` and the public SME High Growth programme article
- **Types:** training, grants, business support
- **Access:** `https://gea.gov.gh/robots.txt` allows `/`.
- **Approval:** `SCOUVELA_GEA_SOURCE_APPROVED=true`

## 4. Kenya Climate Innovation Center — Kenya (selected)

- **Source name:** Kenya Climate Innovation Center
- **Pages:** `/programmes/greenbiz` and `/programmes/cleantech`
- **Types:** accelerator, incubator, competition
- **Access:** `https://www.kenyacic.org/robots.txt` returned 404 on 2026-09-24. Only public `/programmes/` paths are requested.
- **Approval:** `SCOUVELA_KCIC_SOURCE_APPROVED=true`

## Rejected or deferred

- **AfDB procurement notices:** Cloudflare bot-management interstitial. No bypass.
- **SMEDAN:** robots.txt was not a usable policy.
- **businesslist.com.ng:** terms prohibit scrapers.
- **Finelib vendor directory:** out of scope for this opportunity Actor.
- **South Africa and Rwanda official portals:** accepted as filters only until dedicated adapters exist.

## Operator approval

```powershell
$env:SCOUVELA_BOI_SOURCE_APPROVED = 'true'
$env:SCOUVELA_TEF_SOURCE_APPROVED = 'true'
$env:SCOUVELA_GEA_SOURCE_APPROVED = 'true'
$env:SCOUVELA_KCIC_SOURCE_APPROVED = 'true'
```

Do not enable Apify Proxy to bypass WAF or CAPTCHA pages.
