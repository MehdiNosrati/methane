import { UIElement } from '@methane-ui/core';
import { html, svg } from 'lit';
import { property } from 'lit/decorators.js';
import { spinnerMessages } from './spinner.messages.js';
import { spinnerStyles } from './spinner.styles.js';

export type MthSpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * `<mth-spinner>`: accessible loading indicator with `role="status"`,
 * localized default label, and `prefers-reduced-motion` support.
 */
export class MthSpinner extends UIElement {
  static override messages = spinnerMessages;
  static override styles = spinnerStyles;

  @property({ type: String, reflect: true })
  size: MthSpinnerSize = 'md';

  @property({ type: String })
  label = '';

  override render() {
    const accessibleLabel = this.label.trim().length > 0 ? this.label : this.t('loading');

    return html`
      <span
        part="base"
        class="base"
        role="status"
        aria-label=${accessibleLabel}
        data-size=${this.size}
      >
        ${svg`<svg part="indicator" class="indicator" viewBox="0 0 24 24" aria-hidden="true">
          <circle class="track" cx="12" cy="12" r="9"></circle>
          <circle class="arc" cx="12" cy="12" r="9"></circle>
        </svg>`}
      </span>
    `;
  }
}
