export type FailedSource = {
  sourceId: string;
  message: string;
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
    startedAt: Date.now(),
  };
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
    runDurationMs: Date.now() - stats.startedAt,
  };
}
