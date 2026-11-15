import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { CheckState } from './selection-controller.js';

export type SortDirection = 'asc' | 'desc';
export type ColumnPin = 'left' | 'right' | null;

export interface TableSortRule {
  readonly columnId: string;
  readonly direction: SortDirection;
}

export interface TableColumnDef<T> {
  readonly id: string;
  readonly header: string;
  readonly accessor: (row: T) => unknown;
  readonly sortable?: boolean;
  readonly filterable?: boolean;
  readonly resizable?: boolean;
  readonly width?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly pin?: ColumnPin;
  readonly sortComparator?: (a: T, b: T) => number;
}

export interface TableColumnState<T> extends TableColumnDef<T> {
  readonly resolvedWidth: number;
  readonly resolvedPin: ColumnPin;
  readonly stickyOffset: number | null;
}

export interface TableCoreOptions<T> {
  rows?: ReadonlyArray<T>;
  columns: ReadonlyArray<TableColumnDef<T>>;
  getRowId?: (row: T, index: number) => string;
  multiSort?: boolean;
}

/**
 * Headless data-table controller handling sorting, column/global filtering,
 * row selection, left/right column pinning offsets, column resizing, and row expansion.
 */
export class TableCore<T> implements ReactiveController {
  private readonly host: ReactiveControllerHost | null;
  private rawRows: ReadonlyArray<T>;
  private columnDefs: ReadonlyArray<TableColumnDef<T>>;
  private readonly getRowId: (row: T, index: number) => string;
  private readonly multiSort: boolean;

  private _sorting: TableSortRule[] = [];
  private _globalFilter = '';
  private _columnFilters = new Map<string, string>();
  private _selectedIds = new Set<string>();
  private _expandedIds = new Set<string>();
  private _columnWidths = new Map<string, number>();
  private _columnPins = new Map<string, ColumnPin>();

  constructor(options: TableCoreOptions<T>, host: ReactiveControllerHost | null = null) {
    this.host = host;
    this.rawRows = options.rows ?? [];
    this.columnDefs = options.columns;
    this.getRowId =
      options.getRowId ??
      ((row, index) => {
        if (typeof row === 'object' && row !== null && 'id' in row) {
          return String((row as { id: unknown }).id);
        }
        return String(index);
      });
    this.multiSort = options.multiSort ?? false;

    for (const col of this.columnDefs) {
      if (col.width !== undefined) {
        this._columnWidths.set(col.id, col.width);
      }
      if (col.pin !== undefined) {
        this._columnPins.set(col.id, col.pin);
      }
    }

    this.host?.addController(this);
  }

  get sorting(): ReadonlyArray<TableSortRule> {
    return this._sorting;
  }

  get globalFilter(): string {
    return this._globalFilter;
  }

  get selectedRowIds(): ReadonlySet<string> {
    return this._selectedIds;
  }

  get expandedRowIds(): ReadonlySet<string> {
    return this._expandedIds;
  }

  hostConnected(): void {
    // Lifecycle managed via reactive updates.
  }

  hostDisconnected(): void {
    // No external listeners.
  }

  setRows(rows: ReadonlyArray<T>): void {
    this.rawRows = rows;
    this.host?.requestUpdate();
  }

  setColumns(columns: ReadonlyArray<TableColumnDef<T>>): void {
    this.columnDefs = columns;
    this.host?.requestUpdate();
  }

  getProcessedRows(): ReadonlyArray<T> {
    let rows = [...this.rawRows];

    if (this._globalFilter.trim().length > 0) {
      const needle = this._globalFilter.trim().toLowerCase();
      const filterCols = this.columnDefs.filter((c) => c.filterable !== false);
      rows = rows.filter((row) =>
        filterCols.some((col) => String(col.accessor(row) ?? '').toLowerCase().includes(needle)),
      );
    }

    if (this._columnFilters.size > 0) {
      rows = rows.filter((row) => {
        for (const [colId, filterVal] of this._columnFilters.entries()) {
          if (!filterVal) continue;
          const col = this.columnDefs.find((c) => c.id === colId);
          if (!col) continue;
          const cell = String(col.accessor(row) ?? '').toLowerCase();
          if (!cell.includes(filterVal.toLowerCase())) {
            return false;
          }
        }
        return true;
      });
    }

    if (this._sorting.length > 0) {
      rows.sort((a, b) => {
        for (const rule of this._sorting) {
          const col = this.columnDefs.find((c) => c.id === rule.columnId);
          if (!col) continue;
          const cmp = col.sortComparator
            ? col.sortComparator(a, b)
            : compareValues(col.accessor(a), col.accessor(b));
          if (cmp !== 0) {
            return rule.direction === 'asc' ? cmp : -cmp;
          }
        }
        return 0;
      });
    }

    return rows;
  }

  getResolvedColumns(): ReadonlyArray<TableColumnState<T>> {
    const withMeta = this.columnDefs.map((col) => {
      const resolvedPin = this._columnPins.get(col.id) ?? col.pin ?? null;
      const resolvedWidth = this._columnWidths.get(col.id) ?? col.width ?? 150;
      return { col, resolvedPin, resolvedWidth };
    });

    const leftCols = withMeta.filter((c) => c.resolvedPin === 'left');
    const centerCols = withMeta.filter((c) => c.resolvedPin === null);
    const rightCols = withMeta.filter((c) => c.resolvedPin === 'right');

    let leftAcc = 0;
    const leftStates: TableColumnState<T>[] = leftCols.map(({ col, resolvedPin, resolvedWidth }) => {
      const state: TableColumnState<T> = {
        ...col,
        resolvedWidth,
        resolvedPin,
        stickyOffset: leftAcc,
      };
      leftAcc += resolvedWidth;
      return state;
    });

    const centerStates: TableColumnState<T>[] = centerCols.map(
      ({ col, resolvedPin, resolvedWidth }) => ({
        ...col,
        resolvedWidth,
        resolvedPin,
        stickyOffset: null,
      }),
    );

    const rightStates: TableColumnState<T>[] = new Array(rightCols.length);
    let rightAcc = 0;
    for (let i = rightCols.length - 1; i >= 0; i -= 1) {
      const item = rightCols[i]!;
      rightStates[i] = {
        ...item.col,
        resolvedWidth: item.resolvedWidth,
        resolvedPin: item.resolvedPin,
        stickyOffset: rightAcc,
      };
      rightAcc += item.resolvedWidth;
    }

    return [...leftStates, ...centerStates, ...rightStates];
  }

  toggleSort(columnId: string, additive = false): void {
    const col = this.columnDefs.find((c) => c.id === columnId);
    if (!col || col.sortable === false) return;

    const existing = this._sorting.find((s) => s.columnId === columnId);
    const nextDirection: SortDirection | null = !existing
      ? 'asc'
      : existing.direction === 'asc'
        ? 'desc'
        : null;

    if (this.multiSort && additive) {
      const filtered = this._sorting.filter((s) => s.columnId !== columnId);
      if (nextDirection) {
        filtered.push({ columnId, direction: nextDirection });
      }
      this._sorting = filtered;
    } else {
      this._sorting = nextDirection ? [{ columnId, direction: nextDirection }] : [];
    }
    this.host?.requestUpdate();
  }

  setGlobalFilter(query: string): void {
    this._globalFilter = query;
    this.host?.requestUpdate();
  }

  setColumnFilter(columnId: string, query: string): void {
    if (query.trim().length === 0) {
      this._columnFilters.delete(columnId);
    } else {
      this._columnFilters.set(columnId, query);
    }
    this.host?.requestUpdate();
  }

  pinColumn(columnId: string, pin: ColumnPin): void {
    this._columnPins.set(columnId, pin);
    this.host?.requestUpdate();
  }

  resizeColumn(columnId: string, width: number): number {
    const col = this.columnDefs.find((c) => c.id === columnId);
    const min = col?.minWidth ?? 48;
    const max = col?.maxWidth ?? 1200;
    const clamped = Math.max(min, Math.min(max, Math.round(width)));
    this._columnWidths.set(columnId, clamped);
    this.host?.requestUpdate();
    return clamped;
  }

  toggleRowSelected(rowId: string): void {
    if (this._selectedIds.has(rowId)) {
      this._selectedIds.delete(rowId);
    } else {
      this._selectedIds.add(rowId);
    }
    this.host?.requestUpdate();
  }

  getSelectionCheckState(): CheckState {
    const rows = this.getProcessedRows();
    if (rows.length === 0) return 'unchecked';
    let selected = 0;
    for (let i = 0; i < rows.length; i += 1) {
      if (this._selectedIds.has(this.getRowId(rows[i]!, i))) {
        selected += 1;
      }
    }
    if (selected === 0) return 'unchecked';
    if (selected === rows.length) return 'checked';
    return 'indeterminate';
  }

  toggleAllRowsSelected(): void {
    const rows = this.getProcessedRows();
    const state = this.getSelectionCheckState();
    if (state === 'checked') {
      this._selectedIds.clear();
    } else {
      for (let i = 0; i < rows.length; i += 1) {
        this._selectedIds.add(this.getRowId(rows[i]!, i));
      }
    }
    this.host?.requestUpdate();
  }

  toggleRowExpanded(rowId: string): void {
    if (this._expandedIds.has(rowId)) {
      this._expandedIds.delete(rowId);
    } else {
      this._expandedIds.add(rowId);
    }
    this.host?.requestUpdate();
  }

  isRowExpanded(rowId: string): boolean {
    return this._expandedIds.has(rowId);
  }
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
