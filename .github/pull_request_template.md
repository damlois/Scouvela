## Pull request

### Summary

- What changed and why?

### Workspace

- [ ] `apps/web` (frontend)
- [ ] `apps/actor` (Apify Actor)
- [ ] `packages/shared` (schemas and types)

### Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Data or Actor change
- [ ] UI only
- [ ] Documentation
- [ ] Chore / tooling

### Checklist

- [ ] I used the shared Zod schemas instead of duplicating types
- [ ] I did not expose `APIFY_TOKEN` or other secrets to the client
- [ ] Every result still includes the original `sourceUrl`
- [ ] I did not invent scraped records or unverified “verified” labels
- [ ] Mock mode still works for frontend development (`USE_MOCK_DATA=true`)
- [ ] `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass
- [ ] I tested the affected route or Actor path locally

### How to test

1.
2.

### Screenshots / sample output

If this changes UI or Actor output, attach a screenshot or a short sample JSON payload.

### Notes for reviewers

Target branch should be `develop`, unless this is a documented hotfix for `main`.
