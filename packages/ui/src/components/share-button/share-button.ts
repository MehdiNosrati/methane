import { UIElement, html, property, state } from '@methane-ui/core';
import { ClipboardAndShare, LiveAnnouncer } from '@methane-ui/primitives';
import { shareButtonMessages } from './share-button.messages.js';
import { shareButtonStyles } from './share-button.styles.js';

export type MthShareButtonVariant = 'solid' | 'outline' | 'ghost';
export type MthShareButtonSize = 'sm' | 'md' | 'lg';

function isSafeShareUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (/^(\/|\.\.?\/|\?|#)/.test(trimmed)) return true;
  try {
    const parsed = new URL(trimmed, 'https://example.invalid');
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Web Share button with safe URL filtering and clipboard fallback.
 */
export class MthShareButton extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = shareButtonStyles;
  static override messages = shareButtonMessages;

  @property({ type: String, attribute: 'share-title' })
  shareTitle = '';

  @property({ type: String })
  text = '';

  @property({ type: String })
  url = '';

  @property({ type: String, reflect: true })
  variant: MthShareButtonVariant = 'outline';

  @property({ type: String, reflect: true })
  size: MthShareButtonSize = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Number, attribute: 'feedback-duration' })
  feedbackDuration = 2000;

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'shared-label' })
  sharedLabel = '';

  @state()
  private shared = false;

  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  override disconnectedCallback(): void {
    this.clearResetTimer();
    super.disconnectedCallback();
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
  }

  private clearResetTimer(): void {
    if (this.resetTimer !== null) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Triggers sharing via Web Share API or clipboard fallback.
   */
  async share(): Promise<boolean> {
    if (this.disabled) return false;
    if (this.url && !isSafeShareUrl(this.url)) {
      this.emitEvent('mth-share-error', { detail: { reason: 'unsafe-url' } });
      return false;
    }

    const payload: { title?: string; text?: string; url?: string } = {};
    if (this.shareTitle) payload.title = this.shareTitle;
    if (this.text) payload.text = this.text;
    if (this.url) payload.url = this.url;

    const result = await ClipboardAndShare.share(payload);
    if (!result.ok) {
      this.emitEvent('mth-share-error', { detail: { reason: result.method } });
      return false;
    }

    this.shared = true;
    this.setCustomState('shared', true);
    const announcement = this.sharedLabel || this.t('shared');
    LiveAnnouncer.announce(announcement, 'polite');
    this.emitEvent('mth-share', {
      detail: { method: result.method, ...payload },
    });

    this.clearResetTimer();
    const duration = Math.max(0, this.feedbackDuration);
    this.resetTimer = setTimeout(() => {
      this.shared = false;
      this.setCustomState('shared', false);
      this.resetTimer = null;
    }, duration);
    return true;
  }

  private handleClick = (): void => {
    void this.share();
  };

  override render() {
    const idleLabel = this.label || this.t('share');
    const activeLabel = this.sharedLabel || this.t('shared');
    const ariaLabel = this.shared ? activeLabel : idleLabel;

    return html`
      <button
        part="base"
        type="button"
        data-shared=${this.shared ? 'true' : 'false'}
        aria-label=${ariaLabel}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        ${this.shared
          ? html`<slot name="shared">${activeLabel}</slot>`
          : html`<slot>${idleLabel}</slot>`}
      </button>
    `;
  }
}
