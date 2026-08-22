export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'discord' | 'slack';
export type TwitterCardType = 'summary_large_image' | 'summary' | 'app' | 'player';
export interface PlatformLimitSpec {
    name: string;
    platform: SocialPlatform;
    cardType?: string;
    title: {
        recommendedMaxChars: number;
        hardLimitChars: number;
        estimatedMaxPixels: number;
        maxLines: number;
    };
    description: {
        recommendedMaxChars: number;
        hardLimitChars: number;
        estimatedMaxPixels: number;
        maxLines: number;
    };
    image: {
        targetAspectRatio: number;
        aspectRatioLabel: string;
        recommendedWidth: number;
        recommendedHeight: number;
        minWidth: number;
        minHeight: number;
        tolerance: number;
    };
}
export declare const PLATFORM_SPECS: Record<string, PlatformLimitSpec>;
export interface TextTruncationReport {
    text: string;
    length: number;
    recommendedMaxChars: number;
    hardLimitChars: number;
    estimatedPixelWidth: number;
    isWarning: boolean;
    isTruncated: boolean;
    overflow: number;
    truncatedPreview: string;
}
export interface ImageAspectReport {
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
    computedRatio?: number;
    targetRatio: number;
    aspectRatioLabel: string;
    isMissing: boolean;
    isValidRatio: boolean;
    isTooSmall: boolean;
    warning?: string;
}
export interface CardEvaluationResult {
    specKey: string;
    platform: SocialPlatform;
    platformName: string;
    cardType?: string;
    title: TextTruncationReport;
    description: TextTruncationReport;
    image: ImageAspectReport;
    status: 'ok' | 'warning' | 'truncated';
    warnings: string[];
    recommendations: string[];
}
/**
 * Estimates rendered pixel width in sans-serif / platform standard fonts
 * Uses proportional character weighting based on glyph widths.
 */
export declare function estimateTextPixelWidth(text: string, fontSize?: number, fontWeight?: 'normal' | 'bold'): number;
/**
 * Evaluates text against platform limits
 */
export declare function evaluateTextTruncation(text: string | undefined, recommendedMaxChars: number, hardLimitChars: number, fontSize?: number, fontWeight?: 'normal' | 'bold'): TextTruncationReport;
/**
 * Evaluates image dimensions and aspect ratios
 */
export declare function evaluateImageAspect(src: string | undefined, alt: string | undefined, width: number | undefined, height: number | undefined, spec: PlatformLimitSpec['image']): ImageAspectReport;
/**
 * Evaluates full card metadata against a platform spec
 */
export declare function evaluateCard(title: string | undefined, description: string | undefined, imageSrc: string | undefined, imageAlt: string | undefined, imageWidth: number | undefined, imageHeight: number | undefined, specKey?: string): CardEvaluationResult;
/**
 * Evaluates metadata against all available platform specs
 */
export declare function evaluateAllPlatforms(title?: string, description?: string, imageSrc?: string, imageAlt?: string, imageWidth?: number, imageHeight?: number, specsToEvaluate?: string[]): Record<string, CardEvaluationResult>;
//# sourceMappingURL=limits.d.ts.map