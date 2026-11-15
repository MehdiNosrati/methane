import { UIElement, type PropertyValues, html, nothing, property, query, state } from '@methane/core';
import { ObserverPoolController } from '@methane/primitives';
import { scrollAreaMessages } from './scroll-area.messages.js';
import { scrollAreaStyles } from './scroll-area.styles.js';

export type MthScrollAreaType = 'auto' | 'always' | 'scroll' | 'hover';
export type MthScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

/**
 * Custom-styled accessible scroll area with logical scrollbar indicators.
 */
export class MthScrollArea extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = scrollAreaStyles;
  static override messages = scrollAreaMessages;

  @property({ type: String, reflect: true })
  type: MthScrollAreaType = 'hover';

  @property({ type: String, reflect: true })
  orientation: MthScrollAreaOrientation = 'vertical';

  @property({ type: String })
  label = '';

  @query('[part="viewport"]')
  private viewportEl!: HTMLElement | null;

  @query('[part="content"]')
  private contentEl!: HTMLElement | null;

  @state()
  private scrolling = false;

  private readonly observerPool: ObserverPoolController;
  private dynamicSheet: CSSStyleSheet | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
    this.observerPool = new ObserverPoolController(this);
  }

  override disconnectedCallback(): void {
    if (this.scrollTimer !== null) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    super.disconnectedCallback();
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);
    if (this.viewportEl) {
      this.observerPool.observeResize(this.viewportEl, () => this.updateThumbMetrics());
    }
    if (this.contentEl) {
      this.observerPool.observeResize(this.contentEl, () => this.updateThumbMetrics());
    }
    this.updateThumbMetrics();
  }

  /**
   * Programmatically scrolls the internal viewport.
   */
  scrollViewportTo(options: ScrollToOptions): void {
    this.viewportEl?.scrollTo(options);
  }

  private readonly handleScroll = (): void => {
    const vp = this.viewportEl;
    if (!vp) return;
    this.scrolling = true;
    this.setCustomState('scrolling', true);
    if (this.scrollTimer !== null) {
      clearTimeout(this.scrollTimer);
    }
    this.scrollTimer = setTimeout(() => {
      this.scrolling = false;
      this.setCustomState('scrolling', false);
      this.scrollTimer = null;
    }, 600);

    this.updateThumbMetrics();
    this.emitEvent('mth-scroll', {
      detail: { scrollTop: vp.scrollTop, scrollLeft: vp.scrollLeft },
    });
  };

  private updateThumbMetrics(): void {
    const vp = this.viewportEl;
    if (
      !vp ||
      typeof CSSStyleSheet === 'undefined' ||
      !this.shadowRoot ||
      !('adoptedStyleSheets' in this.shadowRoot)
    ) {
      return;
    }
    if (!this.dynamicSheet) {
      this.dynamicSheet = new CSSStyleSheet();
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        this.dynamicSheet,
      ];
    }

    const clientH = Math.max(1, vp.clientHeight);
    const scrollH = Math.max(clientH, vp.scrollHeight);
    const ratioY = Math.min(1, clientH / scrollH);
    const maxScrollY = Math.max(1, scrollH - clientH);
    const offsetPctY = ((vp.scrollTop / maxScrollY) * (1 - ratioY)) * 100;

    const clientW = Math.max(1, vp.clientWidth);
    const scrollW = Math.max(clientW, vp.scrollWidth);
    const ratioX = Math.min(1, clientW / scrollW);
    const maxScrollX = Math.max(1, scrollW - clientW);
    const offsetPctX = ((vp.scrollLeft / maxScrollX) * (1 - ratioX)) * 100;

    this.dynamicSheet.replaceSync(
      `[part="thumb-y"] { block-size: ${Math.max(10, Math.round(ratioY * 100))}%; transform: translateY(${Math.round(offsetPctY)}%); }
       [part="thumb-x"] { inline-size: ${Math.max(10, Math.round(ratioX * 100))}%; transform: translateX(${Math.round(offsetPctX)}%); }`,
    );
  }

  override render() {
    return html`
      <div part="base" data-scrolling=${this.scrolling ? 'true' : 'false'}>
        <div
          part="viewport"
          tabindex="0"
          role=${this.label ? 'region' : nothing}
          aria-label=${this.label || nothing}
          @scroll=${this.handleScroll}
        >
          <div part="content">
            <slot></slot>
          </div>
        </div>
        <div part="scrollbar-y" aria-hidden="true">
          <div part="thumb-y"></div>
        </div>
        <div part="scrollbar-x" aria-hidden="true">
          <div part="thumb-x"></div>
        </div>
      </div>
    `;
  }
}
