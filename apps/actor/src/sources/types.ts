import type {
  OpportunityType,
  ParsedActorInput,
  ProviderType,
  TargetGroup,
  BusinessStage,
} from '@scouvela/shared';

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

export type RawOpportunity = {
  title?: string;
  provider?: string;
  providerType?: ProviderType;
  opportunityType?: OpportunityType;
  description?: string;
  countries?: string[];
  regions?: string[];
  sectors?: string[];
  targetGroups?: TargetGroup[];
  businessStages?: BusinessStage[];
  benefits?: string[];
  fundingAmountText?: string;
  eligibility?: string[];
  applicationProcess?: string;
  applicationUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  publishedAt?: string;
  deadline?: string;
  applicationsOpen?: boolean;
  ongoing?: boolean;
  isRemote?: boolean;
  language?: string;
};

export type SourceAdapter<TRaw = RawOpportunity> = {
  sourceId: string;
  sourceName: string;
  countries: readonly string[];
  opportunityTypes: readonly OpportunityType[];
  allowedHosts: readonly string[];
  allowedPathPrefixes: readonly string[];
  approvalEnvVar: string;
  liveAccessReason: string;
  startLabel?: PageLabel;
  requireIndexLinks?: boolean;
  getStartUrls(input: ParsedActorInput): string[];
  classifyUrl(url: string): PageLabel | null;
  parseIndex($: HtmlRoot, pageUrl: string, input: ParsedActorInput): IndexParseResult<TRaw>;
  parseDetail($: HtmlRoot, pageUrl: string, input: ParsedActorInput): TRaw | null;
};

export function isLiveSourceApproved(envVar: string): boolean {
  return process.env[envVar] === 'true' || process.env.SCOUVELA_FUNDING_SOURCE_APPROVED === 'true';
}
