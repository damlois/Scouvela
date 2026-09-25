import type { ParsedActorInput } from '@scouvela/shared';
import { classifyRejectedPost } from '../ai/social-classifier.js';
import { instagramAdapter } from '../social/instagram/instagram-adapter.js';
import { detectSource } from '../social/platform-detector.js';
import type { PageFetch, SocialContent } from '../social/types.js';
import { partitionStartUrls } from '../social/url-intake.js';
import type { RawOpportunity } from '../sources/types.js';
import { pushRejectedStartUrl, type RunStats } from '../utils/stats.js';
import { assessOpportunityText, detectOpportunity } from './opportunity-detector.js';
import { transformSocialOpportunity } from './social-opportunity-transformer.js';
import { extractWebpage, webpageToRaw } from './webpage-extractor.js';

export async function discoverFromInput(
  input: ParsedActorInput,
  stats: RunStats,
  fetchPage?: PageFetch,
): Promise<RawOpportunity[]> {
  const { accepted, rejected } = partitionStartUrls(input.startUrls);
  for (const item of rejected) {
    pushRejectedStartUrl(stats, item.submittedUrl, item.reason);
  }

  const records: RawOpportunity[] = [];
  for (const item of accepted) {
    stats.submittedUrlsAttempted += 1;
    const detected = detectSource(item.normalizedUrl);

    try {
      if (detected.platform === 'instagram') {
        stats.instagramUrlsAttempted += 1;
        stats.socialUrlsAttempted += 1;
        if (!input.sourceTypes.includes('instagram')) {
          pushRejectedStartUrl(stats, item.submittedUrl, 'Instagram intake is not enabled for this run.');
          continue;
        }

        const extracted = await instagramAdapter.extract(detected, {
          discoverFromProfiles: input.discoverFromProfiles,
          maxPostsPerProfile: input.maxPostsPerProfile,
          fetchPage,
        });
        if (detected.contentType === 'social-profile') {
          stats.instagramProfilesProcessed += 1;
        }

        for (const content of extracted) {
          if (content.contentType !== 'social-profile') {
            stats.instagramPostsProcessed += 1;
          }

          records.push(...(await recordsFromSocial(content, input, item.submittedUrl, stats)));
        }
        continue;
      }

      if (detected.platform === 'website') {
        stats.customWebpagesAttempted += 1;
        if (!input.sourceTypes.includes('custom-webpages')) {
          pushRejectedStartUrl(stats, item.submittedUrl, 'Submitted webpage intake is not enabled for this run.');
          continue;
        }

        const page = await extractWebpage(item.normalizedUrl, fetchPage);
        if (!page.ok) {
          notePageProblem(stats, page.status);
          continue;
        }

        const assessed = assessOpportunityText(page.text ?? '', []);
        if (!assessed.isCandidate) {
          stats.nonOpportunityContentSkipped += 1;
          continue;
        }

        stats.candidatesDetected += 1;
        stats.opportunityCandidatesDetected += 1;
        const raw = webpageToRaw(page, input);
        if (raw) {
          stats.recordsExtracted += 1;
          records.push(raw);
        }
        continue;
      }

      pushRejectedStartUrl(stats, item.submittedUrl, 'This social URL is not supported yet.');
    } catch (error) {
      stats.socialPagesUnavailable += 1;
      pushRejectedStartUrl(
        stats,
        item.submittedUrl,
        error instanceof Error ? error.message : 'The submitted URL could not be processed.',
      );
    }
  }

  return records;
}

async function recordsFromSocial(
  content: SocialContent,
  input: ParsedActorInput,
  submittedUrl: string,
  stats: RunStats,
): Promise<RawOpportunity[]> {
  if (content.extractionStatus === 'blocked') {
    stats.socialPagesBlocked += 1;
    return [];
  }

  if (content.extractionStatus === 'unavailable') {
    stats.socialPagesUnavailable += 1;
    return [];
  }

  const candidate = detectOpportunity(content);
  if (candidate.isCandidate) {
    stats.candidatesDetected += 1;
    stats.opportunityCandidatesDetected += 1;
    const raw = transformSocialOpportunity(candidate, input, submittedUrl);
    if (raw) {
      stats.recordsExtracted += 1;
      return [raw];
    }

    return [];
  }

  const promoted = await classifyRejectedPost(candidate, input, stats);
  if (promoted) {
    stats.candidatesDetected += 1;
    stats.opportunityCandidatesDetected += 1;
    stats.recordsExtracted += 1;
    return [promoted];
  }

  stats.nonOpportunityContentSkipped += 1;
  return [];
}

function notePageProblem(stats: RunStats, status: 'blocked' | 'unavailable'): void {
  if (status === 'blocked') {
    stats.socialPagesBlocked += 1;
    return;
  }

  stats.socialPagesUnavailable += 1;
}
