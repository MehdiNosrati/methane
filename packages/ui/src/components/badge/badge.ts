import { UIElement, type PropertyValues } from '@methane-ui/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { badgeMessages } from './badge.messages.js';
import { badgeStyles } from './badge.styles.js';

export type MthBadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type MthBadgeSize = 'sm' | 'md' | 'lg';

/**
 * `<mth-badge>`: status, count, or category indicator with `variant`, `size`, `pill`, and `dot` modes.
 */
export class MthBadge extends UIElement {
  static override messages = badgeMessages;
  static override styles = badgeStyles;

  @property({ type: String, reflect: true })
  variant: MthBadgeVariant = 'neutral';

  @property({ type: String, reflect: true })
  size: MthBadgeSize = 'md';

  @property({ type: Boolean, reflect: true })
  pill = false;

  @property({ type: Boolean, reflect: true })
  dot = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStates();
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('pill') || changedProperties.has('dot')) {
      this.syncStates();
    }
  }

  private syncStates(): void {
    this.setCustomState('pill', this.pill);
    this.setCustomState('dot', this.dot);
  }

  override render() {
    return html`
      <span
        part="base"
        class="base"
        data-variant=${this.variant}
        data-size=${this.size}
        data-pill=${this.pill ? 'true' : 'false'}
        data-dot=${this.dot ? 'true' : 'false'}
      >
        <span part="dot" class="dot-indicator" aria-hidden="true"></span>
        <span part="label" class="label" ?hidden=${this.dot}>
          <slot></slot>
        </span>
      </span>
    `;
  }
}
