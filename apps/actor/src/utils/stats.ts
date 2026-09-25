export type FailedSource = {
  sourceId: string;
  message: string;
};

export type RejectedStartUrl = {
  url: string;
  reason: string;
};

export type RunStats = {
  sourcesAttempted: string[];
  sourcesCompleted: string[];
  failedSources: FailedSource[];
  pagesVisited: number;
  recordsExtracted: number;
  invalidRecordsSkipped: number;
  duplicatesRemoved: number;
  recordsSaved: number;
  aiPlansGenerated: number;
  aiResultsGenerated: number;
  aiReportsGenerated: number;
  ppeEventsCharged: number;
  submittedUrlsAttempted: number;
  customWebpagesAttempted: number;
  instagramUrlsAttempted: number;
  socialUrlsAttempted: number;
  instagramPostsProcessed: number;
  instagramProfilesProcessed: number;
  socialPagesBlocked: number;
  socialPagesUnavailable: number;
  candidatesDetected: number;
  opportunityCandidatesDetected: number;
  recordsNormalized: number;
  recordsFilteredExpired: number;
  recordsFilteredByInput: number;
  nonOpportunityContentSkipped: number;
  incompleteSocialRecordsSaved: number;
  rejectedStartUrls: RejectedStartUrl[];
  startedAt: number;
};

export function createRunStats(): RunStats {
  return {
    sourcesAttempted: [],
    sourcesCompleted: [],
    failedSources: [],
    pagesVisited: 0,
    recordsExtracted: 0,
    invalidRecordsSkipped: 0,
    duplicatesRemoved: 0,
    recordsSaved: 0,
    aiPlansGenerated: 0,
    aiResultsGenerated: 0,
    aiReportsGenerated: 0,
    ppeEventsCharged: 0,
    submittedUrlsAttempted: 0,
    customWebpagesAttempted: 0,
    instagramUrlsAttempted: 0,
    socialUrlsAttempted: 0,
    instagramPostsProcessed: 0,
    instagramProfilesProcessed: 0,
    socialPagesBlocked: 0,
    socialPagesUnavailable: 0,
    candidatesDetected: 0,
    opportunityCandidatesDetected: 0,
    recordsNormalized: 0,
    recordsFilteredExpired: 0,
    recordsFilteredByInput: 0,
    nonOpportunityContentSkipped: 0,
    incompleteSocialRecordsSaved: 0,
    rejectedStartUrls: [],
    startedAt: Date.now(),
  };
}

export function sanitizeRejectedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.username = '';
    parsed.password = '';
    parsed.hash = '';
    for (const key of [...parsed.searchParams.keys()]) {
      if (/(token|key|secret|password|auth|session|cookie)/i.test(key)) {
        parsed.searchParams.set(key, '[redacted]');
      }
    }
    return parsed.toString();
  } catch {
    return '[invalid-url]';
  }
}

export function pushRejectedStartUrl(stats: RunStats, url: string, reason: string): void {
  stats.rejectedStartUrls.push({
    url: sanitizeRejectedUrl(url),
    reason,
  });
}

export function formatRunSummary(stats: RunStats): Record<string, string | number> {
  return {
    sourcesAttempted: stats.sourcesAttempted.join(', ') || 'none',
    sourcesCompleted: stats.sourcesCompleted.join(', ') || 'none',
    failedSources: stats.failedSources.map((item) => item.sourceId).join(', ') || 'none',
    pagesVisited: stats.pagesVisited,
    recordsExtracted: stats.recordsExtracted,
    invalidRecordsSkipped: stats.invalidRecordsSkipped,
    duplicatesRemoved: stats.duplicatesRemoved,
    recordsSaved: stats.recordsSaved,
    aiPlansGenerated: stats.aiPlansGenerated,
    aiResultsGenerated: stats.aiResultsGenerated,
    aiReportsGenerated: stats.aiReportsGenerated,
    ppeEventsCharged: stats.ppeEventsCharged,
    submittedUrlsAttempted: stats.submittedUrlsAttempted,
    customWebpagesAttempted: stats.customWebpagesAttempted,
    instagramUrlsAttempted: stats.instagramUrlsAttempted,
    socialUrlsAttempted: stats.socialUrlsAttempted,
    instagramPostsProcessed: stats.instagramPostsProcessed,
    instagramProfilesProcessed: stats.instagramProfilesProcessed,
    socialPagesBlocked: stats.socialPagesBlocked,
    socialPagesUnavailable: stats.socialPagesUnavailable,
    candidatesDetected: stats.candidatesDetected,
    opportunityCandidatesDetected: stats.opportunityCandidatesDetected,
    recordsNormalized: stats.recordsNormalized,
    recordsFilteredExpired: stats.recordsFilteredExpired,
    recordsFilteredByInput: stats.recordsFilteredByInput,
    nonOpportunityContentSkipped: stats.nonOpportunityContentSkipped,
    incompleteSocialRecordsSaved: stats.incompleteSocialRecordsSaved,
    rejectedStartUrls: stats.rejectedStartUrls.length,
    rejectedStartUrlDetails: stats.rejectedStartUrls
      .map((item) => `${item.url} (${item.reason})`)
      .join(' | ') || 'none',
    runDurationMs: Date.now() - stats.startedAt,
  };
}

export function buildRunSummary(stats: RunStats): Record<string, string | number> {
  return formatRunSummary(stats);
}

export function shouldFailRun(stats: RunStats, savedCount: number): boolean {
  if (
    savedCount > 0 ||
    stats.submittedUrlsAttempted > 0 ||
    stats.socialUrlsAttempted > 0 ||
    stats.sourcesCompleted.length > 0
  ) {
    return false;
  }

  return stats.failedSources.length > 0 && stats.sourcesAttempted.length > 0;
}
