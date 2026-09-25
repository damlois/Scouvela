import { Actor, log } from 'apify';

export const PPE_AI_ENRICHMENT_EVENT = 'ai-enrichment';

export async function chargeAiEnrichment(count = 1): Promise<void> {
  if (count < 1) {
    return;
  }

  try {
    await Actor.charge({ eventName: PPE_AI_ENRICHMENT_EVENT, count });
  } catch (error) {
    log.debug('PPE charge skipped', {
      eventName: PPE_AI_ENRICHMENT_EVENT,
      message: error instanceof Error ? error.message : 'Unknown charge error',
    });
  }
}
