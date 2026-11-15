import { UIElement, type PropertyValues } from '@methane/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { networkStatusMessages } from './network-status.messages.js';
import { networkStatusStyles } from './network-status.styles.js';

/**
 * `<mth-network-status>`: reactive connectivity indicator listening idempotently
 * to `online`/`offline` events.
 */
export class MthNetworkStatus extends UIElement {
  static override messages = networkStatusMessages;
  static override styles = networkStatusStyles;

  @property({ type: Boolean, reflect: true })
  online = true;

  @property({ type: Boolean, attribute: 'show-when-online', reflect: true })
  showWhenOnline = false;

  @property({ type: String, attribute: 'offline-label' })
  offlineLabel = '';

  @property({ type: String, attribute: 'online-label' })
  onlineLabel = '';

  @property({ type: Boolean, reflect: true })
  retryable = true;

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('online', this.handleWindowOnline);
      window.addEventListener('offline', this.handleWindowOffline);
    }
  }

  override disconnectedCallback(): void {
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('online', this.handleWindowOnline);
      window.removeEventListener('offline', this.handleWindowOffline);
    }
    super.disconnectedCallback();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('online')) {
      this.setCustomState('online', this.online);
      this.setCustomState('offline', !this.online);
      if (changedProperties.get('online') !== undefined) {
        this.emitEvent('mth-status-change', { detail: { online: this.online } });
      }
    }
  }

  public retry(): void {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      this.online = navigator.onLine;
    }
    this.emitEvent('mth-retry');
  }

  private readonly handleWindowOnline = (): void => {
    this.online = true;
  };

  private readonly handleWindowOffline = (): void => {
    this.online = false;
  };

  protected override render() {
    const visible = !this.online || this.showWhenOnline;
    const message = this.online
      ? this.onlineLabel || this.t('onlineLabel')
      : this.offlineLabel || this.t('offlineLabel');

    return html`
      <div
        class="base"
        part="base"
        role=${this.online ? 'status' : 'alert'}
        aria-live="polite"
        ?hidden=${!visible}
      >
        <div class="leading">
          <span class="dot" part="dot" aria-hidden="true"></span>
          <span class="message" part="message"><slot>${message}</slot></span>
        </div>
        <div class="actions">
          <slot name="actions"></slot>
          ${!this.online && this.retryable
            ? html`
                <button
                  type="button"
                  class="retry-btn"
                  part="retry-button"
                  @click=${() => this.retry()}
                >
                  ${this.t('retryLabel')}
                </button>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}
