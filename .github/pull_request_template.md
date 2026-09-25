## Pull request

### Summary

- What changed and why?

### Workspace

- [ ] `apps/actor` (Apify Actor)
- [ ] `packages/shared` (schemas and types)
- [ ] Root tooling / docs

### Type of change

- [ ] Feature
- [ ] Bug fix
- [ ] Data or Actor change
- [ ] Documentation
- [ ] Chore / tooling

### Checklist

- [ ] I used the shared Zod schemas instead of duplicating types
- [ ] I did not commit secrets (`APIFY_TOKEN`, OpenAI keys, cookies, credentials)
- [ ] Every result still includes the original `sourceUrl`
- [ ] I did not invent scraped records or unverified “verified” / “official” labels
- [ ] `npm run check:actor` passes (or I documented why a subset was run)
- [ ] I tested the affected Actor path locally when behaviour changed

### How to test

1.
2.

### Screenshots / sample output

If this changes Actor output, attach a short sample JSON payload or Dataset excerpt.

### Notes for reviewers

Target branch should be `actor-hackathon-final` or `main`, as agreed for the change.
