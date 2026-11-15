import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { carouselItemMessages } from './carousel-item.messages.js';
import { carouselItemStyles } from './carousel-item.styles.js';

/**
 * `<mth-carousel-item>`: accessible slide container for `<mth-carousel>`.
 */
export class MthCarouselItem extends UIElement {
  static override messages = carouselItemMessages;
  static override styles = carouselItemStyles;

  @property({ type: String })
  label = '';

  @property({ type: String })
  value = '';

  @property({ type: Boolean, reflect: true })
  active = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomStates();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (changed.has('active')) {
      this.syncCustomStates();
    }
  }

  private syncCustomStates(): void {
    this.setCustomState('active', this.active);
  }

  protected override render() {
    return html`
      <div
        class="base"
        part="base"
        role="group"
        aria-roledescription="slide"
        aria-label=${this.label || this.t('slideLabel')}
      >
        <slot></slot>
      </div>
    `;
  }
}
