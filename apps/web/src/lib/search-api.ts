import {
  searchResponseSchema,
  type SearchRequest,
  type SearchResponse,
} from '@scouvela/shared';

export class SearchApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'SearchApiError';
  }
}

export async function requestSearch(body: SearchRequest): Promise<SearchResponse> {
  const response = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SearchApiError('Search is temporarily unavailable.', response.status);
  }

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object' &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
        ? payload.error.message
        : 'The discovery search could not be completed.';
    const code =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object' &&
      'code' in payload.error &&
      typeof payload.error.code === 'string'
        ? payload.error.code
        : undefined;
    throw new SearchApiError(message, response.status, code);
  }

  return searchResponseSchema.parse(payload);
}
