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

From the repository root:

```bash
pnpm --filter @scouvela/shared build
cd apps/actor
apify push
```

Equivalent namespaced command: `apify actors push`.

The Dockerfile uses the monorepo root as `dockerContextDir`, so Apify can install `packages/shared` and `apps/actor` together.

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

- Keep `APIFY_TOKEN` in `apps/web/.env.local`, CI secrets, or Apify account settings only.
- Never commit `.env`, `auth.json`, or a token in `SOURCES.md` / README samples.
- Rotate the token if it is ever pasted into chat, a screenshot, or git.

Review `SOURCES.md` before any live crawl. Live source access is off until you set the approval environment variables documented there.
