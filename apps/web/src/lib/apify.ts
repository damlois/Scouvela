import { ApifyClient } from 'apify-client';
import {
  fundingOpportunitySchema,
  vendorSchema,
  type ActorInput,
  type FundingOpportunity,
  type ParsedSearchRequest,
  type SearchResponse,
  type Vendor,
} from '@scouvela/shared';
import type { ServerEnv } from './env';

class ActorRunError extends Error {
  constructor(
    message: string,
    readonly code: 'ACTOR_TIMEOUT' | 'ACTOR_FAILED' | 'INVALID_DATASET' | 'CONFIGURATION_ERROR',
  ) {
    super(message);
    this.name = 'ActorRunError';
  }
}

export { ActorRunError };

function toActorInput(request: ParsedSearchRequest): ActorInput {
  if (request.mode === 'funding') {
    return {
      mode: 'funding',
      query: request.query,
      businessCategory: request.businessCategory,
      state: request.state,
      locality: request.locality,
      fundingType: request.fundingType,
      maxResults: request.maxResults,
    };
  }

  return {
    mode: 'vendors',
    query: request.query,
    serviceCategory: request.serviceCategory,
    state: request.state,
    locality: request.locality,
    maxResults: request.maxResults,
  };
}

function validateFundingItems(items: unknown[]): FundingOpportunity[] {
  const results: FundingOpportunity[] = [];

  for (const item of items) {
    const parsed = fundingOpportunitySchema.safeParse(item);
    if (parsed.success) {
      results.push(parsed.data);
    }
  }

  return results;
}

function validateVendorItems(items: unknown[]): Vendor[] {
  const results: Vendor[] = [];

  for (const item of items) {
    const parsed = vendorSchema.safeParse(item);
    if (parsed.success) {
      results.push(parsed.data);
    }
  }

  return results;
}

export async function runScouvelaActor(
  request: ParsedSearchRequest,
  env: ServerEnv,
): Promise<SearchResponse> {
  if (!env.apifyToken || !env.apifyActorId) {
    throw new ActorRunError('Apify is not configured on the server.', 'CONFIGURATION_ERROR');
  }

  const client = new ApifyClient({ token: env.apifyToken });
  const run = await client.actor(env.apifyActorId).call(toActorInput(request), {
    waitSecs: env.actorRunTimeoutSeconds,
  });

  if (run.status === 'RUNNING' || run.status === 'READY') {
    throw new ActorRunError('The discovery search timed out. Please try again.', 'ACTOR_TIMEOUT');
  }

  if (run.status !== 'SUCCEEDED') {
    throw new ActorRunError('The discovery search could not be completed.', 'ACTOR_FAILED');
  }

  if (!run.defaultDatasetId) {
    throw new ActorRunError('No dataset was returned for this search.', 'INVALID_DATASET');
  }

  const dataset = await client.dataset(run.defaultDatasetId).listItems({
    limit: request.maxResults,
  });

  if (request.mode === 'funding') {
    const results = validateFundingItems(dataset.items).slice(0, request.maxResults);
    return {
      mode: 'funding',
      results,
      meta: {
        resultCount: results.length,
        usedMockData: false,
        source: 'apify',
      },
    };
  }

  const results = validateVendorItems(dataset.items).slice(0, request.maxResults);
  return {
    mode: 'vendors',
    results,
    meta: {
      resultCount: results.length,
      usedMockData: false,
      source: 'apify',
    },
  };
}
