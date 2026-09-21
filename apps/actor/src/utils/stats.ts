export type RunStats = {
  mode: 'funding' | 'vendors';
  sourceName: string;
  pagesVisited: number;
  recordsExtracted: number;
  invalidRecordsSkipped: number;
  duplicatesRemoved: number;
  recordsSaved: number;
  startedAt: number;
};

export function createRunStats(mode: 'funding' | 'vendors', sourceName: string): RunStats {
  return {
    mode,
    sourceName,
    pagesVisited: 0,
    recordsExtracted: 0,
    invalidRecordsSkipped: 0,
    duplicatesRemoved: 0,
    recordsSaved: 0,
    startedAt: Date.now(),
  };
}

export function formatRunSummary(stats: RunStats): Record<string, string | number> {
  return {
    mode: stats.mode,
    sourceUsed: stats.sourceName,
    pagesVisited: stats.pagesVisited,
    recordsExtracted: stats.recordsExtracted,
    invalidRecordsSkipped: stats.invalidRecordsSkipped,
    duplicatesRemoved: stats.duplicatesRemoved,
    recordsSaved: stats.recordsSaved,
    runDurationMs: Date.now() - stats.startedAt,
  };
}
