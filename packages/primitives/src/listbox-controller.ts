import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type ListboxFocusMode = 'activedescendant' | 'roving';

export interface ListboxOptionItem {
  readonly id: string;
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly group?: string;
  readonly element?: HTMLElement;
}

export interface ListboxControllerOptions {
  focusMode?: ListboxFocusMode;
  multiple?: boolean;
  loop?: boolean;
  typeaheadTimeoutMs?: number;
  getListboxElement?: () => HTMLElement | null;
  getOptionElements?: () => ReadonlyArray<HTMLElement>;
  onActiveChange?: (option: ListboxOptionItem | null, index: number) => void;
  onSelectionChange?: (selectedValues: ReadonlyArray<string>) => void;
}

let optionIdCounter = 0;

/**
 * Headless APG Listbox controller supporting active-descendant or roving-focus mode,
 * single/multi selection, disabled skipping, and timed character-buffer typeahead.
 */
export class ListboxController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private options: ListboxControllerOptions;
  private items: Array<ListboxOptionItem> = [];
  private _activeIndex = -1;
  private _selectedValues = new Set<string>();
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private listenerTarget: HTMLElement | null = null;

  constructor(host: ReactiveControllerHost & HTMLElement, options: ListboxControllerOptions = {}) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  get focusMode(): ListboxFocusMode {
    return this.options.focusMode ?? 'activedescendant';
  }

  get activeIndex(): number {
    return this._activeIndex;
  }

  get activeOption(): ListboxOptionItem | null {
    return this.items[this._activeIndex] ?? null;
  }

  get selectedValues(): ReadonlyArray<string> {
    return Array.from(this._selectedValues);
  }

  get allOptions(): ReadonlyArray<ListboxOptionItem> {
    return this.items;
  }

  hostConnected(): void {
    this.attachKeyListener();
    this.syncFromDomIfNeeded();
    this.syncAriaAttributes();
  }

  hostUpdated(): void {
    this.attachKeyListener();
    this.syncFromDomIfNeeded();
    this.syncAriaAttributes();
  }

  hostDisconnected(): void {
    this.detachKeyListener();
    this.clearTypeahead();
  }

  setOptions(items: ReadonlyArray<ListboxOptionItem>): void {
    this.items = items.map((item) => ({
      ...item,
      id: item.id || `mth-opt-${++optionIdCounter}`,
    }));
    if (this._activeIndex >= this.items.length) {
      this._activeIndex = -1;
    }
    this.syncAriaAttributes();
    this.host.requestUpdate();
  }

  setSelectedValues(values: ReadonlyArray<string>): void {
    this._selectedValues = new Set(values);
    this.syncAriaAttributes();
    this.host.requestUpdate();
  }

  setActiveIndex(index: number): void {
    const target = this.items[index];
    if (!target || target.disabled) return;
    this._activeIndex = index;
    this.syncAriaAttributes();
    if (this.focusMode === 'roving' && target.element) {
      target.element.focus();
    }
    this.options.onActiveChange?.(target, index);
    this.host.requestUpdate();
  }

  selectActive(): void {
    const active = this.activeOption;
    if (!active || active.disabled) return;
    this.selectValue(active.value);
  }

  selectValue(value: string): void {
    const entry = this.items.find((o) => o.value === value);
    if (entry?.disabled) return;

    if (this.options.multiple) {
      if (this._selectedValues.has(value)) {
        this._selectedValues.delete(value);
      } else {
        this._selectedValues.add(value);
      }
    } else {
      this._selectedValues = new Set([value]);
    }
    this.syncAriaAttributes();
    this.options.onSelectionChange?.(this.selectedValues);
    this.host.requestUpdate();
  }

  private syncFromDomIfNeeded(): void {
    if (!this.options.getOptionElements) return;
    const domOptions = this.options.getOptionElements();
    if (domOptions.length === 0) return;

    const nextItems: Array<ListboxOptionItem> = domOptions.map((el, idx) => {
      if (!el.id) {
        el.id = `mth-opt-${++optionIdCounter}`;
      }
      const value = el.getAttribute('data-value') ?? el.getAttribute('value') ?? String(idx);
      const label = el.textContent?.trim() ?? '';
      const disabled =
        el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
      const group = el.closest('[role="group"]')?.getAttribute('aria-label') ?? undefined;
      return {
        id: el.id,
        value,
        label,
        disabled,
        element: el,
        ...(group !== undefined ? { group } : {}),
      };
    });

    const unchanged =
      nextItems.length === this.items.length &&
      nextItems.every(
        (n, i) => n.element === this.items[i]?.element && n.label === this.items[i]?.label,
      );
    if (!unchanged) {
      this.items = nextItems;
    }
  }

  private attachKeyListener(): void {
    const target = this.options.getListboxElement?.() ?? this.host;
    if (target === this.listenerTarget) return;
    this.detachKeyListener();
    this.listenerTarget = target;
    target.addEventListener('keydown', this.handleKeyDown);
  }

  private detachKeyListener(): void {
    this.listenerTarget?.removeEventListener('keydown', this.handleKeyDown);
    this.listenerTarget = null;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.syncFromDomIfNeeded();
    if (this.items.length === 0) return;

    const loop = this.options.loop ?? true;
    const key = event.key;

    if (key === 'ArrowDown') {
      event.preventDefault();
      const next =
        this._activeIndex === -1
          ? findFirstEnabledOption(this.items)
          : stepEnabledOption(this.items, this._activeIndex, 1, loop);
      if (next !== null) this.setActiveIndex(next);
      return;
    }

    if (key === 'ArrowUp') {
      event.preventDefault();
      const prev =
        this._activeIndex === -1
          ? findLastEnabledOption(this.items)
          : stepEnabledOption(this.items, this._activeIndex, -1, loop);
      if (prev !== null) this.setActiveIndex(prev);
      return;
    }

    if (key === 'Home') {
      event.preventDefault();
      const first = findFirstEnabledOption(this.items);
      if (first !== null) this.setActiveIndex(first);
      return;
    }

    if (key === 'End') {
      event.preventDefault();
      const last = findLastEnabledOption(this.items);
      if (last !== null) this.setActiveIndex(last);
      return;
    }

    if (key === 'Enter' || key === ' ') {
      if (this._activeIndex >= 0) {
        event.preventDefault();
        this.selectActive();
      }
      return;
    }

    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.handleTypeahead(key);
    }
  };

  private handleTypeahead(char: string): void {
    const lower = char.toLowerCase();
    const timeout = this.options.typeaheadTimeoutMs ?? 500;
    const isSameRepeatedChar =
      this.typeaheadBuffer.length === 1 && this.typeaheadBuffer === lower;

    if (isSameRepeatedChar) {
      // Cycle through options starting with the repeated letter.
      const match = this.findMatchingIndex(lower, this._activeIndex + 1);
      if (match !== -1) {
        this.setActiveIndex(match);
      }
    } else {
      this.typeaheadBuffer += lower;
      const startFrom =
        this.typeaheadBuffer.length === 1
          ? Math.max(0, this._activeIndex + 1)
          : Math.max(0, this._activeIndex);
      let match = this.findMatchingIndex(this.typeaheadBuffer, startFrom);
      if (match === -1 && this.typeaheadBuffer.length > 1) {
        this.typeaheadBuffer = lower;
        match = this.findMatchingIndex(lower, Math.max(0, this._activeIndex + 1));
      }
      if (match !== -1) {
        this.setActiveIndex(match);
      }
    }

    if (this.typeaheadTimer !== null) {
      clearTimeout(this.typeaheadTimer);
    }
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = '';
      this.typeaheadTimer = null;
    }, timeout);
  }

  private clearTypeahead(): void {
    if (this.typeaheadTimer !== null) {
      clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = null;
    }
    this.typeaheadBuffer = '';
  }

  private findMatchingIndex(prefix: string, startIndex: number): number {
    const len = this.items.length;
    if (len === 0) return -1;
    const start = ((startIndex % len) + len) % len;
    for (let offset = 0; offset < len; offset += 1) {
      const idx = (start + offset) % len;
      const item = this.items[idx];
      if (item && !item.disabled && item.label.toLowerCase().startsWith(prefix)) {
        return idx;
      }
    }
    return -1;
  }

  private syncAriaAttributes(): void {
    const listboxEl = this.options.getListboxElement?.() ?? this.host;
    const active = this.activeOption;

    if (this.focusMode === 'activedescendant') {
      if (active) {
        listboxEl.setAttribute('aria-activedescendant', active.id);
      } else {
        listboxEl.removeAttribute('aria-activedescendant');
      }
    } else {
      listboxEl.removeAttribute('aria-activedescendant');
    }

    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      const el = item?.element;
      if (!item || !el) continue;

      const selected = this._selectedValues.has(item.value);
      el.setAttribute('aria-selected', selected ? 'true' : 'false');
      if (i === this._activeIndex) {
        el.setAttribute('data-active', 'true');
      } else {
        el.removeAttribute('data-active');
      }

      if (this.focusMode === 'roving') {
        const firstEnabled = findFirstEnabledOption(this.items);
        const focusTarget = this._activeIndex >= 0 ? this._activeIndex : (firstEnabled ?? 0);
        el.tabIndex = i === focusTarget && !item.disabled ? 0 : -1;
      }
    }
  }
}

function findFirstEnabledOption(items: ReadonlyArray<ListboxOptionItem>): number | null {
  for (let i = 0; i < items.length; i += 1) {
    if (!items[i]?.disabled) return i;
  }
  return null;
}

function findLastEnabledOption(items: ReadonlyArray<ListboxOptionItem>): number | null {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (!items[i]?.disabled) return i;
  }
  return null;
}

function stepEnabledOption(
  items: ReadonlyArray<ListboxOptionItem>,
  from: number,
  delta: number,
  loop: boolean,
): number | null {
  const len = items.length;
  if (len === 0) return null;
  if (!loop) {
    let idx = from + delta;
    while (idx >= 0 && idx < len) {
      if (!items[idx]?.disabled) return idx;
      idx += Math.sign(delta);
    }
    return null;
  }
  for (let step = 1; step <= len; step += 1) {
    const idx = (((from + delta * step) % len) + len) % len;
    if (!items[idx]?.disabled) return idx;
  }
  return null;
}
