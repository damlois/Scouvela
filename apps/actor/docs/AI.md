# AI Opportunity Agent

AI is optional. Extraction, validation and Dataset export work with `ai.enabled` left false.

When enabled:

1. The customer supplies an OpenAI API key in the secret `ai.apiKey` field.
2. A search plan can expand types, sectors and target groups from the query.
3. Each saved opportunity can receive an `ai` object: summary, match score, reasons, missing information.
4. `generateReport` writes `OPPORTUNITY_REPORT` to the key-value store.

Rules:

- AI output is stored only under `ai`. Scraped facts stay unchanged.
- The model is told not to invent eligibility, deadlines or amounts.
- Invalid or failed AI responses are dropped. Those events are not charged.
- The API key is never logged, saved on a record, or written to the report.
