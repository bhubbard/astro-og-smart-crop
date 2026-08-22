import { extractMetaTagsFromDOM, resolveSocialMetadata, type SocialMetaTags } from './middleware';
import { PLATFORM_SPECS, evaluateCard, evaluateAllPlatforms, type SocialPlatform, type CardEvaluationResult } from './limits';
import { generateCardOptimization, getGeminiNanoStatus, type SuggestionVariant } from './nano-suggester';

export interface OverlayOptions {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  defaultPlatform?: string;
  autoOpenOnError?: boolean;
}

/**
 * Initializes and mounts the dev overlay into the page.
 */
export function initOGSmartCropOverlay(options: OverlayOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Prevent multiple injections
  if (document.querySelector('astro-og-smart-crop')) return;

  const overlayEl = document.createElement('astro-og-smart-crop');
  document.body.appendChild(overlayEl);
}

export class AstroOGSmartCropElement extends HTMLElement {
  private shadow: ShadowRoot;
  private isOpen: boolean = false;
  private selectedSpecKey: string = 'twitter:summary_large_image';
  private metaTags: SocialMetaTags = {};
  private activeTitle: string = '';
  private activeDescription: string = '';
  private activeImage: string = '';
  private nanoStatus: { available: boolean; status: string; details: string } = {
    available: false,
    status: 'checking',
    details: 'Checking Gemini Nano...',
  };
  private isGenerating: boolean = false;
  private suggestions: { titles: SuggestionVariant[]; descriptions: SuggestionVariant[] } = {
    titles: [],
    descriptions: [],
  };

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    this.refreshMetadata();
    this.render();
    this.checkNano();

    // Re-evaluate if DOM changes (e.g. Astro View Transitions)
    document.addEventListener('astro:page-load', () => {
      this.refreshMetadata();
      this.render();
    });
  }

  private refreshMetadata() {
    this.metaTags = extractMetaTagsFromDOM(document);
    const resolved = resolveSocialMetadata(this.metaTags, 'twitter');
    this.activeTitle = resolved.title;
    this.activeDescription = resolved.description;
    this.activeImage = resolved.image || '';
  }

  private async checkNano() {
    this.nanoStatus = await getGeminiNanoStatus();
    this.render();
  }

  private toggleOpen() {
    this.isOpen = !this.isOpen;
    this.render();
  }

  private selectPlatform(specKey: string) {
    this.selectedSpecKey = specKey;
    this.render();
  }

  private async triggerOptimization() {
    if (this.isGenerating) return;
    this.isGenerating = true;
    this.render();

    const spec = PLATFORM_SPECS[this.selectedSpecKey] || PLATFORM_SPECS['twitter:summary_large_image'];
    try {
      const result = await generateCardOptimization(this.activeTitle, this.activeDescription, {
        platform: spec.platform,
        maxChars: spec.title.recommendedMaxChars,
      });
      this.suggestions = {
        titles: result.titles,
        descriptions: result.descriptions,
      };
    } catch (e) {
      console.error('[astro-og-smart-crop] Error generating variants:', e);
    } finally {
      this.isGenerating = false;
      this.render();
    }
  }

  private applySuggestion(type: 'title' | 'description', text: string) {
    if (type === 'title') {
      this.activeTitle = text;
    } else {
      this.activeDescription = text;
    }
    this.render();
  }

  private copyTag(property: string, content: string) {
    const snippet = `<meta property="${property}" content="${content.replace(/"/g, '&quot;')}" />`;
    navigator.clipboard.writeText(snippet).then(() => {
      alert(`Copied to clipboard:\n${snippet}`);
    });
  }

  private render() {
    const allEvals = evaluateAllPlatforms(
      this.activeTitle,
      this.activeDescription,
      this.activeImage,
      undefined,
      this.metaTags.ogImageWidth,
      this.metaTags.ogImageHeight
    );

    const currentEval = allEvals[this.selectedSpecKey] || allEvals['twitter:summary_large_image'];
    
    // Count total issues across all platforms
    let totalTruncated = 0;
    let totalWarnings = 0;
    Object.values(allEvals).forEach(ev => {
      if (ev.status === 'truncated') totalTruncated++;
      else if (ev.status === 'warning') totalWarnings++;
    });

    const badgeColor = totalTruncated > 0 ? '#ef4444' : (totalWarnings > 0 ? '#f59e0b' : '#10b981');
    const badgeText = totalTruncated > 0 ? `${totalTruncated} Truncated` : (totalWarnings > 0 ? `${totalWarnings} Warnings` : 'OG Ready');

    const domain = (this.metaTags.ogUrl || window?.location?.hostname || 'example.com')
      .replace(/^https?:\/\//, '')
      .split('/')[0];

    this.shadow.innerHTML = `
      <style>
        :host {
          --og-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          --og-bg: #12151c;
          --og-card-bg: #1c212c;
          --og-border: #2d3748;
          --og-text: #f3f4f6;
          --og-muted: #9ca3af;
          --og-accent: #6366f1;
          --og-success: #10b981;
          --og-warning: #f59e0b;
          --og-danger: #ef4444;
          font-family: var(--og-font);
          z-index: 999999;
          position: fixed;
        }

        /* Floating Trigger Pill */
        .og-launcher {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #181c24;
          color: #ffffff;
          border: 1px solid #323d4f;
          padding: 8px 14px;
          border-radius: 9999px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 999999;
          user-select: none;
        }
        .og-launcher:hover {
          transform: translateY(-2px);
          border-color: #6366f1;
          box-shadow: 0 14px 28px -4px rgba(99, 102, 241, 0.35);
        }
        .og-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${badgeColor};
          box-shadow: 0 0 8px ${badgeColor};
        }

        /* Modal Overlay Drawer */
        .og-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 10, 15, 0.75);
          backdrop-filter: blur(4px);
          z-index: 1000000;
          display: ${this.isOpen ? 'flex' : 'none'};
          justify-content: flex-end;
        }

        .og-drawer {
          width: 680px;
          max-width: 95vw;
          height: 100vh;
          background: var(--og-bg);
          border-left: 1px solid var(--og-border);
          box-shadow: -10px 0 35px rgba(0,0,0,0.7);
          display: flex;
          flex-direction: column;
          color: var(--og-text);
          overflow: hidden;
        }

        .og-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--og-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #161b24;
        }
        .og-title-bar {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .og-brand-badge {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .og-nano-pill {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          background: ${this.nanoStatus.available ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'};
          color: ${this.nanoStatus.available ? '#34d399' : '#fbbf24'};
          border: 1px solid ${this.nanoStatus.available ? '#059669' : '#d97706'};
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .og-close-btn {
          background: transparent;
          border: none;
          color: var(--og-muted);
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .og-close-btn:hover {
          color: #fff;
          background: #283141;
        }

        /* Tabs */
        .og-tabs {
          display: flex;
          gap: 6px;
          padding: 12px 20px;
          background: #141820;
          border-bottom: 1px solid var(--og-border);
          overflow-x: auto;
        }
        .og-tab-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--og-muted);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .og-tab-btn:hover {
          color: #fff;
          background: #1f2735;
        }
        .og-tab-btn.active {
          background: #263144;
          border-color: #3b4961;
          color: #fff;
          font-weight: 600;
        }
        .og-tab-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        /* Content Body */
        .og-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Preview Canvas */
        .og-preview-card {
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #333;
          box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        }

        /* Realistic Platform Mockups */
        .mockup-twitter-large {
          background: #000000;
          border: 1px solid #2f3336;
          border-radius: 16px;
          overflow: hidden;
          color: #e7e9ea;
        }
        .mockup-twitter-img {
          width: 100%;
          aspect-ratio: 1.91 / 1;
          object-fit: cover;
          display: block;
          background: #16181c;
        }
        .mockup-twitter-content {
          padding: 12px;
        }
        .mockup-twitter-domain {
          font-size: 13px;
          color: #71767b;
          margin-bottom: 2px;
        }
        .mockup-twitter-title {
          font-size: 15px;
          font-weight: 700;
          line-height: 1.3;
          color: #e7e9ea;
          margin-bottom: 4px;
        }
        .mockup-twitter-desc {
          font-size: 13px;
          color: #71767b;
          line-height: 1.35;
        }

        /* Twitter Summary Square */
        .mockup-twitter-summary {
          background: #000000;
          border: 1px solid #2f3336;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          color: #e7e9ea;
        }
        .mockup-twitter-summary-img {
          width: 125px;
          height: 125px;
          object-fit: cover;
          flex-shrink: 0;
          background: #16181c;
        }
        .mockup-twitter-summary-content {
          padding: 12px;
          flex: 1;
          min-width: 0;
        }

        /* LinkedIn Mockup */
        .mockup-linkedin {
          background: #1b1f23;
          border: 1px solid #38434f;
          border-radius: 8px;
          overflow: hidden;
          color: #fff;
        }
        .mockup-linkedin-img {
          width: 100%;
          aspect-ratio: 1.91 / 1;
          object-fit: cover;
          display: block;
          background: #283038;
        }
        .mockup-linkedin-content {
          padding: 12px 14px;
          background: #232a34;
        }
        .mockup-linkedin-title {
          font-size: 14px;
          font-weight: 600;
          color: #e1e9ee;
          margin-bottom: 4px;
          line-height: 1.3;
        }
        .mockup-linkedin-domain {
          font-size: 12px;
          color: #93a3b1;
        }

        /* Facebook Mockup */
        .mockup-facebook {
          background: #242526;
          border: 1px solid #3e4042;
          overflow: hidden;
          color: #e4e6eb;
        }
        .mockup-facebook-img {
          width: 100%;
          aspect-ratio: 1.91 / 1;
          object-fit: cover;
          display: block;
          background: #18191a;
        }
        .mockup-facebook-content {
          padding: 10px 12px;
          background: #3a3b3c;
        }
        .mockup-facebook-domain {
          font-size: 12px;
          color: #b0b3b8;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .mockup-facebook-title {
          font-size: 16px;
          font-weight: 600;
          color: #e4e6eb;
          margin: 3px 0;
          line-height: 1.25;
        }
        .mockup-facebook-desc {
          font-size: 13px;
          color: #b0b3b8;
          line-height: 1.3;
        }

        /* Discord Mockup */
        .mockup-discord {
          background: #2f3136;
          border-left: 4px solid #5865f2;
          border-radius: 4px;
          padding: 12px 16px;
          color: #dcddde;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mockup-discord-title {
          font-size: 15px;
          font-weight: 600;
          color: #00aff4;
        }
        .mockup-discord-desc {
          font-size: 13px;
          color: #dcddde;
          line-height: 1.35;
        }
        .mockup-discord-img {
          width: 100%;
          max-height: 260px;
          object-fit: cover;
          border-radius: 4px;
        }

        /* Slack Mockup */
        .mockup-slack {
          background: #1a1d21;
          border-left: 4px solid #4a154b;
          padding: 10px 14px;
          border-radius: 4px;
          color: #d1d2d3;
          display: flex;
          gap: 12px;
        }
        .mockup-slack-content {
          flex: 1;
        }
        .mockup-slack-site {
          font-size: 12px;
          font-weight: 700;
          color: #abacad;
          margin-bottom: 2px;
        }
        .mockup-slack-title {
          font-size: 14px;
          font-weight: 700;
          color: #1d9bd1;
          margin-bottom: 4px;
        }
        .mockup-slack-desc {
          font-size: 13px;
          color: #d1d2d3;
        }
        .mockup-slack-img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
        }

        /* Metrics & Evaluation Section */
        .og-metrics-box {
          background: var(--og-card-bg);
          border: 1px solid var(--og-border);
          border-radius: 10px;
          padding: 16px;
        }
        .og-section-head {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--og-muted);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .og-field-meter {
          margin-bottom: 14px;
        }
        .og-meter-top {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .og-meter-bar-bg {
          height: 6px;
          background: #2e384d;
          border-radius: 3px;
          overflow: hidden;
        }
        .og-meter-bar-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        .og-pill {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .og-pill.ok { background: rgba(16,185,129,0.2); color: #34d399; }
        .og-pill.warning { background: rgba(245,158,11,0.2); color: #fbbf24; }
        .og-pill.truncated { background: rgba(239,68,68,0.2); color: #f87171; }

        /* Warnings Box */
        .og-warning-item {
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          margin-bottom: 6px;
        }

        /* AI Optimizer Box */
        .og-ai-box {
          background: linear-gradient(180deg, #1e1b4b 0%, #171923 100%);
          border: 1px solid #4338ca;
          border-radius: 10px;
          padding: 16px;
        }
        .og-ai-btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          color: #fff;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          transition: all 0.2s ease;
        }
        .og-ai-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .og-ai-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .og-variant-card {
          background: #141722;
          border: 1px solid #2d3348;
          border-radius: 8px;
          padding: 12px;
          margin-top: 10px;
        }
        .og-variant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 11px;
        }
        .og-variant-tag {
          color: #818cf8;
          font-weight: 700;
          text-transform: uppercase;
        }
        .og-variant-text {
          font-size: 13px;
          line-height: 1.4;
          color: #e2e8f0;
          margin-bottom: 8px;
        }
        .og-variant-actions {
          display: flex;
          gap: 8px;
        }
        .og-action-btn {
          background: #23293a;
          border: 1px solid #384259;
          color: #cbd5e1;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .og-action-btn:hover {
          background: #313a52;
          color: #fff;
        }

        /* Simulation live inputs */
        .og-inputs-grid {
          display: grid;
          gap: 10px;
        }
        .og-input-group label {
          font-size: 11px;
          font-weight: 600;
          color: var(--og-muted);
          display: block;
          margin-bottom: 4px;
        }
        .og-input-group input, .og-input-group textarea {
          width: 100%;
          box-sizing: border-box;
          background: #12151c;
          border: 1px solid var(--og-border);
          color: #fff;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
        }
        .og-input-group textarea {
          resize: vertical;
          min-height: 60px;
        }
      </style>

      <!-- Trigger Launcher Pill -->
      <div class="og-launcher" id="og-launcher-btn">
        <span class="og-status-dot"></span>
        <span>${badgeText}</span>
      </div>

      <!-- Backdrop & Drawer -->
      <div class="og-backdrop" id="og-backdrop">
        <div class="og-drawer">
          <!-- Header -->
          <div class="og-header">
            <div class="og-title-bar">
              <span class="og-brand-badge">OG SMART CROP</span>
              <span class="og-nano-pill">
                ● ${this.nanoStatus.available ? 'Gemini Nano Ready' : 'Heuristic Mode'}
              </span>
            </div>
            <button class="og-close-btn" id="og-close-btn">&times;</button>
          </div>

          <!-- Platform Selector Tabs -->
          <div class="og-tabs">
            ${Object.entries(PLATFORM_SPECS).map(([key, spec]) => {
              const res = allEvals[key];
              const dotColor = res?.status === 'truncated' ? '#ef4444' : (res?.status === 'warning' ? '#f59e0b' : '#10b981');
              return `
                <button class="og-tab-btn ${key === this.selectedSpecKey ? 'active' : ''}" data-spec="${key}">
                  <span class="og-tab-dot" style="background: ${dotColor};"></span>
                  <span>${spec.name}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Body -->
          <div class="og-body">
            <!-- Simulated Preview -->
            <div class="og-preview-card">
              ${this.renderMockup(currentEval, domain)}
            </div>

            <!-- Truncation Metrics & Thresholds -->
            <div class="og-metrics-box">
              <div class="og-section-head">
                <span>Truncation & Constraint Analysis</span>
                <span class="og-pill ${currentEval.status}">${currentEval.status.toUpperCase()}</span>
              </div>

              <!-- Title Meter -->
              <div class="og-field-meter">
                <div class="og-meter-top">
                  <span>Headline: <strong>${currentEval.title.length}</strong> / ${currentEval.title.recommendedMaxChars} chars (hard limit: ${currentEval.title.hardLimitChars})</span>
                  <span class="og-pill ${currentEval.title.isTruncated ? 'truncated' : (currentEval.title.isWarning ? 'warning' : 'ok')}">
                    ${currentEval.title.isTruncated ? `TRUNCATED (+${currentEval.title.overflow})` : (currentEval.title.isWarning ? 'MOBILE RISK' : 'PERFECT')}
                  </span>
                </div>
                <div class="og-meter-bar-bg">
                  <div class="og-meter-bar-fill" style="
                    width: ${Math.min(100, (currentEval.title.length / currentEval.title.hardLimitChars) * 100)}%;
                    background: ${currentEval.title.isTruncated ? 'var(--og-danger)' : (currentEval.title.isWarning ? 'var(--og-warning)' : 'var(--og-success)')};
                  "></div>
                </div>
              </div>

              <!-- Description Meter -->
              <div class="og-field-meter">
                <div class="og-meter-top">
                  <span>Description: <strong>${currentEval.description.length}</strong> / ${currentEval.description.recommendedMaxChars} chars</span>
                  <span class="og-pill ${currentEval.description.isTruncated ? 'truncated' : (currentEval.description.isWarning ? 'warning' : 'ok')}">
                    ${currentEval.description.isTruncated ? `TRUNCATED (+${currentEval.description.overflow})` : (currentEval.description.isWarning ? 'FEED RISK' : 'OK')}
                  </span>
                </div>
                <div class="og-meter-bar-bg">
                  <div class="og-meter-bar-fill" style="
                    width: ${Math.min(100, (currentEval.description.length / currentEval.description.hardLimitChars) * 100)}%;
                    background: ${currentEval.description.isTruncated ? 'var(--og-danger)' : (currentEval.description.isWarning ? 'var(--og-warning)' : 'var(--og-success)')};
                  "></div>
                </div>
              </div>

              <!-- Image ratio details -->
              <div class="og-meter-top" style="margin-top: 8px;">
                <span>Aspect Ratio: <strong>${currentEval.image.computedRatio ? currentEval.image.computedRatio + ':1' : 'Unspecified'}</strong> (target: ${currentEval.image.aspectRatioLabel})</span>
                <span class="og-pill ${currentEval.image.isValidRatio ? 'ok' : 'warning'}">
                  ${currentEval.image.isValidRatio ? 'VALID RATIO' : 'RATIO MISMATCH'}
                </span>
              </div>

              <!-- Warnings List -->
              ${currentEval.warnings.length > 0 ? `
                <div style="margin-top: 12px;">
                  ${currentEval.warnings.map(w => `<div class="og-warning-item">⚠️ ${w}</div>`).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Gemini Nano AI Suggestions -->
            <div class="og-ai-box">
              <div class="og-section-head" style="color: #c7d2fe;">
                <span>✨ Gemini Nano Smart Rewriter</span>
                <span style="font-size: 11px; text-transform: none; color: #a5b4fc;">Budget: &lt;${currentEval.title.recommendedMaxChars} chars</span>
              </div>

              <button class="og-ai-btn" id="og-ai-generate-btn" ${this.isGenerating ? 'disabled' : ''}>
                ${this.isGenerating ? 'Analyzing & Prompting Model...' : 'Prompt Gemini Nano for Zero-Truncation Variants'}
              </button>

              ${this.suggestions.titles.length > 0 ? `
                <div style="margin-top: 14px;">
                  <div style="font-size: 11px; font-weight: 700; color: #93c5fd; margin-bottom: 6px;">SUGGESTED HEADLINES</div>
                  ${this.suggestions.titles.map((t, idx) => `
                    <div class="og-variant-card">
                      <div class="og-variant-header">
                        <span class="og-variant-tag">${t.label}</span>
                        <span class="og-pill ${t.fitsBudget ? 'ok' : 'truncated'}">${t.charCount} / ${t.maxBudget} chars</span>
                      </div>
                      <div class="og-variant-text">${t.text}</div>
                      <div class="og-variant-actions">
                        <button class="og-action-btn apply-title-btn" data-text="${t.text}">Apply to Preview</button>
                        <button class="og-action-btn copy-title-btn" data-prop="${this.selectedSpecKey.startsWith('twitter') ? 'twitter:title' : 'og:title'}" data-text="${t.text}">Copy Meta Tag</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${this.suggestions.descriptions.length > 0 ? `
                <div style="margin-top: 14px;">
                  <div style="font-size: 11px; font-weight: 700; color: #93c5fd; margin-bottom: 6px;">SUGGESTED EXCERPTS</div>
                  ${this.suggestions.descriptions.map((d, idx) => `
                    <div class="og-variant-card">
                      <div class="og-variant-header">
                        <span class="og-variant-tag">${d.label}</span>
                        <span class="og-pill ${d.fitsBudget ? 'ok' : 'truncated'}">${d.charCount} / ${d.maxBudget} chars</span>
                      </div>
                      <div class="og-variant-text">${d.text}</div>
                      <div class="og-variant-actions">
                        <button class="og-action-btn apply-desc-btn" data-text="${d.text}">Apply to Preview</button>
                        <button class="og-action-btn copy-desc-btn" data-prop="${this.selectedSpecKey.startsWith('twitter') ? 'twitter:description' : 'og:description'}" data-text="${d.text}">Copy Meta Tag</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <!-- Live Interactive Tester -->
            <div class="og-metrics-box">
              <div class="og-section-head">
                <span>Live Meta Simulator</span>
              </div>
              <div class="og-inputs-grid">
                <div class="og-input-group">
                  <label>Title / Headline</label>
                  <input type="text" id="og-input-title" value="${this.activeTitle.replace(/"/g, '&quot;')}" />
                </div>
                <div class="og-input-group">
                  <label>Description / Excerpt</label>
                  <textarea id="og-input-desc">${this.activeDescription}</textarea>
                </div>
                <div class="og-input-group">
                  <label>Image URL</label>
                  <input type="text" id="og-input-img" value="${this.activeImage.replace(/"/g, '&quot;')}" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderMockup(evaluation: CardEvaluationResult, domain: string): string {
    const title = evaluation.title.truncatedPreview || this.activeTitle || 'Page Title';
    const desc = evaluation.description.truncatedPreview || this.activeDescription || 'Page description excerpt...';
    const image = this.activeImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop';

    if (this.selectedSpecKey === 'twitter:summary') {
      return `
        <div class="mockup-twitter-summary">
          <img src="${image}" class="mockup-twitter-summary-img" alt="Thumbnail" />
          <div class="mockup-twitter-summary-content">
            <div class="mockup-twitter-domain">${domain}</div>
            <div class="mockup-twitter-title">${title}</div>
            <div class="mockup-twitter-desc">${desc}</div>
          </div>
        </div>
      `;
    }

    if (this.selectedSpecKey === 'linkedin') {
      return `
        <div class="mockup-linkedin">
          <img src="${image}" class="mockup-linkedin-img" alt="Banner" />
          <div class="mockup-linkedin-content">
            <div class="mockup-linkedin-title">${title}</div>
            <div class="mockup-linkedin-domain">${domain}</div>
          </div>
        </div>
      `;
    }

    if (this.selectedSpecKey === 'facebook') {
      return `
        <div class="mockup-facebook">
          <img src="${image}" class="mockup-facebook-img" alt="Banner" />
          <div class="mockup-facebook-content">
            <div class="mockup-facebook-domain">${domain}</div>
            <div class="mockup-facebook-title">${title}</div>
            <div class="mockup-facebook-desc">${desc}</div>
          </div>
        </div>
      `;
    }

    if (this.selectedSpecKey === 'discord') {
      return `
        <div class="mockup-discord">
          <div class="mockup-discord-title">${title}</div>
          <div class="mockup-discord-desc">${desc}</div>
          <img src="${image}" class="mockup-discord-img" alt="Embed banner" />
        </div>
      `;
    }

    if (this.selectedSpecKey === 'slack') {
      return `
        <div class="mockup-slack">
          <div class="mockup-slack-content">
            <div class="mockup-slack-site">${domain}</div>
            <div class="mockup-slack-title">${title}</div>
            <div class="mockup-slack-desc">${desc}</div>
          </div>
          <img src="${image}" class="mockup-slack-img" alt="Slack thumb" />
        </div>
      `;
    }

    // Default: Twitter Large Image
    return `
      <div class="mockup-twitter-large">
        <img src="${image}" class="mockup-twitter-img" alt="Banner" />
        <div class="mockup-twitter-content">
          <div class="mockup-twitter-domain">${domain}</div>
          <div class="mockup-twitter-title">${title}</div>
          <div class="mockup-twitter-desc">${desc}</div>
        </div>
      </div>
    `;
  }

  private attachEventListeners() {
    this.shadow.getElementById('og-launcher-btn')?.addEventListener('click', () => this.toggleOpen());
    this.shadow.getElementById('og-close-btn')?.addEventListener('click', () => this.toggleOpen());
    
    // Platform tab clicks
    this.shadow.querySelectorAll('.og-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const spec = (e.currentTarget as HTMLElement).getAttribute('data-spec');
        if (spec) this.selectPlatform(spec);
      });
    });

    // AI generation
    this.shadow.getElementById('og-ai-generate-btn')?.addEventListener('click', () => {
      this.triggerOptimization();
    });

    // Apply suggestions
    this.shadow.querySelectorAll('.apply-title-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = (e.currentTarget as HTMLElement).getAttribute('data-text');
        if (text) this.applySuggestion('title', text);
      });
    });

    this.shadow.querySelectorAll('.apply-desc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = (e.currentTarget as HTMLElement).getAttribute('data-text');
        if (text) this.applySuggestion('description', text);
      });
    });

    // Copy tags
    this.shadow.querySelectorAll('.copy-title-btn, .copy-desc-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prop = (e.currentTarget as HTMLElement).getAttribute('data-prop') || 'og:title';
        const text = (e.currentTarget as HTMLElement).getAttribute('data-text') || '';
        this.copyTag(prop, text);
      });
    });

    // Live inputs
    const titleInput = this.shadow.getElementById('og-input-title') as HTMLInputElement;
    titleInput?.addEventListener('input', (e) => {
      this.activeTitle = (e.target as HTMLInputElement).value;
      this.render();
    });

    const descInput = this.shadow.getElementById('og-input-desc') as HTMLTextAreaElement;
    descInput?.addEventListener('input', (e) => {
      this.activeDescription = (e.target as HTMLTextAreaElement).value;
      this.render();
    });

    const imgInput = this.shadow.getElementById('og-input-img') as HTMLInputElement;
    imgInput?.addEventListener('input', (e) => {
      this.activeImage = (e.target as HTMLInputElement).value;
      this.render();
    });
  }
}

// Auto-register custom element in browser environment
if (typeof customElements !== 'undefined' && !customElements.get('astro-og-smart-crop')) {
  customElements.define('astro-og-smart-crop', AstroOGSmartCropElement);
}

// Auto-mount in dev browser if not SSR
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initOGSmartCropOverlay());
  } else {
    initOGSmartCropOverlay();
  }
}
