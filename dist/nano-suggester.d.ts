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
export declare function isGeminiNanoAvailable(): Promise<boolean>;
/**
 * Gets detailed status of Gemini Nano
 */
export declare function getGeminiNanoStatus(): Promise<{
    available: boolean;
    status: 'ready' | 'downloading' | 'unavailable';
    details: string;
}>;
/**
 * Formats a structured prompt for Gemini Nano to rewrite headlines/excerpts within character limits.
 */
export declare function buildNanoPrompt(kind: 'title' | 'description', currentText: string, maxChars: number, platform?: SocialPlatform, context?: string): string;
/**
 * Generates headline/title variants adhering to character budgets.
 */
export declare function generateTitleVariants(currentTitle: string, options?: SuggestionOptions): Promise<SuggestionVariant[]>;
/**
 * Generates description/excerpt variants adhering to character budgets.
 */
export declare function generateDescriptionVariants(currentDescription: string, options?: SuggestionOptions): Promise<SuggestionVariant[]>;
/**
 * Optimizes both title and description in a single operation
 */
export declare function generateCardOptimization(title: string, description: string, options?: SuggestionOptions): Promise<OptimizationResult>;
/**
 * Parses structured output from Gemini Nano response
 */
export declare function parseNanoResponse(rawText: string, maxBudget: number, source?: 'gemini-nano' | 'offline-heuristic'): SuggestionVariant[];
/**
 * Offline heuristic title variant generator
 */
export declare function generateOfflineTitleVariants(title: string, maxChars: number): SuggestionVariant[];
/**
 * Offline heuristic description variant generator
 */
export declare function generateOfflineDescriptionVariants(description: string, maxChars: number): SuggestionVariant[];
/**
 * Trims a string at word boundary to fit within maxChars, appending an ellipsis if truncated.
 */
export declare function smartTrim(text: string, maxChars: number): string;
//# sourceMappingURL=nano-suggester.d.ts.map