import { UIElement, type PropertyValues } from '@methane/core';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { timelineItemMessages } from './timeline-item.messages.js';
import { timelineItemStyles } from './timeline-item.styles.js';

export type MthTimelineItemVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

/**
 * `<mth-timeline-item>`: chronological entry inside `<mth-timeline>`.
 */
export class MthTimelineItem extends UIElement {
  static override messages = timelineItemMessages;
  static override styles = timelineItemStyles;

  @property({ type: String })
  heading = '';

  @property({ type: String })
  timestamp = '';

  @property({ type: String, reflect: true })
  variant: MthTimelineItemVariant = 'neutral';

  @property({ type: Boolean, reflect: true })
  active = false;

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.internals) {
      this.internals.role = 'listitem';
    }
    const reflectedRole = (this as HTMLElement & { role?: string | null }).role;
    if (reflectedRole !== 'listitem' && !this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
    this.setCustomState('active', this.active);
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('active')) {
      this.setCustomState('active', this.active);
    }
  }

  override render() {
    return html`
      <div part="base" class="base" data-variant=${this.variant}>
        <div part="rail" class="rail" aria-hidden="true">
          <span part="dot" class="dot">
            <slot name="dot"></slot>
          </span>
          <span part="connector" class="connector"></span>
        </div>
        <div part="content" class="content">
          <div class="header">
            <div part="heading" class="heading">
              <slot name="heading">${this.heading}</slot>
            </div>
            <div part="timestamp" class="timestamp">
              <slot name="timestamp">${this.timestamp}</slot>
            </div>
          </div>
          <div part="body" class="body">
            <slot></slot>
          </div>
          <div part="meta" class="meta">
            <slot name="meta"></slot>
          </div>
        </div>
      </div>
    `;
  }
}
