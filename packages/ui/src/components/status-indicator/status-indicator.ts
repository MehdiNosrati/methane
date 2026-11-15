import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { statusIndicatorMessages } from './status-indicator.messages.js';
import { statusIndicatorStyles } from './status-indicator.styles.js';

export type StatusIndicatorValue =
  | 'online'
  | 'offline'
  | 'busy'
  | 'away'
  | 'error'
  | 'warning'
  | 'info'
  | 'neutral';

export type StatusIndicatorSize = 'sm' | 'md' | 'lg';

/**
 * `<mth-status-indicator>`: accessible presence/health dot with optional status label.
 */
export class MthStatusIndicator extends UIElement {
  static override messages = statusIndicatorMessages;
  static override styles = statusIndicatorStyles;

  @property({ type: String, reflect: true })
  status: StatusIndicatorValue = 'neutral';

  @property({ type: Boolean, reflect: true })
  pulse = false;

  @property({ type: String })
  label = '';

  @property({ type: String, reflect: true })
  size: StatusIndicatorSize = 'md';

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('pulse')) {
      this.setCustomState('pulse', this.pulse);
    }
  }

  private resolveDefaultLabel(): string {
    switch (this.status) {
      case 'online':
        return this.t('onlineLabel');
      case 'offline':
        return this.t('offlineLabel');
      case 'busy':
        return this.t('busyLabel');
      case 'away':
        return this.t('awayLabel');
      case 'error':
        return this.t('errorLabel');
      case 'warning':
        return this.t('warningLabel');
      case 'info':
        return this.t('infoLabel');
      default:
        return this.t('neutralLabel');
    }
  }

  protected override render() {
    const ariaLabel = this.label || this.resolveDefaultLabel();

    return html`
      <span class="base" part="base" role="status" aria-label=${ariaLabel}>
        <span class="dot" part="dot" aria-hidden="true"></span>
        <span class="label" part="label"><slot>${this.label}</slot></span>
      </span>
    `;
  }
}
