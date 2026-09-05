// src/middleware.ts
function parseMetaTagsFromHTML(html) {
  const result = {};
  if (!html)
    return result;
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    result.documentTitle = decodeHtmlEntities(titleMatch[1].trim());
  }
  const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) || html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  if (canonicalMatch && canonicalMatch[1]) {
    result.canonicalUrl = canonicalMatch[1].trim();
  }
  const metaTagRegex = /<meta\s+([^>]+)>/gi;
  let match;
  while ((match = metaTagRegex.exec(html)) !== null) {
    const attributesStr = match[1];
    const propertyMatch = attributesStr.match(/(?:property|name)=["']([^"']+)["']/i);
    const contentMatch = attributesStr.match(/content=["']([\s\S]*?)["']/i);
    if (!propertyMatch || !contentMatch)
      continue;
    const propName = propertyMatch[1].toLowerCase().trim();
    const content = decodeHtmlEntities(contentMatch[1].trim());
    switch (propName) {
      case "description":
        result.metaDescription = content;
        break;
      case "og:title":
        result.ogTitle = content;
        break;
      case "og:description":
        result.ogDescription = content;
        break;
      case "og:image":
      case "og:image:url":
        result.ogImage = content;
        break;
      case "og:image:alt":
        result.ogImageAlt = content;
        break;
      case "og:image:width":
        result.ogImageWidth = parseInt(content, 10) || undefined;
        break;
      case "og:image:height":
        result.ogImageHeight = parseInt(content, 10) || undefined;
        break;
      case "og:url":
        result.ogUrl = content;
        break;
      case "og:type":
        result.ogType = content;
        break;
      case "og:site_name":
        result.ogSiteName = content;
        break;
      case "twitter:card":
        result.twitterCard = content;
        break;
      case "twitter:title":
        result.twitterTitle = content;
        break;
      case "twitter:description":
        result.twitterDescription = content;
        break;
      case "twitter:image":
      case "twitter:image:src":
        result.twitterImage = content;
        break;
      case "twitter:image:alt":
        result.twitterImageAlt = content;
        break;
      case "twitter:site":
        result.twitterSite = content;
        break;
      case "twitter:creator":
        result.twitterCreator = content;
        break;
    }
  }
  return result;
}
function extractMetaTagsFromDOM(doc = document) {
  const result = {};
  if (!doc)
    return result;
  const titleEl = doc.querySelector("title");
  if (titleEl) {
    result.documentTitle = (titleEl.textContent || "").trim();
  }
  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  if (canonicalEl) {
    result.canonicalUrl = canonicalEl.getAttribute("href") || undefined;
  }
  const metaElements = doc.querySelectorAll("meta");
  metaElements.forEach((meta) => {
    const key = (meta.getAttribute("property") || meta.getAttribute("name") || "").toLowerCase().trim();
    const content = (meta.getAttribute("content") || "").trim();
    if (!key || !content)
      return;
    switch (key) {
      case "description":
        result.metaDescription = content;
        break;
      case "og:title":
        result.ogTitle = content;
        break;
      case "og:description":
        result.ogDescription = content;
        break;
      case "og:image":
      case "og:image:url":
        result.ogImage = content;
        break;
      case "og:image:alt":
        result.ogImageAlt = content;
        break;
      case "og:image:width":
        result.ogImageWidth = parseInt(content, 10) || undefined;
        break;
      case "og:image:height":
        result.ogImageHeight = parseInt(content, 10) || undefined;
        break;
      case "og:url":
        result.ogUrl = content;
        break;
      case "og:type":
        result.ogType = content;
        break;
      case "og:site_name":
        result.ogSiteName = content;
        break;
      case "twitter:card":
        result.twitterCard = content;
        break;
      case "twitter:title":
        result.twitterTitle = content;
        break;
      case "twitter:description":
        result.twitterDescription = content;
        break;
      case "twitter:image":
      case "twitter:image:src":
        result.twitterImage = content;
        break;
      case "twitter:image:alt":
        result.twitterImageAlt = content;
        break;
      case "twitter:site":
        result.twitterSite = content;
        break;
      case "twitter:creator":
        result.twitterCreator = content;
        break;
    }
  });
  return result;
}
function resolveSocialMetadata(tags, platform, cardTypeOverride) {
  const isTwitter = platform === "twitter";
  const cardType = cardTypeOverride || (isTwitter ? tags.twitterCard || "summary_large_image" : "summary_large_image");
  const title = isTwitter ? tags.twitterTitle || tags.ogTitle || tags.documentTitle || "" : tags.ogTitle || tags.documentTitle || tags.twitterTitle || "";
  const description = isTwitter ? tags.twitterDescription || tags.ogDescription || tags.metaDescription || "" : tags.ogDescription || tags.metaDescription || tags.twitterDescription || "";
  const image = isTwitter ? tags.twitterImage || tags.ogImage : tags.ogImage || tags.twitterImage;
  const imageAlt = isTwitter ? tags.twitterImageAlt || tags.ogImageAlt : tags.ogImageAlt || tags.twitterImageAlt;
  const url = tags.ogUrl || tags.canonicalUrl || (typeof window !== "undefined" ? window.location.href : "");
  const siteName = tags.ogSiteName || tags.twitterSite || "";
  return {
    title,
    description,
    image,
    imageAlt,
    imageWidth: tags.ogImageWidth,
    imageHeight: tags.ogImageHeight,
    url,
    siteName,
    cardType
  };
}
function decodeHtmlEntities(str) {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/");
}
export {
  extractMetaTagsFromDOM,
  parseMetaTagsFromHTML,
  resolveSocialMetadata
};
