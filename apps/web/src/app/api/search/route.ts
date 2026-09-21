import { NextResponse } from 'next/server';
import {
  apiErrorSchema,
  searchRequestSchema,
  searchResponseSchema,
  type ApiError,
  type ApiErrorCode,
} from '@scouvela/shared';
import { ActorRunError, runScouvelaActor } from '@/lib/apify';
import { getServerEnv } from '@/lib/env';
import { getMockSearchResponse } from '@/lib/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180;

function errorResponse(code: ApiErrorCode, message: string, status: number) {
  const payload: ApiError = { error: { code, message } };
  return NextResponse.json(apiErrorSchema.parse(payload), { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Request body must be valid JSON.', 400);
  }

  const parsedRequest = searchRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return errorResponse('VALIDATION_ERROR', 'Search request is invalid.', 400);
  }

  let env;
  try {
    env = getServerEnv();
  } catch {
    return errorResponse(
      'CONFIGURATION_ERROR',
      'Search is temporarily unavailable because the server is not configured.',
      500,
    );
  }

  try {
    const response = env.useMockData
      ? getMockSearchResponse(parsedRequest.data)
      : await runScouvelaActor(parsedRequest.data, env);

    return NextResponse.json(searchResponseSchema.parse(response));
  } catch (error) {
    if (error instanceof ActorRunError) {
      const status =
        error.code === 'ACTOR_TIMEOUT' ? 504 : error.code === 'CONFIGURATION_ERROR' ? 500 : 502;
      return errorResponse(error.code, error.message, status);
    }

    return errorResponse('INTERNAL_ERROR', 'Search is temporarily unavailable.', 500);
  }
}
