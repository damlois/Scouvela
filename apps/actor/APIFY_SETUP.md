# Apify setup for Scouvela

Create the Apify account in the browser. Do not put a real API token in this repository.

## 1. Create or sign in

1. Open [https://console.apify.com/](https://console.apify.com/).
2. Create an account or sign in.
3. Open **Settings → Integrations / API tokens**.
4. Create a token only when you are ready to deploy. Store it in your password manager or a local environment variable. Never commit it.

## 2. Install and authenticate the Apify CLI

From a terminal:

```bash
npm install -g apify-cli
apify --version
apify login
```

`apify login` is the current alias for `apify auth login`. Prefer the browser (`console`) method. The CLI stores credentials in `~/.apify/auth.json` outside this repo.

To inspect the stored token later:

```bash
apify auth token
```

## 3. Create the Actor named `scouvela-discovery`

In Apify Console:

1. Open **Actors → Create new**.
2. Name it `scouvela-discovery`.
3. You can leave the empty Actor in Console. The local project already has `.actor/actor.json` with `"name": "scouvela-discovery"`.

Alternatively, the first `apify push` from `apps/actor` will create or update that named Actor.

## 4. Deploy the local project

From `apps/actor`. Apify only allows a Docker context inside the Actor folder, so the shared package is copied in first:

```bash
npm run build -w @scouvela/shared
cd apps/actor
npm run bundle-shared
apify push
```

Or in one step:

```bash
cd apps/actor
npm run apify:push
```

`dockerContextDir` is relative to `.actor/actor.json`, so it must be `..` (the Actor folder). `../..` is the monorepo root and Apify rejects that on `apify push`.

## 5. Build and run

In Console, open the Actor → **Build**, then **Start**.

From the CLI, after a successful push:

```bash
cd apps/actor
apify actors build
apify call --input-file examples/funding.json
```

`apify call` runs the last pushed Actor remotely and waits for it to finish.

## 6. Find the Actor ID

In Console, open the Actor. The ID is in the URL:

```text
https://console.apify.com/actors/<ACTOR_ID>
```

Or:

```bash
apify actors info scouvela-discovery
```

Copy that ID into `APIFY_ACTOR_ID` on the web server later. Do not put it in the Actor source.

## 7. Inspect the run log

Open the finished run → **Log**. Check:

- mode and source used
- pages visited
- records saved
- any `SourceNotApprovedError`, `SourceUnreachableError`, or `SourceStructureError`

## 8. Open the default Dataset

In the same run, open **Dataset**. That is the default run Dataset written by `Actor.pushData()`.

## 9. Export JSON or CSV

From the Dataset page use **Export → JSON** or **Export → CSV**.

From the CLI, copy the Dataset ID from the run and use the Apify API or Console export. Do not paste tokens into command history files that will be committed.

## 10. Store the API token securely

- Keep `APIFY_TOKEN` in local `.env`, CI secrets, or Apify account settings only.
- Never commit `.env`, `auth.json`, or a token in `SOURCES.md` / README samples.
- Rotate the token if it is ever pasted into chat, a screenshot, or git.

Reviewed source approval is now the default in `.actor/actor.json` so Store users can run without extra env setup. Local CLI runs still need the per-source `SCOUVELA_*_SOURCE_APPROVED` variables (or `SCOUVELA_FUNDING_SOURCE_APPROVED`) if you are not using those Actor defaults. Re-read `SOURCES.md` before you change sources.

## 11. Monetization (pay per event)

Store users should see three events. Configure them in Console: Actor → **Publishing → Monetization → Pay per event**.

| Event name | Title | Charged by | Suggested price |
| --- | --- | --- | --- |
| `apify-default-dataset-item` | Dataset item | Platform, each saved opportunity | $0.005 |
| `ai-search-plan` | AI search plan | Code, only when a plan validates | $0.010 |
| `ai-enriched-result` | AI enriched result | Code, only when a summary validates | $0.010 |
| `ai-opportunity-report` | AI opportunity brief | Code, only when the brief is saved | $0.050 |

Include platform usage in the event prices so users are not surprised by a second compute bill. Set **Primary event** to `apify-default-dataset-item`.

Do not add proxy or third-party API-key fields. Optional AI uses Apify’s OpenRouter proxy (`APIFY_TOKEN` already injected on platform runs).

## 12. Publish to Apify Store

1. Push this version (`0.3`) with `npm run apify:push`.
2. Open **Publishing**. Title and description should match `.actor/actor.json`.
3. Categories that fit: Lead generation, Other.
4. The Store README is `.actor/README.md`. Confirm it renders after the build.
5. Add a screenshot of a successful opportunity Dataset (JSON/table) and one input form.
6. Fill **About** with the closing paragraph from `.actor/README.md`.
7. Run a Store demo from Console with a curated-websites or Instagram example input and link that run as the demo.
8. Submit or publish when the README, input form, Dataset views, and PPE events all match.
