import { UIElement, type PropertyValues } from '@methane-ui/core';
import { ClipboardAndShare, LiveAnnouncer } from '@methane-ui/primitives';
import { html, nothing, svg } from 'lit';
import { property, state } from 'lit/decorators.js';
import { keyValueMessages } from './key-value.messages.js';
import { keyValueStyles } from './key-value.styles.js';

export type MthKeyValueOrientation = 'horizontal' | 'vertical';

/**
 * `<mth-key-value>`: semantic description-list item (`<dl>`/`<dt>`/`<dd>`)
 * with optional clipboard copy and live announcement feedback.
 */
export class MthKeyValue extends UIElement {
  static override messages = keyValueMessages;
  static override styles = keyValueStyles;

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: String, reflect: true })
  orientation: MthKeyValueOrientation = 'horizontal';

  @property({ type: Boolean, reflect: true })
  copyable = false;

  @property({ type: Boolean, reflect: true })
  monospace = false;

  @state()
  private copied = false;

  @state()
  private slottedLabelText = '';

  @state()
  private slottedValueText = '';

  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.resetTimer !== null) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('monospace')) {
      this.syncStates();
    }
  }

  private syncStates(): void {
    this.setCustomState('copied', this.copied);
    this.setCustomState('monospace', this.monospace);
  }

  private readonly handleLabelSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.slottedLabelText = slot
      .assignedNodes({ flatten: true })
      .map((n) => n.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  private readonly handleValueSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement;
    this.slottedValueText = slot
      .assignedNodes({ flatten: true })
      .map((n) => n.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  private readonly handleCopyClick = async (): Promise<void> => {
    const copyText = this.value || this.slottedValueText;
    const result = await ClipboardAndShare.copyText(copyText);
    if (result.ok) {
      this.copied = true;
      this.setCustomState('copied', true);
      LiveAnnouncer.announce(this.t('copiedAnnouncement'));
      if (this.resetTimer !== null) {
        clearTimeout(this.resetTimer);
      }
      this.resetTimer = setTimeout(() => {
        this.copied = false;
        this.setCustomState('copied', false);
        this.resetTimer = null;
      }, 1500);
    }
    this.emitEvent('mth-copy', {
      detail: { value: copyText, ok: result.ok },
    });
  };

  override render() {
    const labelText = this.slottedLabelText || this.label.trim();
    const copyAria = this.copied
      ? this.t('copiedLabel')
      : labelText
        ? this.t('copyLabelNamed', { label: labelText })
        : this.t('copyLabel');

    return html`
      <dl part="base" class="base">
        <dt part="label" class="label">
          <slot name="label" @slotchange=${this.handleLabelSlotChange}>${this.label}</slot>
        </dt>
        <dd part="value" class="value-row">
          <span class="value-text">
            <slot @slotchange=${this.handleValueSlotChange}>${this.value}</slot>
          </span>
          <slot name="suffix"></slot>
          ${this.copyable
            ? html`
                <button
                  part="copy"
                  class="copy"
                  type="button"
                  aria-label=${copyAria}
                  @click=${this.handleCopyClick}
                >
                  ${svg`<svg class="copy-icon" viewBox="0 0 16 16" aria-hidden="true">
                    <rect x="5" y="5" width="8" height="9" rx="1"></rect>
                    <path d="M3 11V3a1 1 0 0 1 1-1h7"></path>
                  </svg>`}
                  <span>${this.copied ? this.t('copiedLabel') : nothing}</span>
                </button>
              `
            : nothing}
        </dd>
      </dl>
    `;
  }
}
