import { UIElement, html, property, state } from '@methane-ui/core';
import { ClipboardAndShare, LiveAnnouncer } from '@methane-ui/primitives';
import { copyButtonMessages } from './copy-button.messages.js';
import { copyButtonStyles } from './copy-button.styles.js';

export type MthCopyButtonVariant = 'solid' | 'outline' | 'ghost';
export type MthCopyButtonSize = 'sm' | 'md' | 'lg';

/**
 * Clipboard copy action button with live-region announcements and `:state(copied)` feedback.
 */
export class MthCopyButton extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = copyButtonStyles;
  static override messages = copyButtonMessages;

  @property({ type: String })
  value = '';

  @property({ type: String })
  target = '';

  @property({ type: Number, attribute: 'feedback-duration' })
  feedbackDuration = 2000;

  @property({ type: String, reflect: true })
  variant: MthCopyButtonVariant = 'outline';

  @property({ type: String, reflect: true })
  size: MthCopyButtonSize = 'md';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'copied-label' })
  copiedLabel = '';

  @state()
  private copied = false;

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

  private resolveCopyText(): string {
    if (this.value) return this.value;
    if (!this.target) return '';

    const root = this.getRootNode();
    const container =
      root instanceof Document || root instanceof ShadowRoot ? root : document;
    const byId =
      typeof (container as Document).getElementById === 'function'
        ? (container as Document).getElementById(this.target)
        : null;
    let targetEl: Element | null = byId;
    if (!targetEl) {
      try {
        targetEl = container.querySelector(this.target);
      } catch {
        targetEl = null;
      }
    }
    if (!targetEl && container !== document) {
      targetEl = document.getElementById(this.target);
    }
    if (!targetEl) return '';

    if (
      'value' in targetEl &&
      typeof (targetEl as HTMLInputElement).value === 'string'
    ) {
      return (targetEl as HTMLInputElement).value;
    }
    return targetEl.textContent?.trim() ?? '';
  }

  /**
   * Triggers clipboard copy programmatically.
   */
  async copy(): Promise<boolean> {
    if (this.disabled) return false;
    const text = this.resolveCopyText();
    if (!text) {
      this.emitEvent('mth-copy-error', { detail: { reason: 'empty' } });
      return false;
    }

    const result = await ClipboardAndShare.copyText(text);
    if (!result.ok) {
      this.emitEvent('mth-copy-error', { detail: { reason: result.method } });
      return false;
    }

    this.copied = true;
    this.setCustomState('copied', true);
    const announcement = this.copiedLabel || this.t('copied');
    LiveAnnouncer.announce(announcement, 'polite');
    this.emitEvent('mth-copy', { detail: { value: text, method: result.method } });

    this.clearResetTimer();
    const duration = Math.max(0, this.feedbackDuration);
    this.resetTimer = setTimeout(() => {
      this.copied = false;
      this.setCustomState('copied', false);
      this.resetTimer = null;
    }, duration);
    return true;
  }

  private handleClick = (): void => {
    void this.copy();
  };

  override render() {
    const idleLabel = this.label || this.t('copy');
    const activeLabel = this.copiedLabel || this.t('copied');
    const ariaLabel = this.copied ? activeLabel : idleLabel;

    return html`
      <button
        part="base"
        type="button"
        data-copied=${this.copied ? 'true' : 'false'}
        aria-label=${ariaLabel}
        ?disabled=${this.disabled}
        @click=${this.handleClick}
      >
        ${this.copied
          ? html`<slot name="copied">${activeLabel}</slot>`
          : html`<slot>${idleLabel}</slot>`}
      </button>
    `;
  }
}
