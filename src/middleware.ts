import type { SocialPlatform } from './limits';

export interface SocialMetaTags {
  documentTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterImageAlt?: string;
  twitterSite?: string;
  twitterCreator?: string;
}

export interface ResolvedSocialCard {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  url?: string;
  siteName?: string;
  cardType: string;
}

/**
 * Parses OpenGraph, Twitter, and standard SEO meta tags from raw HTML string.
 * Safe for server-side environments, tests, and workers without a full DOM.
 */
export function parseMetaTagsFromHTML(html: string): SocialMetaTags {
  const result: SocialMetaTags = {};

  if (!html) return result;

  // Extract <title>...</title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    result.documentTitle = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Extract canonical URL <link rel="canonical" href="...">
  const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                         html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (canonicalMatch && canonicalMatch[1]) {
    result.canonicalUrl = canonicalMatch[1].trim();
  }

  // Match all <meta ...> tags
  const metaTagRegex = /<meta\s+([^>]+)>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaTagRegex.exec(html)) !== null) {
    const attributesStr = match[1];
    
    // Extract property/name and content
    const propertyMatch = attributesStr.match(/(?:property|name)=["']([^"']+)["']/i);
    const contentMatch = attributesStr.match(/content=["']([\s\S]*?)["']/i);

    if (!propertyMatch || !contentMatch) continue;

    const propName = propertyMatch[1].toLowerCase().trim();
    const content = decodeHtmlEntities(contentMatch[1].trim());

    switch (propName) {
      case 'description':
        result.metaDescription = content;
        break;
      case 'og:title':
        result.ogTitle = content;
        break;
      case 'og:description':
        result.ogDescription = content;
        break;
      case 'og:image':
      case 'og:image:url':
        result.ogImage = content;
        break;
      case 'og:image:alt':
        result.ogImageAlt = content;
        break;
      case 'og:image:width':
        result.ogImageWidth = parseInt(content, 10) || undefined;
        break;
      case 'og:image:height':
        result.ogImageHeight = parseInt(content, 10) || undefined;
        break;
      case 'og:url':
        result.ogUrl = content;
        break;
      case 'og:type':
        result.ogType = content;
        break;
      case 'og:site_name':
        result.ogSiteName = content;
        break;
      case 'twitter:card':
        result.twitterCard = content;
        break;
      case 'twitter:title':
        result.twitterTitle = content;
        break;
      case 'twitter:description':
        result.twitterDescription = content;
        break;
      case 'twitter:image':
      case 'twitter:image:src':
        result.twitterImage = content;
        break;
      case 'twitter:image:alt':
        result.twitterImageAlt = content;
        break;
      case 'twitter:site':
        result.twitterSite = content;
        break;
      case 'twitter:creator':
        result.twitterCreator = content;
        break;
    }
  }

  return result;
}

/**
 * Extracts OpenGraph and Twitter card metadata from the browser DOM.
 */
export function extractMetaTagsFromDOM(doc: Document = document): SocialMetaTags {
  const result: SocialMetaTags = {};

  if (!doc) return result;

  // Title
  const titleEl = doc.querySelector('title');
  if (titleEl) {
    result.documentTitle = (titleEl.textContent || '').trim();
  }

  // Canonical
  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  if (canonicalEl) {
    result.canonicalUrl = canonicalEl.getAttribute('href') || undefined;
  }

  // Query all meta elements
  const metaElements = doc.querySelectorAll('meta');
  metaElements.forEach((meta) => {
    const key = (meta.getAttribute('property') || meta.getAttribute('name') || '').toLowerCase().trim();
    const content = (meta.getAttribute('content') || '').trim();

    if (!key || !content) return;

    switch (key) {
      case 'description':
        result.metaDescription = content;
        break;
      case 'og:title':
        result.ogTitle = content;
        break;
      case 'og:description':
        result.ogDescription = content;
        break;
      case 'og:image':
      case 'og:image:url':
        result.ogImage = content;
        break;
      case 'og:image:alt':
        result.ogImageAlt = content;
        break;
      case 'og:image:width':
        result.ogImageWidth = parseInt(content, 10) || undefined;
        break;
      case 'og:image:height':
        result.ogImageHeight = parseInt(content, 10) || undefined;
        break;
      case 'og:url':
        result.ogUrl = content;
        break;
      case 'og:type':
        result.ogType = content;
        break;
      case 'og:site_name':
        result.ogSiteName = content;
        break;
      case 'twitter:card':
        result.twitterCard = content;
        break;
      case 'twitter:title':
        result.twitterTitle = content;
        break;
      case 'twitter:description':
        result.twitterDescription = content;
        break;
      case 'twitter:image':
      case 'twitter:image:src':
        result.twitterImage = content;
        break;
      case 'twitter:image:alt':
        result.twitterImageAlt = content;
        break;
      case 'twitter:site':
        result.twitterSite = content;
        break;
      case 'twitter:creator':
        result.twitterCreator = content;
        break;
    }
  });

  return result;
}

/**
 * Resolves metadata for a target social platform applying standard fallback cascade
 */
export function resolveSocialMetadata(
  tags: SocialMetaTags,
  platform: SocialPlatform,
  cardTypeOverride?: string
): ResolvedSocialCard {
  const isTwitter = platform === 'twitter';

  const cardType =
    cardTypeOverride ||
    (isTwitter ? tags.twitterCard || 'summary_large_image' : 'summary_large_image');

  const title = isTwitter
    ? tags.twitterTitle || tags.ogTitle || tags.documentTitle || ''
    : tags.ogTitle || tags.documentTitle || tags.twitterTitle || '';

  const description = isTwitter
    ? tags.twitterDescription || tags.ogDescription || tags.metaDescription || ''
    : tags.ogDescription || tags.metaDescription || tags.twitterDescription || '';

  const image = isTwitter
    ? tags.twitterImage || tags.ogImage
    : tags.ogImage || tags.twitterImage;

  const imageAlt = isTwitter
    ? tags.twitterImageAlt || tags.ogImageAlt
    : tags.ogImageAlt || tags.twitterImageAlt;

  const url = tags.ogUrl || tags.canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const siteName = tags.ogSiteName || tags.twitterSite || '';

  return {
    title,
    description,
    image,
    imageAlt,
    imageWidth: tags.ogImageWidth,
    imageHeight: tags.ogImageHeight,
    url,
    siteName,
    cardType,
  };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}
