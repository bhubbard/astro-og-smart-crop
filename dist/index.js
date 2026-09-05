// src/limits.ts
var PLATFORM_SPECS = {
  "twitter:summary_large_image": {
    name: "X / Twitter (Large Image)",
    platform: "twitter",
    cardType: "summary_large_image",
    title: {
      recommendedMaxChars: 70,
      hardLimitChars: 100,
      estimatedMaxPixels: 520,
      maxLines: 2
    },
    description: {
      recommendedMaxChars: 125,
      hardLimitChars: 200,
      estimatedMaxPixels: 900,
      maxLines: 2
    },
    image: {
      targetAspectRatio: 1.91,
      aspectRatioLabel: "1.91:1 (1200×630)",
      recommendedWidth: 1200,
      recommendedHeight: 630,
      minWidth: 300,
      minHeight: 157,
      tolerance: 0.15
    }
  },
  "twitter:summary": {
    name: "X / Twitter (Summary Square)",
    platform: "twitter",
    cardType: "summary",
    title: {
      recommendedMaxChars: 70,
      hardLimitChars: 100,
      estimatedMaxPixels: 450,
      maxLines: 2
    },
    description: {
      recommendedMaxChars: 140,
      hardLimitChars: 200,
      estimatedMaxPixels: 700,
      maxLines: 3
    },
    image: {
      targetAspectRatio: 1,
      aspectRatioLabel: "1:1 (400×400)",
      recommendedWidth: 400,
      recommendedHeight: 400,
      minWidth: 144,
      minHeight: 144,
      tolerance: 0.05
    }
  },
  linkedin: {
    name: "LinkedIn",
    platform: "linkedin",
    title: {
      recommendedMaxChars: 70,
      hardLimitChars: 119,
      estimatedMaxPixels: 550,
      maxLines: 2
    },
    description: {
      recommendedMaxChars: 100,
      hardLimitChars: 256,
      estimatedMaxPixels: 800,
      maxLines: 2
    },
    image: {
      targetAspectRatio: 1.91,
      aspectRatioLabel: "1.91:1 (1200×627)",
      recommendedWidth: 1200,
      recommendedHeight: 627,
      minWidth: 400,
      minHeight: 209,
      tolerance: 0.15
    }
  },
  facebook: {
    name: "Facebook",
    platform: "facebook",
    title: {
      recommendedMaxChars: 60,
      hardLimitChars: 88,
      estimatedMaxPixels: 480,
      maxLines: 2
    },
    description: {
      recommendedMaxChars: 80,
      hardLimitChars: 150,
      estimatedMaxPixels: 650,
      maxLines: 2
    },
    image: {
      targetAspectRatio: 1.91,
      aspectRatioLabel: "1.91:1 (1200×630)",
      recommendedWidth: 1200,
      recommendedHeight: 630,
      minWidth: 600,
      minHeight: 315,
      tolerance: 0.15
    }
  },
  discord: {
    name: "Discord Embed",
    platform: "discord",
    title: {
      recommendedMaxChars: 100,
      hardLimitChars: 256,
      estimatedMaxPixels: 750,
      maxLines: 3
    },
    description: {
      recommendedMaxChars: 350,
      hardLimitChars: 2048,
      estimatedMaxPixels: 1800,
      maxLines: 6
    },
    image: {
      targetAspectRatio: 1.77,
      aspectRatioLabel: "16:9 / 1.91:1",
      recommendedWidth: 1200,
      recommendedHeight: 675,
      minWidth: 200,
      minHeight: 112,
      tolerance: 0.35
    }
  },
  slack: {
    name: "Slack Unfurl",
    platform: "slack",
    title: {
      recommendedMaxChars: 100,
      hardLimitChars: 150,
      estimatedMaxPixels: 600,
      maxLines: 2
    },
    description: {
      recommendedMaxChars: 150,
      hardLimitChars: 300,
      estimatedMaxPixels: 900,
      maxLines: 3
    },
    image: {
      targetAspectRatio: 1.91,
      aspectRatioLabel: "1.91:1 (1200×630)",
      recommendedWidth: 1200,
      recommendedHeight: 630,
      minWidth: 360,
      minHeight: 188,
      tolerance: 0.25
    }
  }
};
function estimateTextPixelWidth(text, fontSize = 16, fontWeight = "normal") {
  if (!text)
    return 0;
  const weightMultiplier = fontWeight === "bold" ? 1.12 : 1;
  let unitWidth = 0;
  for (let i = 0;i < text.length; i++) {
    const char = text[i];
    if (/[ijl|!:',.]/i.test(char)) {
      unitWidth += 0.3;
    } else if (/[mwWM@%#&]/i.test(char)) {
      unitWidth += 0.85;
    } else if (/[A-Z]/.test(char)) {
      unitWidth += 0.65;
    } else if (/[0-9]/.test(char)) {
      unitWidth += 0.55;
    } else if (/\s/.test(char)) {
      unitWidth += 0.28;
    } else {
      unitWidth += 0.52;
    }
  }
  return Math.round(unitWidth * fontSize * weightMultiplier);
}
function evaluateTextTruncation(text = "", recommendedMaxChars, hardLimitChars, fontSize = 16, fontWeight = "normal") {
  const cleanText = (text || "").trim();
  const length = cleanText.length;
  const estimatedPixelWidth = estimateTextPixelWidth(cleanText, fontSize, fontWeight);
  const isTruncated = length > hardLimitChars;
  const isWarning = length > recommendedMaxChars && !isTruncated;
  const overflow = length > hardLimitChars ? length - hardLimitChars : length > recommendedMaxChars ? length - recommendedMaxChars : 0;
  let truncatedPreview = cleanText;
  if (isTruncated) {
    truncatedPreview = cleanText.slice(0, hardLimitChars - 1).trimEnd() + "…";
  }
  return {
    text: cleanText,
    length,
    recommendedMaxChars,
    hardLimitChars,
    estimatedPixelWidth,
    isWarning,
    isTruncated,
    overflow,
    truncatedPreview
  };
}
function evaluateImageAspect(src, alt, width, height, spec) {
  if (!src) {
    return {
      src,
      alt,
      targetRatio: spec.targetAspectRatio,
      aspectRatioLabel: spec.aspectRatioLabel,
      isMissing: true,
      isValidRatio: false,
      isTooSmall: false,
      warning: "Missing OpenGraph / Twitter preview image."
    };
  }
  if (!width || !height) {
    return {
      src,
      alt,
      width,
      height,
      targetRatio: spec.targetAspectRatio,
      aspectRatioLabel: spec.aspectRatioLabel,
      isMissing: false,
      isValidRatio: true,
      isTooSmall: false
    };
  }
  const computedRatio = Math.round(width / height * 100) / 100;
  const ratioDelta = Math.abs(computedRatio - spec.targetAspectRatio);
  const isValidRatio = ratioDelta <= spec.tolerance;
  const isTooSmall = width < spec.minWidth || height < spec.minHeight;
  let warning;
  if (!isValidRatio) {
    warning = `Aspect ratio is ${computedRatio}:1, but ${spec.aspectRatioLabel} is recommended. Image may be cropped or letterboxed.`;
  } else if (isTooSmall) {
    warning = `Image dimensions (${width}×${height}px) are below minimum recommended (${spec.minWidth}×${spec.minHeight}px).`;
  }
  return {
    src,
    alt,
    width,
    height,
    computedRatio,
    targetRatio: spec.targetAspectRatio,
    aspectRatioLabel: spec.aspectRatioLabel,
    isMissing: false,
    isValidRatio,
    isTooSmall,
    warning
  };
}
function evaluateCard(title = "", description = "", imageSrc, imageAlt, imageWidth, imageHeight, specKey = "twitter:summary_large_image") {
  const spec = PLATFORM_SPECS[specKey] || PLATFORM_SPECS["twitter:summary_large_image"];
  const titleReport = evaluateTextTruncation(title, spec.title.recommendedMaxChars, spec.title.hardLimitChars, 17, "bold");
  const descReport = evaluateTextTruncation(description, spec.description.recommendedMaxChars, spec.description.hardLimitChars, 14, "normal");
  const imageReport = evaluateImageAspect(imageSrc, imageAlt, imageWidth, imageHeight, spec.image);
  const warnings = [];
  const recommendations = [];
  if (titleReport.isTruncated) {
    warnings.push(`Title truncated: ${titleReport.length} chars (hard limit: ${spec.title.hardLimitChars} chars). Excess ${titleReport.overflow} chars will be cut off.`);
    recommendations.push(`Shorten title to <= ${spec.title.recommendedMaxChars} chars for optimal visibility across devices.`);
  } else if (titleReport.isWarning) {
    warnings.push(`Title may truncate on mobile: ${titleReport.length} chars (recommended max: ${spec.title.recommendedMaxChars} chars).`);
    recommendations.push(`Keep title under ${spec.title.recommendedMaxChars} chars to avoid multi-line feed clipping.`);
  }
  if (descReport.isTruncated) {
    warnings.push(`Description truncated: ${descReport.length} chars (hard limit: ${spec.description.hardLimitChars} chars).`);
    recommendations.push(`Condense description to <= ${spec.description.recommendedMaxChars} chars.`);
  } else if (descReport.isWarning) {
    warnings.push(`Description length (${descReport.length} chars) exceeds feed recommendation (${spec.description.recommendedMaxChars} chars).`);
    recommendations.push(`Use Gemini Nano to produce an impactful excerpt under ${spec.description.recommendedMaxChars} chars.`);
  }
  if (imageReport.warning) {
    warnings.push(imageReport.warning);
  }
  let status = "ok";
  if (titleReport.isTruncated || descReport.isTruncated) {
    status = "truncated";
  } else if (titleReport.isWarning || descReport.isWarning || imageReport.warning) {
    status = "warning";
  }
  return {
    specKey,
    platform: spec.platform,
    platformName: spec.name,
    cardType: spec.cardType,
    title: titleReport,
    description: descReport,
    image: imageReport,
    status,
    warnings,
    recommendations
  };
}
function evaluateAllPlatforms(title = "", description = "", imageSrc, imageAlt, imageWidth, imageHeight, specsToEvaluate) {
  const keys = specsToEvaluate || Object.keys(PLATFORM_SPECS);
  const results = {};
  for (const key of keys) {
    if (PLATFORM_SPECS[key]) {
      results[key] = evaluateCard(title, description, imageSrc, imageAlt, imageWidth, imageHeight, key);
    }
  }
  return results;
}

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

// src/nano-suggester.ts
async function isGeminiNanoAvailable() {
  if (typeof window === "undefined")
    return false;
  const aiNamespace = window.ai || (typeof ai !== "undefined" ? ai : undefined);
  if (!aiNamespace?.languageModel)
    return false;
  try {
    const caps = await aiNamespace.languageModel.capabilities();
    return caps.available === "readily" || caps.available === "after-download";
  } catch {
    return false;
  }
}
async function getGeminiNanoStatus() {
  if (typeof window === "undefined") {
    return { available: false, status: "unavailable", details: "Running in non-browser environment" };
  }
  const aiNamespace = window.ai || (typeof ai !== "undefined" ? ai : undefined);
  if (!aiNamespace?.languageModel) {
    return {
      available: false,
      status: "unavailable",
      details: "window.ai.languageModel is undefined. Enable chrome://flags/#prompt-api-for-gemini-nano"
    };
  }
  try {
    const caps = await aiNamespace.languageModel.capabilities();
    if (caps.available === "readily") {
      return { available: true, status: "ready", details: "Gemini Nano is ready locally" };
    } else if (caps.available === "after-download") {
      return { available: true, status: "downloading", details: "Gemini Nano model download in progress" };
    } else {
      return { available: false, status: "unavailable", details: "Model not available on this device" };
    }
  } catch (e) {
    return { available: false, status: "unavailable", details: e?.message || "Error probing Gemini Nano" };
  }
}
function buildNanoPrompt(kind, currentText, maxChars, platform, context) {
  const platformLabel = platform ? ` for ${platform.toUpperCase()}` : "";
  const contextNote = context ? `Context / Excerpt: "${context}"
` : "";
  return `You are a social media copy optimization expert.
Task: Rewrite the following ${kind}${platformLabel} into 3 distinct high-impact variations that strictly do NOT exceed ${maxChars} characters each (including spaces and punctuation).

Current ${kind}: "${currentText}"
${contextNote}
Constraints:
1. Every variant MUST be under ${maxChars} characters. Count characters carefully!
2. Do not use quotation marks around the output.
3. Output EXACTLY in this format:
PUNCHY: [Concise, high-CTR hook]
SEO: [Clear, keyword-rich, informative version]
CONVERSATIONAL: [Natural, engaging tone]`;
}
async function generateTitleVariants(currentTitle, options = {}) {
  const maxChars = options.maxChars || 70;
  const platform = options.platform || "twitter";
  const cleanTitle = (currentTitle || "").trim();
  if (!cleanTitle)
    return [];
  const aiAvailable = await isGeminiNanoAvailable();
  if (aiAvailable) {
    try {
      const aiNamespace = window.ai || (typeof ai !== "undefined" ? ai : undefined);
      const session = await aiNamespace.languageModel.create({
        temperature: options.temperature ?? 0.7,
        topK: options.topK ?? 40,
        systemPrompt: `You are an expert copywriter. Output only the requested formats without extra preamble. Adhere strictly to character budgets.`
      });
      const prompt = buildNanoPrompt("title", cleanTitle, maxChars, platform, options.context);
      const response = await session.prompt(prompt);
      session.destroy();
      const parsed = parseNanoResponse(response, maxChars, "gemini-nano");
      if (parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn("[astro-og-smart-crop] Gemini Nano title prompt failed, falling back to heuristic:", err);
    }
  }
  return generateOfflineTitleVariants(cleanTitle, maxChars);
}
async function generateDescriptionVariants(currentDescription, options = {}) {
  const maxChars = options.maxChars || 125;
  const platform = options.platform || "twitter";
  const cleanDesc = (currentDescription || "").trim();
  if (!cleanDesc)
    return [];
  const aiAvailable = await isGeminiNanoAvailable();
  if (aiAvailable) {
    try {
      const aiNamespace = window.ai || (typeof ai !== "undefined" ? ai : undefined);
      const session = await aiNamespace.languageModel.create({
        temperature: options.temperature ?? 0.7,
        topK: options.topK ?? 40,
        systemPrompt: `You are an expert social media editor. Output only the requested formats without extra preamble. Adhere strictly to character budgets.`
      });
      const prompt = buildNanoPrompt("description", cleanDesc, maxChars, platform, options.context);
      const response = await session.prompt(prompt);
      session.destroy();
      const parsed = parseNanoResponse(response, maxChars, "gemini-nano");
      if (parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn("[astro-og-smart-crop] Gemini Nano description prompt failed, falling back to heuristic:", err);
    }
  }
  return generateOfflineDescriptionVariants(cleanDesc, maxChars);
}
async function generateCardOptimization(title, description, options = {}) {
  const titleMax = options.maxChars || 70;
  const descMax = options.platform === "facebook" ? 80 : options.platform === "linkedin" ? 100 : 125;
  const [titles, descriptions] = await Promise.all([
    generateTitleVariants(title, { ...options, maxChars: titleMax }),
    generateDescriptionVariants(description, { ...options, maxChars: descMax })
  ]);
  const modelUsed = titles.some((t) => t.source === "gemini-nano") ? "gemini-nano" : "offline-heuristic";
  return {
    titles,
    descriptions,
    modelUsed,
    rawPrompt: buildNanoPrompt("title", title, titleMax, options.platform)
  };
}
function parseNanoResponse(rawText, maxBudget, source = "gemini-nano") {
  const variants = [];
  if (!rawText)
    return variants;
  const lines = rawText.split(`
`).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const punchyMatch = line.match(/^PUNCHY:\s*(.+)$/i);
    const seoMatch = line.match(/^SEO:\s*(.+)$/i);
    const convMatch = line.match(/^CONVERSATIONAL:\s*(.+)$/i);
    if (punchyMatch) {
      const text = cleanVariantText(punchyMatch[1], maxBudget);
      variants.push({
        type: "punchy",
        label: "Punchy Hook",
        text,
        charCount: text.length,
        maxBudget,
        fitsBudget: text.length <= maxBudget,
        source
      });
    } else if (seoMatch) {
      const text = cleanVariantText(seoMatch[1], maxBudget);
      variants.push({
        type: "seo",
        label: "SEO / Descriptive",
        text,
        charCount: text.length,
        maxBudget,
        fitsBudget: text.length <= maxBudget,
        source
      });
    } else if (convMatch) {
      const text = cleanVariantText(convMatch[1], maxBudget);
      variants.push({
        type: "conversational",
        label: "Conversational",
        text,
        charCount: text.length,
        maxBudget,
        fitsBudget: text.length <= maxBudget,
        source
      });
    }
  }
  return variants;
}
function cleanVariantText(text, maxBudget) {
  let cleaned = text.replace(/^["']|["']$/g, "").trim();
  if (cleaned.length > maxBudget) {
    cleaned = smartTrim(cleaned, maxBudget);
  }
  return cleaned;
}
function generateOfflineTitleVariants(title, maxChars) {
  const clean = title.trim();
  const variants = [];
  const seenTexts = new Set;
  const addVariant = (type, label, raw) => {
    const text = smartTrim(raw.trim(), maxChars);
    if (text && !seenTexts.has(text)) {
      seenTexts.add(text);
      variants.push({
        type,
        label,
        text,
        charCount: text.length,
        maxBudget: maxChars,
        fitsBudget: text.length <= maxChars,
        source: "offline-heuristic"
      });
    }
  };
  addVariant("smart-trim", "Direct Budget Trim", clean);
  const withoutSuffix = clean.replace(/\s*([|•\-–—:]\s*[^|•\-–—:]+)$/i, "").trim();
  if (withoutSuffix) {
    addVariant("punchy", "Headline (No Suffix)", withoutSuffix);
  }
  const strippedPrefix = clean.replace(/^(the\s+)?(complete\s+|ultimate\s+|beginner's\s+)?(guide to|introduction to|tutorial on)\s+/i, "").replace(/^how to\s+/i, "Guide: ");
  if (strippedPrefix) {
    addVariant("seo", "Action-Oriented Headline", strippedPrefix);
  }
  const firstClause = clean.split(/[:\-–—|]/)[0] || "";
  if (firstClause) {
    addVariant("conversational", "Core Concept Lead", firstClause);
  }
  return variants;
}
function generateOfflineDescriptionVariants(description, maxChars) {
  const clean = description.trim();
  const variants = [];
  const seenTexts = new Set;
  const addVariant = (type, label, raw) => {
    const text = smartTrim(raw.trim(), maxChars);
    if (text && !seenTexts.has(text)) {
      seenTexts.add(text);
      variants.push({
        type,
        label,
        text,
        charCount: text.length,
        maxBudget: maxChars,
        fitsBudget: text.length <= maxChars,
        source: "offline-heuristic"
      });
    }
  };
  addVariant("smart-trim", "Smart Sentence Trim", clean);
  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0] || "";
  if (firstSentence) {
    addVariant("punchy", "First Sentence Lead", firstSentence);
  }
  const clauseCut = clean.split(/[,;:]\s+/)[0] || "";
  if (clauseCut) {
    const withDot = clauseCut.endsWith(".") ? clauseCut : clauseCut + ".";
    addVariant("conversational", "Key Clause Highlight", withDot);
  }
  return variants;
}
function smartTrim(text, maxChars) {
  if (text.length <= maxChars)
    return text;
  const cutoff = maxChars - 1;
  const sub = text.slice(0, cutoff);
  const lastSpace = sub.lastIndexOf(" ");
  if (lastSpace > cutoff * 0.6) {
    return sub.slice(0, lastSpace).trimEnd() + "…";
  }
  return sub.trimEnd() + "…";
}

// src/index.ts
function ogSmartCrop(options = {}) {
  return {
    name: "astro-og-smart-crop",
    hooks: {
      "astro:config:setup": ({ command, injectScript }) => {
        const isDev = command === "dev";
        const isExplicitlyEnabled = options.enabled === true;
        const isExplicitlyDisabled = options.enabled === false;
        if (isExplicitlyDisabled)
          return;
        if (isDev || isExplicitlyEnabled) {
          injectScript("page", `import 'astro-og-smart-crop/overlay';`);
        }
      }
    }
  };
}
var src_default = ogSmartCrop;
export {
  PLATFORM_SPECS,
  buildNanoPrompt,
  src_default as default,
  estimateTextPixelWidth,
  evaluateAllPlatforms,
  evaluateCard,
  evaluateImageAspect,
  evaluateTextTruncation,
  extractMetaTagsFromDOM,
  generateCardOptimization,
  generateDescriptionVariants,
  generateOfflineDescriptionVariants,
  generateOfflineTitleVariants,
  generateTitleVariants,
  getGeminiNanoStatus,
  isGeminiNanoAvailable,
  ogSmartCrop,
  parseMetaTagsFromHTML,
  parseNanoResponse,
  resolveSocialMetadata,
  smartTrim
};
