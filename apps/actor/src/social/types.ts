export type DetectedSource =
  | { platform: 'website'; contentType: 'webpage'; url: string }
  | { platform: 'instagram'; contentType: 'social-post'; url: string }
  | { platform: 'instagram'; contentType: 'social-reel'; url: string }
  | { platform: 'instagram'; contentType: 'social-profile'; url: string }
  | { platform: 'unsupported'; contentType: 'unknown'; url: string };

export type SocialExtractionStatus = 'complete' | 'partial' | 'blocked' | 'unavailable';

export interface SocialContent {
  platform: 'instagram';
  contentType: 'social-post' | 'social-reel' | 'social-profile';
  sourceUrl: string;
  accountName?: string;
  accountHandle?: string;
  accountUrl?: string;
  caption?: string;
  visibleText?: string;
  publishedAt?: string;
  hashtags: string[];
  externalLinks: string[];
  thumbnailUrl?: string;
  extractedAt: string;
  extractionStatus: SocialExtractionStatus;
  extractionWarnings: string[];
}

export interface SocialExtractionOptions {
  discoverFromProfiles: boolean;
  maxPostsPerProfile: number;
  fetchPage?: PageFetch;
  extractedAt?: string;
}

export type PageFetchResult =
  | { ok: true; status: number; html: string; finalUrl: string }
  | { ok: false; status?: number; error: string };

export type PageFetch = (url: string) => Promise<PageFetchResult>;

export interface SocialSourceAdapter {
  platform: 'instagram';
  supports(source: DetectedSource): boolean;
  extract(source: DetectedSource, options: SocialExtractionOptions): Promise<SocialContent[]>;
}
