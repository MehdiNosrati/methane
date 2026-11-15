import { UIElement, type PropertyValues } from '@methane/core';
import { SlotCollectionController } from '@methane/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { breadcrumbsMessages } from './breadcrumbs.messages.js';
import { breadcrumbsStyles } from './breadcrumbs.styles.js';

type BreadcrumbItemLike = HTMLElement & { separator?: string };

function isBreadcrumbItem(el: Element): el is BreadcrumbItemLike {
  return (
    el instanceof HTMLElement &&
    (el.tagName.toLowerCase() === 'mth-breadcrumb-item' || el.getAttribute('role') === 'listitem')
  );
}

/**
 * `<mth-breadcrumbs>`: `<nav>` breadcrumb landmark propagating separators across items.
 */
export class MthBreadcrumbs extends UIElement {
  static override messages = breadcrumbsMessages;
  static override styles = breadcrumbsStyles;

  @property({ type: String, reflect: true })
  separator = '/';

  @property({ type: String })
  label = '';

  private readonly slotCtrl: SlotCollectionController<BreadcrumbItemLike>;

  constructor() {
    super();
    this.slotCtrl = new SlotCollectionController<BreadcrumbItemLike>(this, {
      filter: isBreadcrumbItem,
      onItemsChange: () => {
        this.syncSeparators();
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSeparators();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('separator')) {
      this.syncSeparators();
    }
  }

  private syncSeparators(): void {
    for (const item of this.slotCtrl.slottedElements) {
      if (!item.hasAttribute('separator')) {
        item.separator = this.separator;
      }
    }
  }

  override render() {
    const ariaLabel = this.label.trim() || this.t('breadcrumbsLabel');
    return html`
      <nav part="base" aria-label=${ariaLabel}>
        <ol part="list" role="list">
          <slot></slot>
        </ol>
      </nav>
    `;
  }
}
