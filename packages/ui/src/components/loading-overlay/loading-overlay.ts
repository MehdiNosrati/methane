import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { loadingOverlayMessages } from './loading-overlay.messages.js';
import { loadingOverlayStyles } from './loading-overlay.styles.js';

/**
 * `<mth-loading-overlay>`: loading scrim over a container or full viewport.
 */
export class MthLoadingOverlay extends UIElement {
  static override messages = loadingOverlayMessages;
  static override styles = loadingOverlayStyles;

  @property({ type: Boolean, reflect: true })
  active = false;

  @property({ type: Boolean, reflect: true })
  fullscreen = false;

  @property({ type: String })
  label = '';

  @property({ type: Boolean, reflect: true })
  blurred = false;

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('active')) {
      this.setCustomState('active', this.active);
      if (changedProperties.get('active') !== undefined) {
        this.emitEvent('mth-active-change', { detail: { active: this.active } });
      }
    }
    if (changedProperties.has('fullscreen')) {
      this.setCustomState('fullscreen', this.fullscreen);
    }
  }

  protected override render() {
    const resolvedLabel = this.label || this.t('loadingLabel');

    return html`
      <div class="base" part="base">
        <div class="content" part="content" aria-busy=${String(this.active)}>
          <slot></slot>
        </div>
        <div
          class="backdrop"
          part="backdrop"
          role="status"
          aria-live="polite"
          aria-label=${resolvedLabel}
          ?hidden=${!this.active}
        >
          <slot name="spinner">
            <span class="spinner" part="spinner" aria-hidden="true"></span>
          </slot>
          <span class="label" part="label">${resolvedLabel}</span>
        </div>
      </div>
    `;
  }
}
