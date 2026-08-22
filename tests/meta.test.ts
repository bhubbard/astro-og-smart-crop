import { describe, it, expect } from 'bun:test';
import { parseMetaTagsFromHTML, resolveSocialMetadata } from '../src/middleware';
import {
  buildNanoPrompt,
  parseNanoResponse,
  generateOfflineTitleVariants,
  generateOfflineDescriptionVariants,
  smartTrim,
} from '../src/nano-suggester';

describe('middleware.ts - Meta Extraction & Resolution', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Default Document Title &amp; Brand</title>
        <meta name="description" content="Default meta description fallback text." />
        <link rel="canonical" href="https://example.com/blog/astro-ai" />
        
        <!-- OpenGraph -->
        <meta property="og:title" content="OpenGraph Headline Title" />
        <meta property="og:description" content="Detailed OpenGraph description of the article." />
        <meta property="og:image" content="https://example.com/images/og-banner.jpg" />
        <meta property="og:image:alt" content="Astro banner graphic" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://example.com/blog/astro-ai" />
        <meta property="og:site_name" content="My Astro Blog" />

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Custom Twitter Headline" />
        <meta name="twitter:description" content="Custom Twitter teaser text." />
        <meta name="twitter:image" content="https://example.com/images/twitter-custom.jpg" />
        <meta name="twitter:site" content="@astrodotbuild" />
      </head>
      <body>
        <h1>Hello world</h1>
      </body>
    </html>
  `;

  it('parses all meta tags, title, and link canonical from HTML string', () => {
    const tags = parseMetaTagsFromHTML(sampleHtml);

    expect(tags.documentTitle).toBe('Default Document Title & Brand');
    expect(tags.metaDescription).toBe('Default meta description fallback text.');
    expect(tags.canonicalUrl).toBe('https://example.com/blog/astro-ai');

    expect(tags.ogTitle).toBe('OpenGraph Headline Title');
    expect(tags.ogDescription).toBe('Detailed OpenGraph description of the article.');
    expect(tags.ogImage).toBe('https://example.com/images/og-banner.jpg');
    expect(tags.ogImageAlt).toBe('Astro banner graphic');
    expect(tags.ogImageWidth).toBe(1200);
    expect(tags.ogImageHeight).toBe(630);
    expect(tags.ogSiteName).toBe('My Astro Blog');

    expect(tags.twitterCard).toBe('summary_large_image');
    expect(tags.twitterTitle).toBe('Custom Twitter Headline');
    expect(tags.twitterDescription).toBe('Custom Twitter teaser text.');
    expect(tags.twitterImage).toBe('https://example.com/images/twitter-custom.jpg');
    expect(tags.twitterSite).toBe('@astrodotbuild');
  });

  it('resolves metadata for Twitter with twitter:* priority', () => {
    const tags = parseMetaTagsFromHTML(sampleHtml);
    const resolved = resolveSocialMetadata(tags, 'twitter');

    expect(resolved.title).toBe('Custom Twitter Headline');
    expect(resolved.description).toBe('Custom Twitter teaser text.');
    expect(resolved.image).toBe('https://example.com/images/twitter-custom.jpg');
    expect(resolved.cardType).toBe('summary_large_image');
  });

  it('resolves metadata for LinkedIn/Facebook with og:* priority and fallbacks', () => {
    const tags = parseMetaTagsFromHTML(sampleHtml);
    const resolved = resolveSocialMetadata(tags, 'linkedin');

    expect(resolved.title).toBe('OpenGraph Headline Title');
    expect(resolved.description).toBe('Detailed OpenGraph description of the article.');
    expect(resolved.image).toBe('https://example.com/images/og-banner.jpg');
  });

  it('falls back to documentTitle and metaDescription when OG tags are missing', () => {
    const minimalHtml = `
      <html>
        <head>
          <title>Minimal Page</title>
          <meta name="description" content="Minimal page description" />
        </head>
      </html>
    `;
    const tags = parseMetaTagsFromHTML(minimalHtml);
    const resolved = resolveSocialMetadata(tags, 'facebook');

    expect(resolved.title).toBe('Minimal Page');
    expect(resolved.description).toBe('Minimal page description');
    expect(resolved.image).toBeUndefined();
  });
});

describe('nano-suggester.ts - Prompting & Offline Fallbacks', () => {
  it('constructs structured Gemini Nano prompts with platform and max character budgets', () => {
    const prompt = buildNanoPrompt(
      'title',
      'This is an excessively long title about building web applications with modern frameworks and edge infrastructure',
      70,
      'twitter',
      'Article discussing edge computing with Astro.'
    );

    expect(prompt).toContain('Rewrite the following title for TWITTER');
    expect(prompt).toContain('70 characters');
    expect(prompt).toContain('PUNCHY:');
    expect(prompt).toContain('SEO:');
    expect(prompt).toContain('CONVERSATIONAL:');
    expect(prompt).toContain('Context / Excerpt: "Article discussing edge computing with Astro."');
  });

  it('parses formatted Gemini Nano responses into structured variant objects', () => {
    const nanoOutput = `
      PUNCHY: Fast Astro Sites on the Edge
      SEO: Building High-Speed Astro Web Apps
      CONVERSATIONAL: Why Astro at the Edge is Lightning Fast
    `;

    const variants = parseNanoResponse(nanoOutput, 70);

    expect(variants.length).toBe(3);
    expect(variants[0].type).toBe('punchy');
    expect(variants[0].text).toBe('Fast Astro Sites on the Edge');
    expect(variants[0].fitsBudget).toBe(true);

    expect(variants[1].type).toBe('seo');
    expect(variants[1].text).toBe('Building High-Speed Astro Web Apps');

    expect(variants[2].type).toBe('conversational');
    expect(variants[2].text).toBe('Why Astro at the Edge is Lightning Fast');
  });

  describe('smartTrim', () => {
    it('returns text as-is if within limit', () => {
      expect(smartTrim('Short text', 20)).toBe('Short text');
    });

    it('trims at word boundary and appends ellipsis if exceeding limit', () => {
      const trimmed = smartTrim('The quick brown fox jumps over the lazy dog', 25);
      expect(trimmed.length).toBeLessThanOrEqual(25);
      expect(trimmed.endsWith('…')).toBe(true);
      expect(trimmed).toBe('The quick brown fox…');
    });
  });

  describe('generateOfflineTitleVariants', () => {
    it('generates multiple budget-compliant title variants offline', () => {
      const longTitle = 'The Complete Guide to Building Ultra-Fast Web Apps with Astro 5 and Cloudflare | Tech Blog';
      const variants = generateOfflineTitleVariants(longTitle, 60);

      expect(variants.length).toBeGreaterThanOrEqual(2);
      for (const variant of variants) {
        expect(variant.text.length).toBeLessThanOrEqual(60);
        expect(variant.fitsBudget).toBe(true);
        expect(variant.source).toBe('offline-heuristic');
      }
    });
  });

  describe('generateOfflineDescriptionVariants', () => {
    it('generates sentence and clause trimmed description variants offline', () => {
      const longDesc = 'Learn how to optimize your web application for peak performance. We cover edge rendering, asset compression, and island architecture in this complete deep dive tutorial.';
      const variants = generateOfflineDescriptionVariants(longDesc, 80);

      expect(variants.length).toBeGreaterThanOrEqual(2);
      for (const variant of variants) {
        expect(variant.text.length).toBeLessThanOrEqual(80);
        expect(variant.fitsBudget).toBe(true);
        expect(variant.source).toBe('offline-heuristic');
      }
    });
  });
});
