import type { ParsedActorInput } from '@scouvela/shared';

export type PageLabel = 'index' | 'detail';

export type IndexParseResult<TRaw> = {
  detailUrls: string[];
  nextIndexUrls: string[];
  records: TRaw[];
};

export type HtmlRoot = {
  (selector: string | unknown): HtmlSelection;
};

export type HtmlSelection = {
  each(fn: (index: number, element: unknown) => void): unknown;
  first(): HtmlSelection;
  text(): string;
  attr(name: string): string | undefined;
  find(selector: string): HtmlSelection;
  toArray(): unknown[];
  closest(selector: string): HtmlSelection;
};

export type SourceAdapter<TRaw> = {
  sourceName: string;
  allowedHosts: readonly string[];
  allowedPathPrefixes: readonly string[];
  approvalEnvVar: string;
  liveAccessReason: string;
  getStartUrls(input: ParsedActorInput): string[];
  classifyUrl(url: string): PageLabel | null;
  parseIndex($: HtmlRoot, pageUrl: string, input: ParsedActorInput): IndexParseResult<TRaw>;
  parseDetail($: HtmlRoot, pageUrl: string, input: ParsedActorInput): TRaw | null;
};

export function isLiveSourceApproved(envVar: string): boolean {
  return process.env[envVar] === 'true';
}
