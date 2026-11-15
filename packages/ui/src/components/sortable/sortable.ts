import { UIElement, type PropertyValues, html, nothing, property, query } from '@methane/core';
import {
  DragSortController,
  RovingFocusController,
  SlotCollectionController,
} from '@methane/primitives';
import { sortableMessages } from './sortable.messages.js';
import { sortableStyles } from './sortable.styles.js';

export type MthSortableOrientation = 'vertical' | 'horizontal';

export interface MthSortableItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * Accessible drag-and-drop and keyboard-reorderable list component.
 */
export class MthSortable extends UIElement {
  static override shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true,
  };

  static override styles = sortableStyles;
  static override messages = sortableMessages;

  @property({ type: String, reflect: true })
  orientation: MthSortableOrientation = 'vertical';

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: String })
  label = '';

  @property({ attribute: false })
  items: ReadonlyArray<MthSortableItem> = [];

  @query('[part="base"]')
  private baseEl!: HTMLElement | null;

  private readonly slotCtrl: SlotCollectionController<HTMLElement>;
  private readonly rovingCtrl: RovingFocusController;
  private readonly dragSortCtrl: DragSortController<HTMLElement>;

  constructor() {
    super();
    this.slotCtrl = new SlotCollectionController<HTMLElement>(this, {
      selector: '*',
      onItemsChange: () => {
        if (Boolean(this.shadowRoot) && !this.hasUpdated) return;
        this.rovingCtrl.syncTabIndices();
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      getItems: () => this.getItemElements(),
      orientation: 'vertical',
      loop: true,
      dir: this.resolvedDir,
    });

    this.dragSortCtrl = new DragSortController<HTMLElement>(this, {
      container: () => this.baseEl,
      getItems: () => this.getItemElements(),
      orientation: 'vertical',
      dir: 'auto',
      messages: sortableMessages,
      onReorder: ({ fromIndex, toIndex, item }) => {
        this.applyReorderedNodes(fromIndex, toIndex, item);
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncControllers();
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (changed.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    if (changed.has('orientation') || changed.has('dir') || changed.has('items')) {
      this.syncControllers();
    }
    this.rovingCtrl.syncTabIndices();
  }

  /**
   * Programmatically moves an item from `fromIndex` to `toIndex`.
   */
  reorder(fromIndex: number, toIndex: number): void {
    if (this.disabled) return;
    this.dragSortCtrl.reorder(fromIndex, toIndex);
  }

  private syncControllers(): void {
    this.rovingCtrl.updateOptions({
      orientation: this.orientation,
      dir: this.resolvedDir,
    });
  }

  private getItemElements(): HTMLElement[] {
    if (this.items.length > 0 && this.baseEl) {
      return Array.from(this.baseEl.querySelectorAll<HTMLElement>('[part="item"]')).filter(
        (el) => el.getAttribute('aria-disabled') !== 'true',
      );
    }
    return this.slotCtrl.slottedElements.filter(
      (el) => el.getAttribute('aria-disabled') !== 'true',
    );
  }

  private applyReorderedNodes(fromIndex: number, toIndex: number, item: HTMLElement): void {
    if (this.items.length > 0) {
      const next = [...this.items];
      const [moved] = next.splice(fromIndex, 1);
      if (moved) {
        next.splice(toIndex, 0, moved);
        this.items = next;
      }
      return;
    }

    const currentSlotted = [...this.slotCtrl.slottedElements];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= currentSlotted.length) return;
    const reference = currentSlotted[toIndex];
    if (reference && reference !== item) {
      if (fromIndex < toIndex) {
        reference.after(item);
      } else {
        reference.before(item);
      }
    }
  }

  override render() {
    return html`
      <div part="base" role="list" aria-label=${this.label || nothing}>
        ${this.items.map(
          (item) => html`
            <div
              part="item"
              role="listitem"
              data-id=${item.id}
              aria-disabled=${item.disabled ? 'true' : 'false'}
            >
              ${item.label}
            </div>
          `,
        )}
        <slot></slot>
      </div>
    `;
  }
}
