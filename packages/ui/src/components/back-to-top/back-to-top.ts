import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { backToTopMessages } from './back-to-top.messages.js';
import { backToTopStyles } from './back-to-top.styles.js';

/**
 * `<mth-back-to-top>`: Floating scroll-to-top trigger button synchronized with scroll offset.
 */
export class MthBackToTop extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };
  static override messages = backToTopMessages;
  static override styles = [backToTopStyles];

  @property({ type: Number })
  threshold = 300;

  @property({ type: String })
  label = '';

  @property({ type: Boolean })
  smooth = true;

  @property({ type: Boolean, reflect: true })
  visible = false;

  @property({ type: Boolean, attribute: 'always-visible' })
  alwaysVisible = false;

  @property({ attribute: false })
  scrollTarget: HTMLElement | null = null;

  private boundTarget: EventTarget | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.attachScrollListener();
    this.updateVisibilityFromScroll();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.detachScrollListener();
  }

  scrollToTop(): void {
    const allowed = this.emitEvent('mth-scroll-top', {
      cancelable: true,
      detail: { threshold: this.threshold },
    });
    if (!allowed) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = this.smooth && !prefersReduced ? 'smooth' : 'auto';

    if (this.scrollTarget) {
      if (typeof this.scrollTarget.scrollTo === 'function') {
        this.scrollTarget.scrollTo({ top: 0, behavior });
      } else {
        this.scrollTarget.scrollTop = 0;
      }
      this.updateVisibilityFromScroll();
      return;
    }

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior });
    }
  }

  protected override onFirstConnect(): void {
    this.setCustomState('visible', this.visible || this.alwaysVisible);
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    if (changed.has('scrollTarget') && this.isConnected) {
      this.attachScrollListener();
      this.updateVisibilityFromScroll();
    }
    if (changed.has('alwaysVisible') || changed.has('threshold')) {
      this.updateVisibilityFromScroll();
    }
    this.setCustomState('visible', this.visible || this.alwaysVisible);
  }

  private getCurrentScrollOffset(): number {
    if (this.scrollTarget) {
      return this.scrollTarget.scrollTop;
    }
    if (typeof window !== 'undefined') {
      return window.scrollY ?? 0;
    }
    return 0;
  }

  private updateVisibilityFromScroll(): void {
    const next = this.alwaysVisible || this.getCurrentScrollOffset() >= this.threshold;
    if (this.visible !== next) {
      this.visible = next;
    }
    this.setCustomState('visible', this.visible);
  }

  private readonly handleScroll = (): void => {
    this.updateVisibilityFromScroll();
  };

  private attachScrollListener(): void {
    this.detachScrollListener();
    const target: EventTarget | null =
      this.scrollTarget ?? (typeof window !== 'undefined' ? window : null);
    if (!target) return;
    target.addEventListener('scroll', this.handleScroll, { passive: true });
    this.boundTarget = target;
  }

  private detachScrollListener(): void {
    this.boundTarget?.removeEventListener('scroll', this.handleScroll);
    this.boundTarget = null;
  }

  protected override render() {
    const buttonLabel = this.label.trim() || this.t('buttonLabel');
    const isShown = this.visible || this.alwaysVisible;

    return html`
      <button
        part="button"
        type="button"
        aria-label=${buttonLabel}
        ?hidden=${!isShown}
        @click=${() => this.scrollToTop()}
      >
        <slot>${this.t('buttonText')}</slot>
      </button>
    `;
  }
}
