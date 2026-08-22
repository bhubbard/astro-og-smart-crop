import './chrome-ai.d.ts';
import type { SocialPlatform } from './limits';

export interface SuggestionOptions {
  platform?: SocialPlatform;
  maxChars?: number;
  context?: string;
  temperature?: number;
  topK?: number;
}

export interface SuggestionVariant {
  type: 'punchy' | 'seo' | 'conversational' | 'smart-trim';
  label: string;
  text: string;
  charCount: number;
  maxBudget: number;
  fitsBudget: boolean;
  source: 'gemini-nano' | 'offline-heuristic';
}

export interface OptimizationResult {
  titles: SuggestionVariant[];
  descriptions: SuggestionVariant[];
  modelUsed: 'gemini-nano' | 'offline-heuristic';
  rawPrompt?: string;
}

/**
 * Checks if Chrome Built-in AI Gemini Nano (LanguageModel) is available.
 */
export async function isGeminiNanoAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const aiNamespace = window.ai || (typeof ai !== 'undefined' ? ai : undefined);
  if (!aiNamespace?.languageModel) return false;

  try {
    const caps = await aiNamespace.languageModel.capabilities();
    return caps.available === 'readily' || caps.available === 'after-download';
  } catch {
    return false;
  }
}

/**
 * Gets detailed status of Gemini Nano
 */
export async function getGeminiNanoStatus(): Promise<{
  available: boolean;
  status: 'ready' | 'downloading' | 'unavailable';
  details: string;
}> {
  if (typeof window === 'undefined') {
    return { available: false, status: 'unavailable', details: 'Running in non-browser environment' };
  }

  const aiNamespace = window.ai || (typeof ai !== 'undefined' ? ai : undefined);
  if (!aiNamespace?.languageModel) {
    return {
      available: false,
      status: 'unavailable',
      details: 'window.ai.languageModel is undefined. Enable chrome://flags/#prompt-api-for-gemini-nano',
    };
  }

  try {
    const caps = await aiNamespace.languageModel.capabilities();
    if (caps.available === 'readily') {
      return { available: true, status: 'ready', details: 'Gemini Nano is ready locally' };
    } else if (caps.available === 'after-download') {
      return { available: true, status: 'downloading', details: 'Gemini Nano model download in progress' };
    } else {
      return { available: false, status: 'unavailable', details: 'Model not available on this device' };
    }
  } catch (e: any) {
    return { available: false, status: 'unavailable', details: e?.message || 'Error probing Gemini Nano' };
  }
}

/**
 * Formats a structured prompt for Gemini Nano to rewrite headlines/excerpts within character limits.
 */
export function buildNanoPrompt(
  kind: 'title' | 'description',
  currentText: string,
  maxChars: number,
  platform?: SocialPlatform,
  context?: string
): string {
  const platformLabel = platform ? ` for ${platform.toUpperCase()}` : '';
  const contextNote = context ? `Context / Excerpt: "${context}"\n` : '';

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

/**
 * Generates headline/title variants adhering to character budgets.
 */
export async function generateTitleVariants(
  currentTitle: string,
  options: SuggestionOptions = {}
): Promise<SuggestionVariant[]> {
  const maxChars = options.maxChars || 70;
  const platform = options.platform || 'twitter';
  const cleanTitle = (currentTitle || '').trim();

  if (!cleanTitle) return [];

  const aiAvailable = await isGeminiNanoAvailable();

  if (aiAvailable) {
    try {
      const aiNamespace = window.ai || (typeof ai !== 'undefined' ? ai : undefined);
      const session = await aiNamespace!.languageModel!.create({
        temperature: options.temperature ?? 0.7,
        topK: options.topK ?? 40,
        systemPrompt: `You are an expert copywriter. Output only the requested formats without extra preamble. Adhere strictly to character budgets.`,
      });

      const prompt = buildNanoPrompt('title', cleanTitle, maxChars, platform, options.context);
      const response = await session.prompt(prompt);
      session.destroy();

      const parsed = parseNanoResponse(response, maxChars, 'gemini-nano');
      if (parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('[astro-og-smart-crop] Gemini Nano title prompt failed, falling back to heuristic:', err);
    }
  }

  // Fallback to offline heuristic
  return generateOfflineTitleVariants(cleanTitle, maxChars);
}

/**
 * Generates description/excerpt variants adhering to character budgets.
 */
export async function generateDescriptionVariants(
  currentDescription: string,
  options: SuggestionOptions = {}
): Promise<SuggestionVariant[]> {
  const maxChars = options.maxChars || 125;
  const platform = options.platform || 'twitter';
  const cleanDesc = (currentDescription || '').trim();

  if (!cleanDesc) return [];

  const aiAvailable = await isGeminiNanoAvailable();

  if (aiAvailable) {
    try {
      const aiNamespace = window.ai || (typeof ai !== 'undefined' ? ai : undefined);
      const session = await aiNamespace!.languageModel!.create({
        temperature: options.temperature ?? 0.7,
        topK: options.topK ?? 40,
        systemPrompt: `You are an expert social media editor. Output only the requested formats without extra preamble. Adhere strictly to character budgets.`,
      });

      const prompt = buildNanoPrompt('description', cleanDesc, maxChars, platform, options.context);
      const response = await session.prompt(prompt);
      session.destroy();

      const parsed = parseNanoResponse(response, maxChars, 'gemini-nano');
      if (parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('[astro-og-smart-crop] Gemini Nano description prompt failed, falling back to heuristic:', err);
    }
  }

  // Fallback to offline heuristic
  return generateOfflineDescriptionVariants(cleanDesc, maxChars);
}

/**
 * Optimizes both title and description in a single operation
 */
export async function generateCardOptimization(
  title: string,
  description: string,
  options: SuggestionOptions = {}
): Promise<OptimizationResult> {
  const titleMax = options.maxChars || 70;
  const descMax = options.platform === 'facebook' ? 80 : (options.platform === 'linkedin' ? 100 : 125);

  const [titles, descriptions] = await Promise.all([
    generateTitleVariants(title, { ...options, maxChars: titleMax }),
    generateDescriptionVariants(description, { ...options, maxChars: descMax }),
  ]);

  const modelUsed = titles.some(t => t.source === 'gemini-nano') ? 'gemini-nano' : 'offline-heuristic';

  return {
    titles,
    descriptions,
    modelUsed,
    rawPrompt: buildNanoPrompt('title', title, titleMax, options.platform),
  };
}

/**
 * Parses structured output from Gemini Nano response
 */
export function parseNanoResponse(
  rawText: string,
  maxBudget: number,
  source: 'gemini-nano' | 'offline-heuristic' = 'gemini-nano'
): SuggestionVariant[] {
  const variants: SuggestionVariant[] = [];
  if (!rawText) return variants;

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const punchyMatch = line.match(/^PUNCHY:\s*(.+)$/i);
    const seoMatch = line.match(/^SEO:\s*(.+)$/i);
    const convMatch = line.match(/^CONVERSATIONAL:\s*(.+)$/i);

    if (punchyMatch) {
      const text = cleanVariantText(punchyMatch[1], maxBudget);
      variants.push({
        type: 'punchy',
        label: 'Punchy Hook',
        text,
        charCount: text.length,
        maxBudget,
        fitsBudget: text.length <= maxBudget,
        source,
      });
    } else if (seoMatch) {
      const text = cleanVariantText(seoMatch[1], maxBudget);
      variants.push({
        type: 'seo',
        label: 'SEO / Descriptive',
        text,
        charCount: text.length,
        maxBudget,
        fitsBudget: text.length <= maxBudget,
        source,
      });
    } else if (convMatch) {
      const text = cleanVariantText(convMatch[1], maxBudget);
      variants.push({
        type: 'conversational',
        label: 'Conversational',
        text,
        charCount: text.length,
        maxBudget,
        fitsBudget: text.length <= maxBudget,
        source,
      });
    }
  }

  return variants;
}

function cleanVariantText(text: string, maxBudget: number): string {
  let cleaned = text.replace(/^["']|["']$/g, '').trim();
  if (cleaned.length > maxBudget) {
    cleaned = smartTrim(cleaned, maxBudget);
  }
  return cleaned;
}

/**
 * Offline heuristic title variant generator
 */
export function generateOfflineTitleVariants(title: string, maxChars: number): SuggestionVariant[] {
  const clean = title.trim();
  const variants: SuggestionVariant[] = [];
  const seenTexts = new Set<string>();

  const addVariant = (type: SuggestionVariant['type'], label: string, raw: string) => {
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
        source: 'offline-heuristic',
      });
    }
  };

  // Variant 1: Direct budget trim
  addVariant('smart-trim', 'Direct Budget Trim', clean);

  // Variant 2: Strip brand / site suffix
  const withoutSuffix = clean.replace(/\s*([|•\-–—:]\s*[^|•\-–—:]+)$/i, '').trim();
  if (withoutSuffix) {
    addVariant('punchy', 'Headline (No Suffix)', withoutSuffix);
  }

  // Variant 3: Strip leading filler words (e.g. "The complete guide to", "How to")
  const strippedPrefix = clean
    .replace(/^(the\s+)?(complete\s+|ultimate\s+|beginner's\s+)?(guide to|introduction to|tutorial on)\s+/i, '')
    .replace(/^how to\s+/i, 'Guide: ');
  if (strippedPrefix) {
    addVariant('seo', 'Action-Oriented Headline', strippedPrefix);
  }

  // Variant 4: First clause before punctuation
  const firstClause = clean.split(/[:\-–—|]/)[0] || '';
  if (firstClause) {
    addVariant('conversational', 'Core Concept Lead', firstClause);
  }

  return variants;
}

/**
 * Offline heuristic description variant generator
 */
export function generateOfflineDescriptionVariants(description: string, maxChars: number): SuggestionVariant[] {
  const clean = description.trim();
  const variants: SuggestionVariant[] = [];
  const seenTexts = new Set<string>();

  const addVariant = (type: SuggestionVariant['type'], label: string, raw: string) => {
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
        source: 'offline-heuristic',
      });
    }
  };

  // Variant 1: Direct smart sentence or word trim
  addVariant('smart-trim', 'Smart Sentence Trim', clean);

  // Variant 2: First sentence only if it fits
  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0] || '';
  if (firstSentence) {
    addVariant('punchy', 'First Sentence Lead', firstSentence);
  }

  // Variant 3: Clause boundary cut
  const clauseCut = clean.split(/[,;:]\s+/)[0] || '';
  if (clauseCut) {
    const withDot = clauseCut.endsWith('.') ? clauseCut : clauseCut + '.';
    addVariant('conversational', 'Key Clause Highlight', withDot);
  }

  return variants;
}

/**
 * Trims a string at word boundary to fit within maxChars, appending an ellipsis if truncated.
 */
export function smartTrim(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cutoff = maxChars - 1; // Room for ellipsis
  const sub = text.slice(0, cutoff);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > cutoff * 0.6) {
    return sub.slice(0, lastSpace).trimEnd() + '…';
  }
  return sub.trimEnd() + '…';
}
