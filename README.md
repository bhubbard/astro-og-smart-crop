# astro-og-smart-crop

[![Astro](https://img.shields.io/badge/Astro-v5.0+-BC52EE.svg?style=flat&logo=astro)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Chrome AI](https://img.shields.io/badge/Chrome_AI-Gemini_Nano-4285F4.svg?style=flat&logo=googlechrome)](https://developer.chrome.com/docs/ai/built-in)
[![Bun](https://img.shields.io/badge/Bun-1.3+-black.svg?style=flat&logo=bun)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Astro integration & dev overlay that tests and adapts OpenGraph and Twitter card previews in development, evaluates platform-specific character and pixel limits to prevent truncation, and prompts Gemini Nano (`window.ai.languageModel`) to suggest high-impact headline and excerpt variants that strictly adhere to constraints.**

---

## ✨ Features

- 🎯 **Realistic Live Previews**: Render exact social card simulations for **X / Twitter (Large Image & Summary)**, **LinkedIn**, **Facebook**, **Discord Embeds**, and **Slack Unfurls**.
- 📏 **Multi-Platform Constraint Evaluator**: Analyzes character budgets, pixel width estimates, line count ceilings, and image aspect ratio tolerances (1.91:1 banner vs 1:1 square).
- 🧠 **On-Device Gemini Nano Rewriter**: Prompts `window.ai.languageModel` directly in the browser to draft Punchy Hooks, SEO Summaries, and Conversational copy tailored to character budgets.
- 🛡️ **Zero-Cloud Offline Fallbacks**: Gracefully switches to intelligent clause and boundary trimmers when on-device AI flags are not enabled.
- ⚡ **Zero-Config Dev Integration**: Automatically injected into Astro pages in development with zero footprint in production builds.
- 🎛️ **Live Simulation Mode**: Edit headlines and descriptions in real time inside the slide-out dev drawer to inspect line wrapping before deploying.

---

## 📊 Platform Character & Aspect Specifications

| Platform | Layout | Recommended Title | Hard Limit Title | Recommended Desc | Hard Limit Desc | Target Aspect Ratio |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **X / Twitter** | `summary_large_image` | **70 chars** | 100 chars | **125 chars** | 200 chars | 1.91:1 (1200×630px) |
| **X / Twitter** | `summary` | **70 chars** | 100 chars | **140 chars** | 200 chars | 1:1 (400×400px) |
| **LinkedIn** | Feed Banner | **70 chars** | 119 chars | **100 chars** | 256 chars | 1.91:1 (1200×627px) |
| **Facebook** | Mobile / Desktop Feed | **60 chars** | 88 chars | **80 chars** | 150 chars | 1.91:1 (1200×630px) |
| **Discord** | Rich Embed | **100 chars** | 256 chars | **350 chars** | 2048 chars | 16:9 or 1.91:1 banner |
| **Slack** | Attachment Unfurl | **100 chars** | 150 chars | **150 chars** | 300 chars | 1.91:1 or square thumb |

---

## 📦 Installation

```bash
# Using bun
bun add astro-og-smart-crop

# Using npm / pnpm / yarn
npm install astro-og-smart-crop
```

---

## 🚀 Astro Setup

Add `ogSmartCrop()` to your `astro.config.mjs`:

```ts
// astro.config.mjs
import { defineConfig } from 'astro/config';
import ogSmartCrop from 'astro-og-smart-crop';

export default defineConfig({
  integrations: [
    ogSmartCrop({
      position: 'bottom-right', // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
      defaultCardType: 'summary_large_image',
    }),
  ],
});
```

When running `astro dev`, a floating status badge will appear in the corner of your page showing live OpenGraph health metrics. Click the badge to slide out the preview and optimization drawer!

---

## 🧪 Chrome Built-in AI (Gemini Nano) Setup

To leverage client-side Gemini Nano prompts for instant headline and description optimization:

1. Use **Google Chrome (Canary / Dev / Stable v128+)**.
2. Navigate to `chrome://flags/#prompt-api-for-gemini-nano` and select **Enabled**.
3. Navigate to `chrome://flags/#optimization-guide-on-device-model` and select **Enabled BypassPerfRequirement**.
4. Restart Chrome.
5. Visit `chrome://components` and find **Optimization Guide On Device Model**. Ensure it is updated and fully downloaded.

*Note: When Gemini Nano is not available, `astro-og-smart-crop` seamlessly falls back to algorithmic smart-trimming and phrase extraction.*

---

## 🛠️ Programmatic API

You can also import and use the evaluator and parser utilities directly in your own scripts, CI audits, or endpoints:

### Evaluating Meta Tags Against Platform Limits

```ts
import { evaluateCard, evaluateAllPlatforms } from 'astro-og-smart-crop/limits';

const report = evaluateCard(
  'Building Lightning Fast Astro Apps at the Edge',
  'Learn how island architecture and Cloudflare Workers deliver instant page transitions with zero client-side JavaScript.',
  'https://example.com/banner.png',
  'Banner Preview',
  1200,
  630,
  'twitter:summary_large_image'
);

console.log(report.status); // 'ok' | 'warning' | 'truncated'
console.log(report.title.isTruncated); // false
console.log(report.title.estimatedPixelWidth); // estimated render width in px
```

### Parsing Meta Tags from Raw HTML

```ts
import { parseMetaTagsFromHTML, resolveSocialMetadata } from 'astro-og-smart-crop/middleware';

const html = await response.text();
const tags = parseMetaTagsFromHTML(html);
const twitterCard = resolveSocialMetadata(tags, 'twitter');

console.log(twitterCard.title, twitterCard.image);
```

### Generating Copy Variants with Gemini Nano

```ts
import { generateTitleVariants, generateCardOptimization } from 'astro-og-smart-crop/nano-suggester';

const suggestions = await generateTitleVariants(
  'The Comprehensive Guide to Modern High Performance Web Applications Using Astro and Gemini Nano',
  {
    platform: 'twitter',
    maxChars: 70,
  }
);

// Returns structured Punchy, SEO, and Conversational alternatives:
// [
//   { type: 'punchy', label: 'Punchy Hook', text: 'Fast Web Apps with Astro & Gemini Nano', charCount: 38, fitsBudget: true },
//   ...
// ]
```

---

## 🧪 Testing

Run test suites using Bun:

```bash
bun test
bun run typecheck
bun run build
```

---

## 📄 License

MIT © [Brandon Hubbard](https://github.com/bhubbard)
