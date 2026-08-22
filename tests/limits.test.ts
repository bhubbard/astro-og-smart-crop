import { describe, it, expect } from 'bun:test';
import {
  PLATFORM_SPECS,
  estimateTextPixelWidth,
  evaluateTextTruncation,
  evaluateImageAspect,
  evaluateCard,
  evaluateAllPlatforms,
} from '../src/limits';

describe('limits.ts - Character & Pixel Limit Evaluators', () => {
  it('should define specifications for all major social platforms', () => {
    expect(PLATFORM_SPECS['twitter:summary_large_image']).toBeDefined();
    expect(PLATFORM_SPECS['twitter:summary']).toBeDefined();
    expect(PLATFORM_SPECS['linkedin']).toBeDefined();
    expect(PLATFORM_SPECS['facebook']).toBeDefined();
    expect(PLATFORM_SPECS['discord']).toBeDefined();
    expect(PLATFORM_SPECS['slack']).toBeDefined();
  });

  describe('estimateTextPixelWidth', () => {
    it('returns 0 for empty strings', () => {
      expect(estimateTextPixelWidth('')).toBe(0);
    });

    it('estimates wider pixels for uppercase and wider glyphs like M and W', () => {
      const slimText = 'iiiiiiiiii';
      const wideText = 'WWWWWWWWWW';
      const slimWidth = estimateTextPixelWidth(slimText, 16);
      const wideWidth = estimateTextPixelWidth(wideText, 16);

      expect(wideWidth).toBeGreaterThan(slimWidth);
    });

    it('accounts for bold font weight', () => {
      const text = 'Headline text example';
      const normalWidth = estimateTextPixelWidth(text, 16, 'normal');
      const boldWidth = estimateTextPixelWidth(text, 16, 'bold');

      expect(boldWidth).toBeGreaterThan(normalWidth);
    });
  });

  describe('evaluateTextTruncation', () => {
    it('evaluates text well within limits as OK', () => {
      const report = evaluateTextTruncation('Short Title', 70, 100);
      expect(report.length).toBe(11);
      expect(report.isWarning).toBe(false);
      expect(report.isTruncated).toBe(false);
      expect(report.overflow).toBe(0);
      expect(report.truncatedPreview).toBe('Short Title');
    });

    it('flags warning when text exceeds recommended max but not hard limit', () => {
      const mediumText = 'A'.repeat(80);
      const report = evaluateTextTruncation(mediumText, 70, 100);
      expect(report.isWarning).toBe(true);
      expect(report.isTruncated).toBe(false);
      expect(report.overflow).toBe(10);
      expect(report.truncatedPreview).toBe(mediumText);
    });

    it('flags truncated and computes preview when text exceeds hard limit', () => {
      const longText = 'A'.repeat(120);
      const report = evaluateTextTruncation(longText, 70, 100);
      expect(report.isTruncated).toBe(true);
      expect(report.isWarning).toBe(false);
      expect(report.overflow).toBe(20);
      expect(report.truncatedPreview.endsWith('…')).toBe(true);
      expect(report.truncatedPreview.length).toBe(100);
    });
  });

  describe('evaluateImageAspect', () => {
    const twitterLargeSpec = PLATFORM_SPECS['twitter:summary_large_image'].image;

    it('flags missing image when src is not provided', () => {
      const report = evaluateImageAspect(undefined, undefined, undefined, undefined, twitterLargeSpec);
      expect(report.isMissing).toBe(true);
      expect(report.isValidRatio).toBe(false);
      expect(report.warning).toBeDefined();
    });

    it('validates 1200x630 image (1.905 ratio) as valid for Twitter Large', () => {
      const report = evaluateImageAspect('https://example.com/og.jpg', 'Preview', 1200, 630, twitterLargeSpec);
      expect(report.isMissing).toBe(false);
      expect(report.isValidRatio).toBe(true);
      expect(report.isTooSmall).toBe(false);
      expect(report.warning).toBeUndefined();
    });

    it('flags ratio mismatch on square 400x400 image for Twitter Large', () => {
      const report = evaluateImageAspect('https://example.com/square.jpg', 'Preview', 400, 400, twitterLargeSpec);
      expect(report.isValidRatio).toBe(false);
      expect(report.warning).toContain('Aspect ratio is 1:1');
    });

    it('flags small image below minimum resolution', () => {
      const report = evaluateImageAspect('https://example.com/tiny.jpg', 'Preview', 200, 100, twitterLargeSpec);
      expect(report.isTooSmall).toBe(true);
      expect(report.warning).toContain('below minimum recommended');
    });
  });

  describe('evaluateCard & evaluateAllPlatforms', () => {
    it('evaluates full Twitter Large card with status ok', () => {
      const result = evaluateCard(
        'Building Fast Astro Sites',
        'Learn how Astro enables stellar performance with zero client-side JavaScript by default.',
        'https://example.com/og.jpg',
        'Preview image',
        1200,
        630,
        'twitter:summary_large_image'
      );

      expect(result.status).toBe('ok');
      expect(result.warnings.length).toBe(0);
      expect(result.platform).toBe('twitter');
      expect(result.cardType).toBe('summary_large_image');
    });

    it('evaluates Facebook card with title warning when title > 60 chars but <= 88 chars', () => {
      // 73 chars: exceeds 60 chars mobile limit, but under 88 chars hard limit
      const warningTitle = 'Astro 5 and Cloudflare Edge Architecture: A Complete Hands-On Walkthrough';
      const result = evaluateCard(
        warningTitle,
        'Short description.',
        'https://example.com/og.jpg',
        'Preview',
        1200,
        630,
        'facebook'
      );

      expect(result.status).toBe('warning');
      expect(result.title.isWarning).toBe(true);
      expect(result.title.isTruncated).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('evaluates card as truncated when title exceeds platform hard limit', () => {
      const hardClippedTitle = 'X'.repeat(110); // Facebook hard limit is 88
      const result = evaluateCard(
        hardClippedTitle,
        'Short description.',
        'https://example.com/og.jpg',
        'Preview',
        1200,
        630,
        'facebook'
      );

      expect(result.status).toBe('truncated');
      expect(result.title.isTruncated).toBe(true);
    });

    it('evaluates all platforms simultaneously', () => {
      const allResults = evaluateAllPlatforms(
        'Astro OG Smart Crop Integration',
        'Automatically validate social cards in development and prompt Gemini Nano for optimized titles.',
        'https://example.com/og.png',
        'OG',
        1200,
        630
      );

      expect(Object.keys(allResults).length).toBeGreaterThanOrEqual(6);
      expect(allResults['twitter:summary_large_image']).toBeDefined();
      expect(allResults['linkedin']).toBeDefined();
      expect(allResults['facebook']).toBeDefined();
      expect(allResults['discord']).toBeDefined();
      expect(allResults['slack']).toBeDefined();
    });
  });
});
