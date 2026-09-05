import type { AstroIntegration } from 'astro';
import type { SocialPlatform } from './limits';
export * from './limits';
export * from './middleware';
export * from './nano-suggester';
export type { OverlayOptions, AstroOGSmartCropElement } from './overlay';
export interface OGSmartCropOptions {
    /**
     * Whether the dev overlay is enabled.
     * Defaults to true in development mode, false in production builds.
     */
    enabled?: boolean;
    /**
     * Platforms to evaluate and preview.
     * Defaults to all supported platforms.
     */
    platforms?: SocialPlatform[];
    /**
     * Default Twitter card layout to preview.
     * Defaults to 'summary_large_image'.
     */
    defaultCardType?: 'summary_large_image' | 'summary';
    /**
     * Screen position for the floating status badge.
     * Defaults to 'bottom-right'.
     */
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    /**
     * Custom Gemini Nano options
     */
    nanoOptions?: {
        temperature?: number;
        topK?: number;
        systemPrompt?: string;
    };
}
/**
 * Astro OpenGraph Smart Crop Integration
 *
 * Provides live social card previews, evaluates platform-specific character and pixel limits,
 * and prompts Gemini Nano (window.ai.languageModel) for zero-truncation copy variants.
 */
export declare function ogSmartCrop(options?: OGSmartCropOptions): AstroIntegration;
export default ogSmartCrop;
//# sourceMappingURL=index.d.ts.map