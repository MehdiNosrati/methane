import { getRuntime } from '@methane-ui/core';
import {
  createTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type GroupingState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table,
  type TableState,
  type Updater,
} from '@tanstack/table-core';
import {
  elementScroll,
  Virtualizer,
  type VirtualItem,
} from '@tanstack/virtual-core';

export interface ThemeTokenSnapshot {
  readonly accent: string;
  readonly bg: string;
  readonly fg: string;
  readonly border: string;
}

export interface BaseSatelliteEngine {
  readonly theme: ThemeTokenSnapshot;
  getAppliedToken(tokenName: string): string;
  syncTokens(host: HTMLElement): void;
  dispose(): void;
}

export function escapeCssString(raw: string): string {
  return String(raw).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, '');
}

export function createDynamicSheet(): CSSStyleSheet | null {
  return typeof CSSStyleSheet !== 'undefined' ? new CSSStyleSheet() : null;
}

export function attachDynamicSheet(
  host: HTMLElement,
  sheet: CSSStyleSheet | null,
): void {
  const root = host.shadowRoot;
  if (!sheet || !root || !('adoptedStyleSheets' in root)) return;
  if (!root.adoptedStyleSheets.includes(sheet)) {
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  }
}

export function readCssToken(host: HTMLElement, tokenName: string): string {
  const inlineVal = host.style?.getPropertyValue?.(tokenName)?.trim();
  if (inlineVal) return inlineVal;
  if (typeof getComputedStyle === 'function') {
    try {
      return getComputedStyle(host).getPropertyValue(tokenName).trim();
    } catch {
      return '';
    }
  }
  return '';
}

export function captureThemeSnapshot(host: HTMLElement): ThemeTokenSnapshot {
  return {
    accent: readCssToken(host, '--mth-color-accent'),
    bg: readCssToken(host, '--mth-color-bg'),
    fg: readCssToken(host, '--mth-color-fg'),
    border: readCssToken(host, '--mth-color-border'),
  };
}

export function applyUpdater<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === 'function' ? (updater as (old: T) => T)(prev) : updater;
}

import type { Row } from '@tanstack/table-core';

export interface TanStackTableWrapperOptions<TData extends RowData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number, parent?: Row<TData>) => string;
  getSubRows?: (row: TData) => TData[] | undefined;
  initialSorting?: SortingState;
  initialExpanded?: ExpandedState;
  initialGrouping?: GroupingState;
  initialColumnPinning?: ColumnPinningState;
  onStateChange?: (state: TableState) => void;
}

export function createTanStackTableInstance<TData extends RowData>(
  options: TanStackTableWrapperOptions<TData>,
): {
  readonly table: Table<TData>;
  setData: (nextData: TData[]) => void;
  setColumns: (nextColumns: ColumnDef<TData, unknown>[]) => void;
  getState: () => TableState;
  patchState: (partial: Partial<TableState>) => void;
} {
  let state: TableState = {
    sorting: options.initialSorting ?? [],
    columnFilters: [],
    globalFilter: '',
    columnVisibility: {},
    columnOrder: [],
    columnPinning: options.initialColumnPinning ?? { left: [], right: [] },
    rowPinning: { top: [], bottom: [] },
    columnSizing: {} as ColumnSizingState,
    columnSizingInfo: {
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false,
      columnSizingStart: [],
    },
    rowSelection: {} as RowSelectionState,
    expanded: options.initialExpanded ?? {},
    grouping: options.initialGrouping ?? [],
    pagination: { pageIndex: 0, pageSize: 100 },
  };

  let data = options.data;
  let columns = options.columns;

  const table = createTable<TData>({
    data,
    columns,
    state,
    renderFallbackValue: null,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    autoResetPageIndex: false,
    autoResetExpanded: false,
    ...(options.getRowId ? { getRowId: options.getRowId } : {}),
    ...(options.getSubRows ? { getSubRows: options.getSubRows } : {}),
    onStateChange: (updater) => {
      const current = (table.options.state as TableState | undefined) ?? state;
      state = applyUpdater(updater, current);
      table.setOptions((prev) => ({ ...prev, state }));
      options.onStateChange?.(state);
    },
  });

  return {
    table,
    setData(nextData) {
      data = nextData;
      table.setOptions((prev) => ({ ...prev, data }));
    },
    setColumns(nextColumns) {
      columns = nextColumns;
      table.setOptions((prev) => ({ ...prev, columns }));
    },
    getState() {
      return state;
    },
    patchState(partial) {
      state = { ...state, ...partial };
      table.setOptions((prev) => ({ ...prev, state }));
    },
  };
}

export interface HeadlessVirtualizerOptions {
  count: number;
  estimateSize: number;
  overscan?: number;
  horizontal?: boolean;
  getScrollElement: () => HTMLElement | null;
  onChange?: () => void;
}

export class HeadlessVirtualizer {
  readonly instance: Virtualizer<HTMLElement, Element>;
  private unmounted = false;
  private suppressOnChange = false;
  private cleanupScroll: (() => void) | null = null;
  private scrollEl: HTMLElement | null = null;

  constructor(options: HeadlessVirtualizerOptions) {
    this.instance = new Virtualizer<HTMLElement, Element>({
      count: Math.max(0, options.count),
      getScrollElement: options.getScrollElement,
      estimateSize: () => Math.max(16, options.estimateSize),
      overscan: options.overscan ?? 3,
      horizontal: options.horizontal ?? false,
      initialRect: { width: 800, height: 400 },
      scrollToFn: elementScroll,
      observeElementRect: (instance, cb) => {
        const el = instance.scrollElement;
        if (!el) {
          cb({ width: 800, height: 400 });
          return;
        }
        const rect = el.getBoundingClientRect?.();
        const w = rect && rect.width > 0 ? rect.width : el.clientWidth || 800;
        const h = rect && rect.height > 0 ? rect.height : el.clientHeight || 400;
        cb({ width: w, height: h });

        return getRuntime().observers.observeResize(el, (entry) => {
          cb({
            width: entry.contentRect.width || 800,
            height: entry.contentRect.height || 400,
          });
        });
      },
      observeElementOffset: (instance, cb) => {
        const el = instance.scrollElement;
        if (!el) {
          cb(0, false);
          return;
        }
        const read = () => (options.horizontal ? el.scrollLeft : el.scrollTop) || 0;
        cb(read(), false);
        const onScroll = () => cb(read(), false);
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll);
      },
      onChange: () => {
        if (!this.unmounted && !this.suppressOnChange) {
          options.onChange?.();
        }
      },
    });
  }

  mount(): void {
    this.unmounted = false;
    this.suppressOnChange = true;
    try {
      this.cleanupScroll?.();
      this.cleanupScroll = this.instance._didMount();
      this.scrollEl = this.instance.options.getScrollElement();
      this.instance._willUpdate();
    } finally {
      this.suppressOnChange = false;
    }
  }

  updateCount(count: number, estimateSize?: number): void {
    if (this.unmounted) return;
    const nextSize =
      estimateSize !== undefined && Number.isFinite(estimateSize) && estimateSize > 0
        ? estimateSize
        : undefined;
    this.suppressOnChange = true;
    try {
      this.instance.setOptions({
        ...this.instance.options,
        count: Math.max(0, count),
        ...(nextSize !== undefined ? { estimateSize: () => nextSize } : {}),
      });
      this.instance._willUpdate();
    } finally {
      this.suppressOnChange = false;
    }
  }

  attachElement(el: HTMLElement | null): void {
    if (el === this.scrollEl) return;
    this.scrollEl = el;
    this.suppressOnChange = true;
    try {
      this.cleanupScroll?.();
      this.cleanupScroll = null;
      if (!this.unmounted && el) {
        this.cleanupScroll = this.instance._didMount();
      }
      this.instance._willUpdate();
    } finally {
      this.suppressOnChange = false;
    }
  }

  getVirtualItems(): ReadonlyArray<VirtualItem> {
    return this.instance.getVirtualItems();
  }

  getTotalSize(): number {
    return this.instance.getTotalSize();
  }

  dispose(): void {
    this.unmounted = true;
    this.cleanupScroll?.();
    this.cleanupScroll = null;
    this.scrollEl = null;
  }
}
