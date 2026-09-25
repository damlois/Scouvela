import { Actor, log } from 'apify';

export const PPE_AI_SEARCH_PLAN = 'ai-search-plan';
export const PPE_AI_ENRICHED_RESULT = 'ai-enriched-result';
export const PPE_AI_OPPORTUNITY_REPORT = 'ai-opportunity-report';

export async function chargeEvent(eventName: string, count = 1): Promise<boolean> {
  if (count < 1) {
    return false;
  }

  try {
    await Actor.charge({ eventName, count });
    return true;
  } catch (error) {
    log.debug('PPE charge skipped', {
      eventName,
      message: error instanceof Error ? error.message : 'Unknown charge error',
    });
    return false;
  }
}
