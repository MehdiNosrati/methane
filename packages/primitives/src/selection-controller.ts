import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type SelectionMode = 'single' | 'multiple';
export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

export interface SelectableItem<T = string> {
  readonly value: T;
  readonly disabled?: boolean;
}

export interface SelectionControllerOptions<T = string> {
  mode?: SelectionMode;
  items?: ReadonlyArray<SelectableItem<T> | T>;
  initialSelection?: ReadonlyArray<T>;
  allowEmpty?: boolean;
  onChange?: (selected: ReadonlyArray<T>) => void;
}

/**
 * Headless single, multi, contiguous Shift-range, and tri-state indeterminate selection controller.
 */
export class SelectionController<T = string> implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private _mode: SelectionMode;
  private _allowEmpty: boolean;
  private _items: Array<SelectableItem<T>> = [];
  private _selected: Set<T>;
  private _anchorValue: T | undefined;
  private onChange: ((selected: ReadonlyArray<T>) => void) | undefined;

  constructor(host: ReactiveControllerHost, options: SelectionControllerOptions<T> = {}) {
    this.host = host;
    this._mode = options.mode ?? 'single';
    this._allowEmpty = options.allowEmpty ?? true;
    this.onChange = options.onChange;
    this._selected = new Set(options.initialSelection ?? []);
    if (options.items) {
      this.setItems(options.items);
    }
    this.host.addController(this);
  }

  get mode(): SelectionMode {
    return this._mode;
  }

  set mode(value: SelectionMode) {
    if (this._mode === value) return;
    this._mode = value;
    if (value === 'single' && this._selected.size > 1) {
      const first = this._selected.values().next().value as T;
      this._selected = new Set([first]);
      this.emitChange();
    }
    this.host.requestUpdate();
  }

  get selectedValues(): ReadonlyArray<T> {
    return Array.from(this._selected);
  }

  get selectedSet(): ReadonlySet<T> {
    return this._selected;
  }

  get anchorValue(): T | undefined {
    return this._anchorValue;
  }

  get enabledItems(): ReadonlyArray<SelectableItem<T>> {
    return this._items.filter((item) => !item.disabled);
  }

  get isAllSelected(): boolean {
    const enabled = this.enabledItems;
    return enabled.length > 0 && enabled.every((item) => this._selected.has(item.value));
  }

  get isIndeterminate(): boolean {
    const enabled = this.enabledItems;
    if (enabled.length === 0) return false;
    let selectedCount = 0;
    for (const item of enabled) {
      if (this._selected.has(item.value)) {
        selectedCount += 1;
      }
    }
    return selectedCount > 0 && selectedCount < enabled.length;
  }

  get checkState(): CheckState {
    if (this.isAllSelected) return 'checked';
    if (this.isIndeterminate) return 'indeterminate';
    return 'unchecked';
  }

  hostConnected(): void {
    // Lifecycle managed on demand.
  }

  hostDisconnected(): void {
    // No external listeners.
  }

  setItems(items: ReadonlyArray<SelectableItem<T> | T>): void {
    this._items = items.map((entry) =>
      typeof entry === 'object' && entry !== null && 'value' in entry
        ? { value: entry.value, ...(entry.disabled !== undefined ? { disabled: entry.disabled } : {}) }
        : { value: entry },
    );
    this.host.requestUpdate();
  }

  isSelected(value: T): boolean {
    return this._selected.has(value);
  }

  select(
    value: T,
    options: { range?: boolean; toggle?: boolean; additive?: boolean } = {},
  ): void {
    if (this.isItemDisabled(value)) return;

    if (this._mode === 'single') {
      if (options.toggle && this._selected.has(value) && this._allowEmpty) {
        this._selected.clear();
        this._anchorValue = undefined;
      } else {
        this._selected = new Set([value]);
        this._anchorValue = value;
      }
      this.emitChange();
      this.host.requestUpdate();
      return;
    }

    if (options.range && this._anchorValue !== undefined && this._items.length > 0) {
      const startIndex = this._items.findIndex((item) => Object.is(item.value, this._anchorValue));
      const endIndex = this._items.findIndex((item) => Object.is(item.value, value));
      if (startIndex !== -1 && endIndex !== -1) {
        const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
        const next = options.additive ? new Set(this._selected) : new Set<T>();
        for (let i = from; i <= to; i += 1) {
          const item = this._items[i];
          if (item && !item.disabled) {
            next.add(item.value);
          }
        }
        this._selected = next;
        this.emitChange();
        this.host.requestUpdate();
        return;
      }
    }

    if (options.toggle) {
      if (this._selected.has(value)) {
        if (this._selected.size > 1 || this._allowEmpty) {
          this._selected.delete(value);
        }
      } else {
        this._selected.add(value);
        this._anchorValue = value;
      }
    } else if (options.additive) {
      this._selected.add(value);
      this._anchorValue = value;
    } else {
      this._selected = new Set([value]);
      this._anchorValue = value;
    }

    this.emitChange();
    this.host.requestUpdate();
  }

  toggle(value: T): void {
    this.select(value, { toggle: true });
  }

  deselect(value: T): void {
    if (!this._selected.has(value)) return;
    if (this._selected.size === 1 && !this._allowEmpty) return;
    this._selected.delete(value);
    this.emitChange();
    this.host.requestUpdate();
  }

  selectAll(): void {
    if (this._mode !== 'multiple') return;
    const next = new Set<T>(this._selected);
    for (const item of this._items) {
      if (!item.disabled) {
        next.add(item.value);
      }
    }
    this._selected = next;
    this.emitChange();
    this.host.requestUpdate();
  }

  clear(): void {
    if (!this._allowEmpty || this._selected.size === 0) return;
    this._selected.clear();
    this._anchorValue = undefined;
    this.emitChange();
    this.host.requestUpdate();
  }

  toggleAll(): void {
    if (this._mode !== 'multiple') return;
    if (this.isAllSelected) {
      this.clear();
    } else {
      this.selectAll();
    }
  }

  setSelection(values: ReadonlyArray<T>): void {
    const filtered = values.filter((v) => !this.isItemDisabled(v));
    if (this._mode === 'single') {
      const first = filtered[0];
      this._selected = first !== undefined ? new Set([first]) : new Set();
      this._anchorValue = first;
    } else {
      this._selected = new Set(filtered);
      this._anchorValue = filtered[filtered.length - 1];
    }
    this.emitChange();
    this.host.requestUpdate();
  }

  private isItemDisabled(value: T): boolean {
    const entry = this._items.find((item) => Object.is(item.value, value));
    return Boolean(entry?.disabled);
  }

  private emitChange(): void {
    this.onChange?.(this.selectedValues);
  }
}
