import { getRuntime } from '@methane/core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface VirtualItem {
  readonly index: number;
  readonly start: number;
  readonly size: number;
  readonly end: number;
}

export interface VirtualGridCell {
  readonly rowIndex: number;
  readonly columnIndex: number;
  readonly rowStart: number;
  readonly rowSize: number;
  readonly colStart: number;
  readonly colSize: number;
}

export interface VirtualizerControllerOptions {
  count: number;
  estimateSize: number | ((index: number) => number);
  columns?: number;
  estimateColumnSize?: number | ((columnIndex: number) => number);
  overscan?: number;
  getScrollElement?: () => HTMLElement | null;
}

/**
 * 1D variable-height list and 2D grid windowing controller with prefix-sum offsets,
 * dynamic measurement, and above-viewport scroll anchoring.
 */
export class VirtualizerController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private count: number;
  private estimateSize: number | ((index: number) => number);
  private columns: number;
  private estimateColumnSize: number | ((col: number) => number);
  private overscan: number;
  private readonly getScrollElement: (() => HTMLElement | null) | undefined;

  private readonly measuredRowSizes = new Map<number, number>();
  private readonly measuredColSizes = new Map<number, number>();
  private rowOffsets: number[] = [];
  private colOffsets: number[] = [];

  private scrollTop = 0;
  private scrollLeft = 0;
  private viewportHeight = 400;
  private viewportWidth = 800;

  private scrollEl: HTMLElement | null = null;
  private cleanupResize: (() => void) | null = null;

  constructor(host: ReactiveControllerHost, options: VirtualizerControllerOptions) {
    this.host = host;
    this.count = Math.max(0, options.count);
    this.estimateSize = options.estimateSize;
    this.columns = Math.max(0, options.columns ?? 0);
    this.estimateColumnSize = options.estimateColumnSize ?? 120;
    this.overscan = options.overscan ?? 3;
    this.getScrollElement = options.getScrollElement;
    this.rebuildOffsets();
    this.host.addController(this);
  }

  get totalSize(): number {
    return this.rowOffsets[this.count] ?? 0;
  }

  get totalWidth(): number {
    return this.colOffsets[this.columns] ?? 0;
  }

  get currentScrollTop(): number {
    return this.scrollTop;
  }

  hostConnected(): void {
    this.attachScrollElement();
  }

  hostUpdated(): void {
    this.attachScrollElement();
  }

  hostDisconnected(): void {
    this.detachScrollElement();
  }

  setCount(count: number): void {
    const clamped = Math.max(0, count);
    if (clamped === this.count) return;
    this.count = clamped;
    this.rebuildOffsets();
    this.host.requestUpdate();
  }

  setColumns(columns: number): void {
    const clamped = Math.max(0, columns);
    if (clamped === this.columns) return;
    this.columns = clamped;
    this.rebuildOffsets();
    this.host.requestUpdate();
  }

  setViewport(height: number, width = this.viewportWidth): void {
    this.viewportHeight = Math.max(0, height);
    this.viewportWidth = Math.max(0, width);
    this.host.requestUpdate();
  }

  setScrollPosition(scrollTop: number, scrollLeft = this.scrollLeft): void {
    this.scrollTop = Math.max(0, scrollTop);
    this.scrollLeft = Math.max(0, scrollLeft);
    this.host.requestUpdate();
  }

  /**
   * Records a measured row height and adjusts scrollTop when the item starts above
   * the current scroll offset to preserve visual scroll anchoring.
   */
  measureItem(index: number, size: number): void {
    if (index < 0 || index >= this.count) return;
    const prevSize = this.getRowSize(index);
    const rounded = Math.max(1, size);
    if (Math.abs(prevSize - rounded) < 0.5) return;

    const start = this.rowOffsets[index] ?? 0;
    this.measuredRowSizes.set(index, rounded);
    this.rebuildOffsets();

    const delta = rounded - prevSize;
    if (start < this.scrollTop && this.scrollTop > 0) {
      this.scrollTop = Math.max(0, this.scrollTop + delta);
      if (this.scrollEl) {
        this.scrollEl.scrollTop = this.scrollTop;
      }
    }
    this.host.requestUpdate();
  }

  measureColumn(columnIndex: number, size: number): void {
    if (columnIndex < 0 || columnIndex >= this.columns) return;
    const rounded = Math.max(1, size);
    this.measuredColSizes.set(columnIndex, rounded);
    this.rebuildOffsets();
    this.host.requestUpdate();
  }

  getVirtualItems(): VirtualItem[] {
    if (this.count === 0) return [];
    const { startIndex, endIndex } = findVisibleRange(
      this.rowOffsets,
      this.count,
      this.scrollTop,
      this.scrollTop + this.viewportHeight,
      this.overscan,
    );
    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i += 1) {
      const start = this.rowOffsets[i] ?? 0;
      const end = this.rowOffsets[i + 1] ?? start;
      items.push({ index: i, start, size: end - start, end });
    }
    return items;
  }

  getVirtualGridCells(): VirtualGridCell[] {
    if (this.count === 0 || this.columns === 0) return [];
    const rows = this.getVirtualItems();
    const { startIndex: colStartIdx, endIndex: colEndIdx } = findVisibleRange(
      this.colOffsets,
      this.columns,
      this.scrollLeft,
      this.scrollLeft + this.viewportWidth,
      this.overscan,
    );

    const cells: VirtualGridCell[] = [];
    for (const row of rows) {
      for (let c = colStartIdx; c <= colEndIdx; c += 1) {
        const colStart = this.colOffsets[c] ?? 0;
        const colEnd = this.colOffsets[c + 1] ?? colStart;
        cells.push({
          rowIndex: row.index,
          columnIndex: c,
          rowStart: row.start,
          rowSize: row.size,
          colStart,
          colSize: colEnd - colStart,
        });
      }
    }
    return cells;
  }

  scrollToIndex(index: number, align: 'start' | 'center' | 'end' = 'start'): number {
    if (this.count === 0) return 0;
    const clamped = Math.max(0, Math.min(this.count - 1, index));
    const start = this.rowOffsets[clamped] ?? 0;
    const end = this.rowOffsets[clamped + 1] ?? start;
    const size = end - start;

    let target = start;
    if (align === 'center') {
      target = start - this.viewportHeight / 2 + size / 2;
    } else if (align === 'end') {
      target = end - this.viewportHeight;
    }
    const clampedScroll = Math.max(0, Math.min(Math.max(0, this.totalSize - this.viewportHeight), target));
    this.scrollTop = clampedScroll;
    if (this.scrollEl) {
      this.scrollEl.scrollTop = clampedScroll;
    }
    this.host.requestUpdate();
    return clampedScroll;
  }

  private getRowSize(index: number): number {
    const measured = this.measuredRowSizes.get(index);
    if (measured !== undefined) return measured;
    return typeof this.estimateSize === 'function' ? this.estimateSize(index) : this.estimateSize;
  }

  private getColSize(index: number): number {
    const measured = this.measuredColSizes.get(index);
    if (measured !== undefined) return measured;
    return typeof this.estimateColumnSize === 'function'
      ? this.estimateColumnSize(index)
      : this.estimateColumnSize;
  }

  private rebuildOffsets(): void {
    const rOffsets = new Array<number>(this.count + 1);
    rOffsets[0] = 0;
    let rAcc = 0;
    for (let i = 0; i < this.count; i += 1) {
      rAcc += this.getRowSize(i);
      rOffsets[i + 1] = rAcc;
    }
    this.rowOffsets = rOffsets;

    const cOffsets = new Array<number>(this.columns + 1);
    cOffsets[0] = 0;
    let cAcc = 0;
    for (let c = 0; c < this.columns; c += 1) {
      cAcc += this.getColSize(c);
      cOffsets[c + 1] = cAcc;
    }
    this.colOffsets = cOffsets;
  }

  private attachScrollElement(): void {
    const next = this.getScrollElement?.() ?? null;
    if (next === this.scrollEl) return;
    this.detachScrollElement();
    this.scrollEl = next;
    if (!next) return;

    next.addEventListener('scroll', this.handleScroll, { passive: true });
    if (next.clientHeight > 0) this.viewportHeight = next.clientHeight;
    if (next.clientWidth > 0) this.viewportWidth = next.clientWidth;

    this.cleanupResize = getRuntime().observers.observeResize(next, (entry) => {
      const box = entry.contentRect;
      if (box.height > 0 || box.width > 0) {
        this.viewportHeight = box.height;
        this.viewportWidth = box.width;
        this.host.requestUpdate();
      }
    });
  }

  private detachScrollElement(): void {
    this.scrollEl?.removeEventListener('scroll', this.handleScroll);
    this.cleanupResize?.();
    this.cleanupResize = null;
    this.scrollEl = null;
  }

  private readonly handleScroll = (): void => {
    if (!this.scrollEl) return;
    this.scrollTop = this.scrollEl.scrollTop;
    this.scrollLeft = this.scrollEl.scrollLeft;
    this.host.requestUpdate();
  };
}

function findVisibleRange(
  offsets: ReadonlyArray<number>,
  count: number,
  startPx: number,
  endPx: number,
  overscan: number,
): { startIndex: number; endIndex: number } {
  if (count === 0) return { startIndex: 0, endIndex: -1 };
  let low = 0;
  let high = count - 1;
  let firstVisible = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const itemEnd = offsets[mid + 1] ?? 0;
    if (itemEnd <= startPx) {
      low = mid + 1;
    } else {
      firstVisible = mid;
      high = mid - 1;
    }
  }

  let lastVisible = firstVisible;
  while (lastVisible < count - 1 && (offsets[lastVisible + 1] ?? 0) < endPx) {
    lastVisible += 1;
  }

  return {
    startIndex: Math.max(0, firstVisible - overscan),
    endIndex: Math.min(count - 1, lastVisible + overscan),
  };
}
