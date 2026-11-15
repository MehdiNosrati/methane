import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  RovingFocusController,
  SelectionController,
  SlotCollectionController,
} from '@methane-ui/primitives';
import { html } from 'lit';
import { property } from 'lit/decorators.js';
import { accordionMessages } from './accordion.messages.js';
import { accordionStyles } from './accordion.styles.js';

interface AccordionItemElement extends HTMLElement {
  value?: string;
  expanded?: boolean;
  disabled?: boolean;
  triggerElement?: HTMLButtonElement | null;
  updateComplete?: Promise<boolean>;
}

/**
 * `<mth-accordion>`: coordinates `<mth-accordion-item>` expansion and keyboard
 * trigger navigation via `SlotCollectionController`, `SelectionController`,
 * and `RovingFocusController`.
 */
export class MthAccordion extends UIElement {
  static override messages = accordionMessages;
  static override styles = accordionStyles;

  @property({ type: Boolean, reflect: true })
  multiple = false;

  @property({ type: Boolean, reflect: true })
  collapsible = true;

  @property({ type: String })
  value = '';

  private readonly slotCtrl: SlotCollectionController<AccordionItemElement>;
  private readonly selectionCtrl: SelectionController<string>;
  private readonly rovingCtrl: RovingFocusController;

  private syncingInternal = false;

  constructor() {
    super();

    this.selectionCtrl = new SelectionController<string>(this, {
      mode: 'single',
      allowEmpty: true,
    });

    this.slotCtrl = new SlotCollectionController<AccordionItemElement>(this, {
      filter: (el): el is AccordionItemElement =>
        el instanceof HTMLElement && el.localName.endsWith('accordion-item'),
      attributeFilter: ['value', 'disabled'],
      onItemsChange: () => {
        this.syncFromItems();
      },
    });

    this.rovingCtrl = new RovingFocusController(this, {
      orientation: 'vertical',
      loop: true,
      getItems: () => this.getTriggerButtons(),
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.setCustomState('multiple', this.multiple);
    this.syncFromItems();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('multiple')) {
      this.setCustomState('multiple', this.multiple);
      this.selectionCtrl.mode = this.multiple ? 'multiple' : 'single';
    }
    if (changedProperties.has('value') && !this.syncingInternal) {
      this.applyValueToSelection(this.value);
    }
    if (changedProperties.has('collapsible') || changedProperties.has('multiple')) {
      this.syncFromItems();
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (changedProperties.has('value') && !this.syncingInternal) {
      this.syncExpandedToItems();
    }
    this.rovingCtrl.syncTabIndices();
  }

  private getItemKey(item: AccordionItemElement, index: number): string {
    const raw = item.value || item.getAttribute('value') || item.id;
    return raw && raw.length > 0 ? raw : `item-${index}`;
  }

  private getTriggerButtons(): ReadonlyArray<HTMLElement> {
    const triggers: HTMLElement[] = [];
    for (const item of this.slotCtrl.items) {
      const btn =
        item.triggerElement ??
        item.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]') ??
        null;
      if (btn) {
        triggers.push(btn);
      }
    }
    return triggers;
  }

  private applyValueToSelection(rawValue: string): void {
    const parsed = this.multiple
      ? rawValue
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0)
      : rawValue.length > 0
        ? [rawValue]
        : [];
    this.selectionCtrl.setSelection(parsed);
  }

  private syncFromItems(): void {
    const items = this.slotCtrl.items;
    const entries = items.map((item, idx) => ({
      value: this.getItemKey(item, idx),
      disabled: Boolean(item.disabled || item.hasAttribute('disabled')),
    }));
    this.selectionCtrl.setItems(entries);

    if (this.value.length > 0) {
      this.applyValueToSelection(this.value);
    } else if (this.selectionCtrl.selectedValues.length === 0) {
      const initiallyExpanded = items
        .map((item, idx) => ({ item, key: this.getItemKey(item, idx) }))
        .filter(({ item }) => Boolean(item.expanded || item.hasAttribute('expanded')))
        .map(({ key }) => key);
      if (initiallyExpanded.length > 0) {
        this.selectionCtrl.setSelection(initiallyExpanded);
      } else if (!this.collapsible) {
        const firstEnabled = entries.find((e) => !e.disabled);
        if (firstEnabled) {
          this.selectionCtrl.setSelection([firstEnabled.value]);
        }
      }
    }

    this.syncExpandedToItems();
    this.syncTriggerIndices();
  }

  private syncExpandedToItems(): void {
    const items = this.slotCtrl.items;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]!;
      const key = this.getItemKey(item, i);
      const shouldExpand = this.selectionCtrl.isSelected(key);
      if (Boolean(item.expanded) !== shouldExpand) {
        item.expanded = shouldExpand;
      }
    }
  }

  private syncTriggerIndices(): void {
    const items = this.slotCtrl.items;
    const missingTriggers = items.some(
      (item) => !item.triggerElement && !item.shadowRoot?.querySelector('[part="trigger"]'),
    );
    this.rovingCtrl.syncTabIndices();
    if (missingTriggers && items.length > 0) {
      void Promise.all(items.map((item) => item.updateComplete ?? Promise.resolve(true))).then(() => {
        if (this.isConnected) {
          this.rovingCtrl.syncTabIndices();
        }
      });
    }
  }

  private readonly handleItemToggle = (event: Event): void => {
    const items = this.slotCtrl.items;
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const index = items.findIndex((item) => item === event.target || path.includes(item));
    if (index === -1) return;

    const item = items[index]!;
    if (item.disabled || item.hasAttribute('disabled')) return;

    event.preventDefault();
    const key = this.getItemKey(item, index);
    const isCurrentlySelected = this.selectionCtrl.isSelected(key);

    if (!this.collapsible && isCurrentlySelected) {
      if (!this.multiple || this.selectionCtrl.selectedValues.length <= 1) {
        return;
      }
    }

    this.selectionCtrl.toggle(key);
    this.syncExpandedToItems();

    const selected = this.selectionCtrl.selectedValues;
    const nextValue = this.multiple ? selected.join(',') : (selected[0] ?? '');
    this.syncingInternal = true;
    this.value = nextValue;
    this.syncingInternal = false;

    this.emitEvent('mth-change', {
      detail: { value: nextValue },
    });
  };

  override render() {
    return html`
      <div part="base" class="base" @mth-toggle=${this.handleItemToggle}>
        <slot></slot>
      </div>
    `;
  }
}
