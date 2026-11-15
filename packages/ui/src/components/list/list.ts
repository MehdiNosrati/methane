import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  RovingFocusController,
  SelectionController,
  SlotCollectionController,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { listMessages } from './list.messages.js';
import { listStyles } from './list.styles.js';

export type MthListSelectionMode = 'none' | 'single' | 'multiple';

export interface ListItemData {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

type ListItemLikeElement = HTMLElement & {
  value?: string;
  selected?: boolean;
  disabled?: boolean;
  interactive?: boolean;
};

function isListItemElement(el: Element): el is ListItemLikeElement {
  const role = el.getAttribute('role');
  return (
    el instanceof HTMLElement &&
    (el.localName.endsWith('list-item') || role === 'listitem' || role === 'option')
  );
}

function getItemValue(el: ListItemLikeElement, index: number): string {
  const val = el.value || el.getAttribute('value') || el.id;
  return val && val.length > 0 ? val : `item-${index}`;
}

function isItemDisabled(el: HTMLElement): boolean {
  return (
    el.hasAttribute('disabled') ||
    el.getAttribute('aria-disabled') === 'true' ||
    (el as ListItemLikeElement).disabled === true
  );
}

/**
 * `<mth-list>`: vertical list container uniting `<mth-list-item>` Light-DOM children
 * and `.items` arrays via `SlotCollectionController`, `RovingFocusController`, and
 * `SelectionController`.
 */
export class MthList extends UIElement {
  static override messages = listMessages;
  static override styles = listStyles;

  @property({ type: String, attribute: 'selection-mode', reflect: true })
  selectionMode: MthListSelectionMode = 'none';

  @property({ type: String, reflect: true })
  value = '';

  @property({ attribute: false })
  values: ReadonlyArray<string> = [];

  @property({ attribute: false })
  items: ReadonlyArray<ListItemData> | null = null;

  @property({ type: Boolean, reflect: true })
  dividers = false;

  @property({ type: Boolean, reflect: true })
  dense = false;

  @property({ type: String })
  label = '';

  private readonly slotCtrl: SlotCollectionController<ListItemLikeElement>;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;
  private suppressingSync = false;

  constructor() {
    super();

    this.slotCtrl = new SlotCollectionController<ListItemLikeElement>(this, {
      filter: isListItemElement,
      attributeFilter: ['value', 'disabled'],
      onItemsChange: () => {
        this.syncSelectionItems();
      },
    });

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: true,
      onChange: (selected) => {
        if (this.suppressingSync) return;
        this.suppressingSync = true;
        this.values = [...selected];
        this.value = selected[0] ?? '';
        this.suppressingSync = false;
        this.syncSlottedSelectedState();
        this.emitEvent('mth-change', {
          detail: { value: this.value, values: this.values },
        });
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () => this.getItems(),
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncCustomStates();
    this.syncSelectionItems();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (
      changedProperties.has('dividers') ||
      changedProperties.has('dense') ||
      changedProperties.has('selectionMode')
    ) {
      this.syncCustomStates();
    }

    if (changedProperties.has('selectionMode')) {
      this.selectionCtrl.mode = this.selectionMode === 'multiple' ? 'multiple' : 'single';
    }

    if (changedProperties.has('items')) {
      this.syncSelectionItems();
    }

    if (changedProperties.has('values') && !this.suppressingSync) {
      this.suppressingSync = true;
      this.selectionCtrl.setSelection(this.values);
      this.value = this.values[0] ?? '';
      this.suppressingSync = false;
    } else if (changedProperties.has('value') && !this.suppressingSync) {
      this.suppressingSync = true;
      const next = this.value ? [this.value] : [];
      this.selectionCtrl.setSelection(next);
      this.values = next;
      this.suppressingSync = false;
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('value') ||
      changedProperties.has('values') ||
      changedProperties.has('selectionMode')
    ) {
      this.syncSlottedSelectedState();
    }
    this.rovingCtrl.syncTabIndices();
  }

  getItems(): HTMLElement[] {
    if (this.items !== null) {
      return Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[part="item"]') ?? []);
    }
    return [...this.slotCtrl.slottedElements];
  }

  private syncCustomStates(): void {
    this.setCustomState('dividers', this.dividers);
    this.setCustomState('dense', this.dense);
    this.setCustomState('selectable', this.selectionMode !== 'none');
  }

  private syncSelectionItems(): void {
    if (this.items !== null) {
      this.selectionCtrl.setItems(
        this.items.map((item) => ({
          value: item.value,
          ...(item.disabled !== undefined ? { disabled: item.disabled } : {}),
        })),
      );
      return;
    }
    const slotted = this.slotCtrl.slottedElements;
    this.selectionCtrl.setItems(
      slotted.map((el, idx) => ({
        value: getItemValue(el, idx),
        disabled: isItemDisabled(el),
      })),
    );
    this.syncSlottedSelectedState();
  }

  private syncSlottedSelectedState(): void {
    if (this.items !== null) return;
    const isHydrating = !this.hasUpdated && Boolean(this.shadowRoot?.childNodes.length);
    if (isHydrating) return;

    const isSelectable = this.selectionMode !== 'none';
    const targetRole = isSelectable ? 'option' : 'listitem';
    const slotted = this.slotCtrl.slottedElements;
    for (let i = 0; i < slotted.length; i += 1) {
      const el = slotted[i]!;
      const key = getItemValue(el, i);
      const isSelected = isSelectable && this.selectionCtrl.isSelected(key);
      if (el.getAttribute('role') !== targetRole) {
        el.setAttribute('role', targetRole);
      }
      if (isSelectable) {
        const expectedAriaSelected = isSelected ? 'true' : 'false';
        if (el.getAttribute('aria-selected') !== expectedAriaSelected) {
          el.setAttribute('aria-selected', expectedAriaSelected);
        }
      } else if (el.hasAttribute('aria-selected')) {
        el.removeAttribute('aria-selected');
      }
      if (el.selected !== isSelected) {
        el.selected = isSelected;
      }
      if (isSelectable && el.interactive === false) {
        el.interactive = true;
      }
    }
  }

  private activateItem(val: string, disabled: boolean, index: number, shiftKey = false): void {
    if (disabled) return;
    this.rovingCtrl.setActiveIndex(index, false);
    this.emitEvent('mth-action', { detail: { value: val } });
    if (this.selectionMode === 'single') {
      this.selectionCtrl.select(val, { toggle: false });
    } else if (this.selectionMode === 'multiple') {
      this.selectionCtrl.select(val, { toggle: true, range: shiftKey, additive: true });
    }
  }

  private readonly handleSlotClick = (event: MouseEvent): void => {
    if (this.items !== null) return;
    const slotted = this.slotCtrl.slottedElements;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const idx = slotted.findIndex(
      (item) => item === event.target || path.includes(item) || item.contains(event.target as Node),
    );
    if (idx === -1) return;
    const el = slotted[idx]!;
    this.activateItem(getItemValue(el, idx), isItemDisabled(el), idx, event.shiftKey);
  };

  private readonly handleSlotKeyDown = (event: KeyboardEvent): void => {
    if (this.items !== null) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const slotted = this.slotCtrl.slottedElements;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const idx = slotted.findIndex(
      (item) => item === event.target || path.includes(item) || item.contains(event.target as Node),
    );
    if (idx === -1) return;
    event.preventDefault();
    const el = slotted[idx]!;
    this.activateItem(getItemValue(el, idx), isItemDisabled(el), idx, event.shiftKey);
  };

  private readonly handleRowKeyDown = (
    event: KeyboardEvent,
    item: ListItemData,
    index: number,
  ): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.activateItem(item.value, Boolean(item.disabled), index, event.shiftKey);
  };

  override render() {
    const ariaLabel = this.label.trim() || this.t('listLabel');
    const role = this.selectionMode === 'none' ? 'list' : 'listbox';
    const isUsingItemsProp = this.items !== null;
    const isEmpty = isUsingItemsProp ? this.items!.length === 0 : false;

    return html`
      <div
        part="base"
        class="base"
        role=${role}
        aria-label=${ariaLabel}
        aria-multiselectable=${this.selectionMode === 'multiple' ? 'true' : nothing}
        @click=${this.handleSlotClick}
        @keydown=${this.handleSlotKeyDown}
      >
        ${isUsingItemsProp
          ? isEmpty
            ? html`<div part="empty" class="empty"><slot name="empty">${this.t('emptyText')}</slot></div>`
            : this.items!.map((item, idx) => {
                const selected =
                  this.selectionMode !== 'none' && this.selectionCtrl.isSelected(item.value);
                return html`
                  <div
                    part="item"
                    class="item-row"
                    role=${this.selectionMode === 'none' ? 'listitem' : 'option'}
                    aria-selected=${this.selectionMode === 'none' ? nothing : selected ? 'true' : 'false'}
                    aria-disabled=${item.disabled ? 'true' : nothing}
                    @click=${(e: MouseEvent) =>
                      this.activateItem(item.value, Boolean(item.disabled), idx, e.shiftKey)}
                    @keydown=${(e: KeyboardEvent) => this.handleRowKeyDown(e, item, idx)}
                  >
                    <div>
                      <div class="item-title">${item.label}</div>
                      ${item.description
                        ? html`<div class="item-desc">${item.description}</div>`
                        : nothing}
                    </div>
                  </div>
                `;
              })
          : html`<slot></slot>`}
      </div>
    `;
  }
}
