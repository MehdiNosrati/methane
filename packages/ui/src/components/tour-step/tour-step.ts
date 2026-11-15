import { UIElement, type PropertyValues } from '@methane-ui/core';
import type { Placement } from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { tourStepMessages } from './tour-step.messages.js';
import { tourStepStyles } from './tour-step.styles.js';

/**
 * `<mth-tour-step>`: declarative step definition for `<mth-tour>`.
 */
export class MthTourStep extends UIElement {
  static override messages = tourStepMessages;
  static override styles = tourStepStyles;

  @property({ type: String, attribute: 'step-id' })
  stepId = '';

  @property({ type: String })
  target = '';

  @property({ type: String })
  heading = '';

  @property({ type: String })
  placement: Placement = 'bottom';

  @property({ type: Boolean, reflect: true })
  active = false;

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('active')) {
      this.setCustomState('active', this.active);
      if (this.active) {
        this.emitEvent('mth-step-enter', {
          detail: { stepId: this.stepId || this.id || '' },
        });
      }
    }
  }

  protected override render() {
    return html`
      <div class="base" part="base" aria-label=${this.heading || this.t('stepLabel')}>
        ${this.heading ? html`<h3 class="heading" part="heading">${this.heading}</h3>` : nothing}
        <slot name="media"></slot>
        <div class="body" part="body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}
