import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { cardMessages } from './card.messages.js';
import { cardStyles } from './card.styles.js';

export type MthCardVariant = 'elevated' | 'outlined' | 'subtle';

/**
 * `<mth-card>`: surface container with `elevated`, `outlined`, and `subtle`
 * variants, optional `interactive` affordance, and `media`, `header`, default,
 * and `footer` slots.
 */
export class MthCard extends UIElement {
  static override messages = cardMessages;
  static override styles = cardStyles;

  @property({ type: String, reflect: true })
  variant: MthCardVariant = 'elevated';

  @property({ type: Boolean, reflect: true })
  interactive = false;

  @state()
  private hasMedia = false;

  @state()
  private hasHeader = false;

  @state()
  private hasFooter = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('interactive', this.interactive);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('interactive')) {
      this.setCustomState('interactive', this.interactive);
    }
  }

  private handleSlotPresence(section: 'media' | 'header' | 'footer', event: Event): void {
    const slot = event.target as HTMLSlotElement;
    const present = slot
      .assignedNodes({ flatten: true })
      .some((node) => node.nodeType === Node.ELEMENT_NODE || (node.textContent?.trim().length ?? 0) > 0);
    if (section === 'media') this.hasMedia = present;
    else if (section === 'header') this.hasHeader = present;
    else this.hasFooter = present;
  }

  override render() {
    return html`
      <div
        part="base"
        class="base"
        data-variant=${this.variant}
        data-interactive=${this.interactive ? 'true' : 'false'}
      >
        <div part="media" class="media" ?hidden=${!this.hasMedia}>
          <slot name="media" @slotchange=${(e: Event) => this.handleSlotPresence('media', e)}></slot>
        </div>
        <div part="header" class="header" ?hidden=${!this.hasHeader}>
          <slot name="header" @slotchange=${(e: Event) => this.handleSlotPresence('header', e)}></slot>
        </div>
        <div part="body" class="body">
          <slot></slot>
        </div>
        <div part="footer" class="footer" ?hidden=${!this.hasFooter}>
          <slot name="footer" @slotchange=${(e: Event) => this.handleSlotPresence('footer', e)}></slot>
        </div>
      </div>
    `;
  }
}
