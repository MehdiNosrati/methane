import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface SlotCollectionControllerOptions<T extends Element = HTMLElement, D = T> {
  slotName?: string;
  selector?: string;
  filter?: (el: Element) => el is T;
  attributeFilter?: ReadonlyArray<string>;
  observeSubtree?: boolean;
  onItemsChange?: (items: ReadonlyArray<D>) => void;
}

/**
 * Unifies declarative Light-DOM slotted children (including streaming insertion via
 * MutationObserver + `slotchange`) with imperative JS array property assignments.
 */
export class SlotCollectionController<T extends Element = HTMLElement, D = T>
  implements ReactiveController
{
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly options: SlotCollectionControllerOptions<T, D>;
  private slotEl: HTMLSlotElement | null = null;
  private observer: MutationObserver | null = null;
  private _slottedItems: Array<T> = [];
  private _propertyItems: ReadonlyArray<D> | null = null;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: SlotCollectionControllerOptions<T, D> = {},
  ) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  get mode(): 'property' | 'slot' {
    return this._propertyItems !== null ? 'property' : 'slot';
  }

  get slottedElements(): ReadonlyArray<T> {
    return this._slottedItems;
  }

  get items(): ReadonlyArray<D> {
    if (this._propertyItems !== null) {
      return this._propertyItems;
    }
    return this._slottedItems as unknown as ReadonlyArray<D>;
  }

  setPropertyItems(items: ReadonlyArray<D> | null): void {
    this._propertyItems = items;
    this.options.onItemsChange?.(this.items);
    this.host.requestUpdate();
  }

  attachSlot(slot: HTMLSlotElement | null): void {
    if (this.slotEl === slot) return;
    if (this.slotEl) {
      this.slotEl.removeEventListener('slotchange', this.handleSlotChange);
    }
    this.slotEl = slot;
    if (slot) {
      slot.addEventListener('slotchange', this.handleSlotChange);
      this.refresh();
    }
  }

  hostConnected(): void {
    this.startObserver();
    this.refresh();
  }

  hostUpdated(): void {
    if (!this.slotEl) {
      const root = this.host.shadowRoot;
      if (root) {
        const selector = this.options.slotName
          ? `slot[name="${this.options.slotName}"]`
          : 'slot:not([name])';
        const candidate = root.querySelector<HTMLSlotElement>(selector);
        if (candidate) {
          this.attachSlot(candidate);
        }
      }
    }
  }

  hostDisconnected(): void {
    if (this.slotEl) {
      this.slotEl.removeEventListener('slotchange', this.handleSlotChange);
      this.slotEl = null;
    }
    this.observer?.disconnect();
    this.observer = null;
  }

  refresh(): void {
    const next = this.collectSlotted();
    if (!arraysShallowEqual(this._slottedItems, next)) {
      this._slottedItems = next;
      if (this._propertyItems === null) {
        this.options.onItemsChange?.(this.items);
      }
      this.host.requestUpdate();
    }
  }

  private collectSlotted(): Array<T> {
    const raw: Element[] = this.slotEl
      ? this.slotEl.assignedElements({ flatten: true })
      : Array.from(this.host.children).filter((child) => {
          if (!this.options.slotName) {
            return !child.hasAttribute('slot');
          }
          return child.getAttribute('slot') === this.options.slotName;
        });

    const out: Array<T> = [];
    for (const el of raw) {
      if (this.options.selector && !el.matches(this.options.selector)) continue;
      if (this.options.filter && !this.options.filter(el)) continue;
      out.push(el as T);
    }
    return out;
  }

  private startObserver(): void {
    if (this.observer || typeof MutationObserver === 'undefined') return;
    this.observer = new MutationObserver(() => {
      const next = this.collectSlotted();
      this._slottedItems = next;
      if (this._propertyItems === null) {
        this.options.onItemsChange?.(this.items);
      }
      this.host.requestUpdate();
    });

    const init: MutationObserverInit = {
      childList: true,
      subtree: this.options.observeSubtree ?? false,
    };
    if (this.options.attributeFilter && this.options.attributeFilter.length > 0) {
      init.attributes = true;
      init.attributeFilter = [...this.options.attributeFilter];
    }
    this.observer.observe(this.host, init);
  }

  private readonly handleSlotChange = (): void => {
    this.refresh();
  };
}

function arraysShallowEqual<T>(a: ReadonlyArray<T>, b: ReadonlyArray<T>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
