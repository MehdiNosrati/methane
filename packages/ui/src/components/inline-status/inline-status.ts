import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { inlineStatusMessages } from './inline-status.messages.js';
import { inlineStatusStyles } from './inline-status.styles.js';

export type InlineStatusVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'loading';
export type InlineStatusLiveMode = 'polite' | 'assertive' | 'off';

/**
 * `<mth-inline-status>`: compact live-region inline state readout.
 */
export class MthInlineStatus extends UIElement {
  static override messages = inlineStatusMessages;
  static override styles = inlineStatusStyles;

  @property({ type: String, reflect: true })
  variant: InlineStatusVariant = 'neutral';

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  live: InlineStatusLiveMode = 'polite';

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('variant')) {
      this.setCustomState('loading', this.variant === 'loading');
    }
  }

  private resolveDefaultLabel(): string {
    switch (this.variant) {
      case 'loading':
        return this.t('loadingLabel');
      case 'success':
        return this.t('successLabel');
      case 'warning':
        return this.t('warningLabel');
      case 'danger':
        return this.t('dangerLabel');
      case 'info':
        return this.t('infoLabel');
      default:
        return this.t('neutralLabel');
    }
  }

  protected override render() {
    const resolvedLabel = this.label || this.resolveDefaultLabel();

    return html`
      <span
        class="base"
        part="base"
        role=${this.live === 'off' ? 'status' : this.variant === 'danger' ? 'alert' : 'status'}
        aria-live=${this.live}
      >
        <span class="icon" part="icon" aria-hidden="true">
          <slot name="icon">
            ${this.variant === 'loading'
              ? html`<span class="spinner"></span>`
              : html`<span class="dot"></span>`}
          </slot>
        </span>
        <span class="label" part="label"><slot>${resolvedLabel}</slot></span>
      </span>
    `;
  }
}
