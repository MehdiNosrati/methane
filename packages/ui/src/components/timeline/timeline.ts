import { UIElement, type PropertyValues } from '@methane/core';
import { SlotCollectionController } from '@methane/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { timelineMessages } from './timeline.messages.js';
import { timelineStyles } from './timeline.styles.js';

export type MthTimelineOrientation = 'vertical' | 'horizontal';
export type MthTimelineAlign = 'start' | 'alternate' | 'end';

export interface TimelineItemData {
  readonly id?: string;
  readonly heading: string;
  readonly timestamp?: string;
  readonly description?: string;
  readonly variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  readonly active?: boolean;
}

function isTimelineItemElement(el: Element): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    (el.localName.endsWith('timeline-item') || el.getAttribute('role') === 'listitem')
  );
}

/**
 * `<mth-timeline>`: chronological milestone container using `SlotCollectionController`
 * to reconcile `<mth-timeline-item>` Light-DOM children and `.items` arrays.
 */
export class MthTimeline extends UIElement {
  static override messages = timelineMessages;
  static override styles = timelineStyles;

  @property({ type: String, reflect: true })
  orientation: MthTimelineOrientation = 'vertical';

  @property({ type: String, reflect: true })
  align: MthTimelineAlign = 'start';

  @property({ attribute: false })
  items: ReadonlyArray<TimelineItemData> | null = null;

  @property({ type: String })
  label = '';

  private readonly slotCtrl: SlotCollectionController<HTMLElement>;

  constructor() {
    super();
    this.slotCtrl = new SlotCollectionController<HTMLElement>(this, {
      filter: isTimelineItemElement,
      attributeFilter: ['heading', 'timestamp', 'variant'],
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('horizontal', this.orientation === 'horizontal');
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('orientation')) {
      this.setCustomState('horizontal', this.orientation === 'horizontal');
    }
  }

  getSlottedItems(): ReadonlyArray<HTMLElement> {
    return this.slotCtrl.slottedElements;
  }

  override render() {
    const ariaLabel = this.label.trim() || this.t('timelineLabel');
    const isUsingItems = this.items !== null;

    return html`
      <div
        part="base"
        class="base"
        role="list"
        aria-label=${ariaLabel}
        data-align=${this.align}
      >
        ${isUsingItems
          ? this.items!.length === 0
            ? html`<div part="empty" class="empty"><slot name="empty">${this.t('emptyText')}</slot></div>`
            : this.items!.map(
                (item) => html`
                  <div part="item" class="item" role="listitem" data-variant=${item.variant ?? 'neutral'}>
                    <div class="item-header">
                      <span class="item-heading">${item.heading}</span>
                      ${item.timestamp ? html`<span class="item-time">${item.timestamp}</span>` : nothing}
                    </div>
                    ${item.description ? html`<div class="item-body">${item.description}</div>` : nothing}
                  </div>
                `,
              )
          : html`<slot></slot>`}
      </div>
    `;
  }
}
