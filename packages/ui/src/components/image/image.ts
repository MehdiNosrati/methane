import { IS_DEV, devWarn, UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { imageMessages } from './image.messages.js';
import { imageStyles } from './image.styles.js';

export type MthImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
export type MthImageLoading = 'lazy' | 'eager';
export type MthImageDecoding = 'async' | 'sync' | 'auto';

const SAFE_ASPECT_RATIO_RE = /^(auto|\d+(\.\d+)?(\s*\/\s*\d+(\.\d+)?)?)$/;
const VALID_IMAGE_FITS: ReadonlySet<string> = new Set([
  'cover',
  'contain',
  'fill',
  'none',
  'scale-down',
]);

function isSafeImageSrc(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return false;
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\\\')) {
    return false;
  }
  if (/^(\/|\.\/|\.\.\/)/.test(trimmed)) return true;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!schemeMatch) return !trimmed.startsWith('//');
  const scheme = schemeMatch[1]!.toLowerCase();
  return scheme === 'https' || scheme === 'http';
}

/**
 * `<mth-image>`: progressive image component with lazy loading, aspect-ratio sheet,
 * safe-URL validation, placeholder slot, and fallback src/slot support.
 */
export class MthImage extends UIElement {
  static override messages = imageMessages;
  static override styles = imageStyles;

  @property({ type: String, reflect: true })
  src = '';

  @property({ type: String, reflect: true })
  alt = '';

  @property({ type: String, attribute: 'fallback-src' })
  fallbackSrc = '';

  @property({ type: String, attribute: 'aspect-ratio' })
  aspectRatio = '';

  @property({ type: String, reflect: true })
  fit: MthImageFit = 'cover';

  @property({ type: String, reflect: true })
  loading: MthImageLoading = 'lazy';

  @property({ type: String, reflect: true })
  decoding: MthImageDecoding = 'async';

  @property({ type: Boolean, reflect: true })
  rounded = false;

  @state()
  private loadState: 'loading' | 'loaded' | 'error' = 'loading';

  @state()
  private usingFallback = false;

  private layoutSheet: CSSStyleSheet | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncLayoutSheet();
    this.syncCustomStates();
  }

  override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('src')) {
      this.usingFallback = false;
      this.loadState = this.resolveActiveSrc() ? 'loading' : 'error';
    }
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('aspectRatio') || changed.has('fit')) {
      this.syncLayoutSheet();
    }
  }

  private syncCustomStates(): void {
    this.setCustomState('loading', this.loadState === 'loading');
    this.setCustomState('loaded', this.loadState === 'loaded');
    this.setCustomState('error', this.loadState === 'error');
  }

  private syncLayoutSheet(): void {
    const root = this.shadowRoot;
    if (!root || !('adoptedStyleSheets' in root) || typeof CSSStyleSheet === 'undefined') {
      return;
    }
    if (!this.layoutSheet) {
      this.layoutSheet = new CSSStyleSheet();
    }
    if (typeof this.layoutSheet.replaceSync === 'function') {
      const trimmedRatio = this.aspectRatio.trim();
      const safeRatio = trimmedRatio && SAFE_ASPECT_RATIO_RE.test(trimmedRatio) ? trimmedRatio : '';
      if (trimmedRatio && !safeRatio) {
        if (IS_DEV) {
          devWarn(`<mth-image> rejected unsafe aspect-ratio "${trimmedRatio}".`);
        }
      }
      const safeFit = VALID_IMAGE_FITS.has(this.fit) ? this.fit : 'cover';
      const ratioRule = safeRatio ? `--_aspect-ratio: ${safeRatio};` : '';
      const fitRule = `--_fit: ${safeFit};`;
      this.layoutSheet.replaceSync(`:host { ${ratioRule} ${fitRule} }`);
      if (!root.adoptedStyleSheets.includes(this.layoutSheet)) {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.layoutSheet];
      }
    }
  }

  private resolveActiveSrc(): string | undefined {
    const candidate = this.usingFallback ? this.fallbackSrc : this.src;
    const trimmed = candidate.trim();
    if (!trimmed) return undefined;
    if (!isSafeImageSrc(trimmed)) {
      if (IS_DEV) {
        devWarn(`<mth-image> rejected unsafe src "${trimmed}".`);
      }
      return undefined;
    }
    return trimmed;
  }

  private handleLoad = (): void => {
    this.loadState = 'loaded';
    this.syncCustomStates();
    this.dispatchEvent(
      new CustomEvent<{ src: string }>('mth-load', {
        bubbles: true,
        composed: true,
        detail: { src: this.resolveActiveSrc() ?? '' },
      }),
    );
  };

  private handleError = (): void => {
    if (!this.usingFallback && this.fallbackSrc && isSafeImageSrc(this.fallbackSrc)) {
      this.usingFallback = true;
      this.loadState = 'loading';
      this.syncCustomStates();
      return;
    }
    this.loadState = 'error';
    this.syncCustomStates();
    this.dispatchEvent(
      new CustomEvent<{ src: string }>('mth-error', {
        bubbles: true,
        composed: true,
        detail: { src: this.src },
      }),
    );
  };

  protected override render() {
    const activeSrc = this.resolveActiveSrc();
    const showImg = Boolean(activeSrc) && this.loadState !== 'error';
    const showPlaceholder = Boolean(activeSrc) && this.loadState === 'loading';
    const showFallback = !activeSrc || this.loadState === 'error';

    return html`
      <div class="base" part="base">
        ${showImg
          ? html`
              <img
                class="img"
                part="img"
                src=${activeSrc!}
                alt=${this.alt}
                loading=${this.loading}
                decoding=${this.decoding}
                @load=${this.handleLoad}
                @error=${this.handleError}
              />
            `
          : nothing}

        <div class="placeholder" part="placeholder" ?hidden=${!showPlaceholder} aria-hidden="true">
          <slot name="placeholder"></slot>
        </div>

        <div class="fallback" part="fallback" ?hidden=${!showFallback} role=${showFallback ? 'img' : nothing} aria-label=${showFallback ? this.alt || this.t('loadError') : nothing}>
          <slot name="fallback">${this.t('loadError')}</slot>
        </div>
      </div>
    `;
  }
}
