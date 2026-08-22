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
export {
  evaluateTextTruncation,
  evaluateImageAspect,
  evaluateCard,
  evaluateAllPlatforms,
  estimateTextPixelWidth,
  PLATFORM_SPECS
};
