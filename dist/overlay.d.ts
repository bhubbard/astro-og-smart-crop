export interface OverlayOptions {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    defaultPlatform?: string;
    autoOpenOnError?: boolean;
}
/**
 * Initializes and mounts the dev overlay into the page.
 */
export declare function initOGSmartCropOverlay(options?: OverlayOptions): void;
export declare class AstroOGSmartCropElement extends HTMLElement {
    private shadow;
    private isOpen;
    private selectedSpecKey;
    private metaTags;
    private activeTitle;
    private activeDescription;
    private activeImage;
    private nanoStatus;
    private isGenerating;
    private suggestions;
    constructor();
    connectedCallback(): Promise<void>;
    private refreshMetadata;
    private checkNano;
    private toggleOpen;
    private selectPlatform;
    private triggerOptimization;
    private applySuggestion;
    private copyTag;
    private render;
    private renderMockup;
    private attachEventListeners;
}
//# sourceMappingURL=overlay.d.ts.map