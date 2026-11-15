import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { bannerMessages } from './banner.messages.js';
import { bannerStyles } from './banner.styles.js';

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

/**
 * `<mth-banner>`: full-width announcement banner with semantic variants,
 * sticky option, and cancelable dismissal.
 */
export class MthBanner extends UIElement {
  static override messages = bannerMessages;
  static override styles = bannerStyles;

  @property({ type: String, reflect: true })
  variant: BannerVariant = 'info';

  @property({ type: Boolean, reflect: true })
  dismissible = false;

  @property({ type: Boolean, reflect: true })
  dismissed = false;

  @property({ type: Boolean, reflect: true })
  sticky = false;

  @property({ type: String })
  heading = '';

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('dismissed')) {
      this.setCustomState('dismissed', this.dismissed);
    }
    if (changedProperties.has('sticky')) {
      this.setCustomState('sticky', this.sticky);
    }
  }

  public dismiss(): boolean {
    if (this.dismissed) {
      return true;
    }
    const allowed = this.emitEvent('mth-dismiss', { cancelable: true });
    if (allowed) {
      this.dismissed = true;
      this.setCustomState('dismissed', true);
    }
    return allowed;
  }

  protected override render() {
    const roleAttr = this.variant === 'danger' || this.variant === 'warning' ? 'alert' : 'region';

    return html`
      <div
        class="base"
        part="base"
        role=${roleAttr}
        aria-label=${this.heading || this.t('regionLabel')}
      >
        <div class="leading">
          <span class="icon" part="icon"><slot name="icon"></slot></span>
          <div class="content" part="content">
            ${this.heading ? html`<span class="heading" part="heading">${this.heading}</span>` : nothing}
            <slot></slot>
          </div>
        </div>
        <div class="trailing" part="actions">
          <slot name="actions"></slot>
          ${this.dismissible
            ? html`
                <button
                  type="button"
                  class="close-btn"
                  part="close-button"
                  aria-label=${this.t('dismissLabel')}
                  @click=${() => this.dismiss()}
                >
                  ✕
                </button>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}
