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
export declare function parseMetaTagsFromHTML(html: string): SocialMetaTags;
/**
 * Extracts OpenGraph and Twitter card metadata from the browser DOM.
 */
export declare function extractMetaTagsFromDOM(doc?: Document): SocialMetaTags;
/**
 * Resolves metadata for a target social platform applying standard fallback cascade
 */
export declare function resolveSocialMetadata(tags: SocialMetaTags, platform: SocialPlatform, cardTypeOverride?: string): ResolvedSocialCard;
//# sourceMappingURL=middleware.d.ts.map