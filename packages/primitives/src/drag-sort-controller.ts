import type { MessageCatalog } from '@methane-ui/core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { LiveAnnouncer } from './live-announcer.js';

export interface DragReorderDetail<T = HTMLElement> {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly item: T;
}

export interface DragSortControllerOptions<T extends HTMLElement = HTMLElement> {
  container?: () => HTMLElement | null;
  getItems: () => ReadonlyArray<T>;
  orientation?: 'vertical' | 'horizontal';
  dir?: 'ltr' | 'rtl' | 'auto';
  locale?: string;
  messages?: MessageCatalog;
  dragThresholdPx?: number;
  autoScrollEdgePx?: number;
  onReorder?: (detail: DragReorderDetail<T>) => void;
}

const DEFAULT_DRAG_SORT_MESSAGES: MessageCatalog = {
  grabbed: 'Grabbed item at position {position} of {total}. Use arrow keys to reorder.',
  moved: 'Moved to position {position} of {total}.',
  dropped: 'Dropped item at position {position}.',
  cancelled: 'Reorder cancelled.',
};

/**
 * Coordinates pointer-capture drag reordering, drop geometry detection, edge auto-scroll,
 * and RTL-aware Space + Arrow keyboard reordering with localized LiveAnnouncer feedback.
 */
export class DragSortController<T extends HTMLElement = HTMLElement>
  implements ReactiveController
{
  private readonly host: ReactiveControllerHost & HTMLElement;
  private options: DragSortControllerOptions<T>;

  private pointerActive = false;
  private dragging = false;
  private pointerId: number | null = null;
  private startX = 0;
  private startY = 0;
  private dragIndex = -1;
  private targetIndex = -1;
  private keyboardGrabbedIndex = -1;
  private keyboardStartIndex = -1;

  constructor(host: ReactiveControllerHost & HTMLElement, options: DragSortControllerOptions<T>) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  get isDragging(): boolean {
    return this.dragging;
  }

  get activeDragIndex(): number {
    return this.dragging ? this.dragIndex : this.keyboardGrabbedIndex;
  }

  get dropTargetIndex(): number {
    return this.targetIndex;
  }

  hostConnected(): void {
    const el = this.resolveContainer();
    el.addEventListener('pointerdown', this.handlePointerDown as EventListener);
    el.addEventListener('keydown', this.handleKeyDown);
  }

  hostDisconnected(): void {
    const el = this.resolveContainer();
    el.removeEventListener('pointerdown', this.handlePointerDown as EventListener);
    el.removeEventListener('keydown', this.handleKeyDown);
    this.detachMoveListeners();
  }

  reorder(fromIndex: number, toIndex: number): void {
    const items = this.options.getItems();
    const item = items[fromIndex];
    if (!item || fromIndex === toIndex || toIndex < 0 || toIndex >= items.length) {
      return;
    }
    const detail: DragReorderDetail<T> = { fromIndex, toIndex, item };
    this.options.onReorder?.(detail);
    this.host.dispatchEvent(
      new CustomEvent<DragReorderDetail<T>>('mth-reorder', {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
    this.host.requestUpdate();
  }

  private resolveContainer(): HTMLElement {
    return this.options.container?.() ?? this.host;
  }

  private resolveLocale(): string {
    return (
      this.options.locale ??
      this.host.getAttribute('lang') ??
      this.host.closest('[lang]')?.getAttribute('lang') ??
      (typeof document !== 'undefined' ? document.documentElement.lang : '') ??
      'en'
    ) || 'en';
  }

  private isRtl(): boolean {
    if (this.options.dir === 'rtl') return true;
    if (this.options.dir === 'ltr') return false;
    const container = this.resolveContainer();
    const closestDir = container.closest('[dir]')?.getAttribute('dir');
    if (closestDir === 'rtl') return true;
    if (closestDir === 'ltr') return false;
    if (typeof getComputedStyle === 'function') {
      return getComputedStyle(container).direction === 'rtl';
    }
    return false;
  }

  private announceKey(key: string, params: Record<string, string | number> = {}): void {
    LiveAnnouncer.announceI18n(key, {
      namespace: 'mth-drag-sort',
      locale: this.resolveLocale(),
      params,
      catalog: {
        ...DEFAULT_DRAG_SORT_MESSAGES,
        ...this.options.messages,
      },
      politeness: 'polite',
    });
  }

  private setGrabbedState(items: ReadonlyArray<T>, activeIndex: number): void {
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (!item) continue;
      if (i === activeIndex) {
        item.setAttribute('data-grabbed', 'true');
      } else {
        item.removeAttribute('data-grabbed');
      }
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const items = this.options.getItems();
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const idx = items.findIndex(
      (item) => item === event.target || path.includes(item) || item.contains(event.target as Node),
    );
    if (idx === -1) return;

    this.pointerActive = true;
    this.dragging = false;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.dragIndex = idx;
    this.targetIndex = idx;

    const item = items[idx]!;
    if (typeof item.setPointerCapture === 'function' && event.pointerId !== undefined) {
      try {
        item.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic test PointerEvents may lack active pointerId.
      }
    }

    const doc = this.host.ownerDocument ?? document;
    doc.addEventListener('pointermove', this.handlePointerMove as EventListener);
    doc.addEventListener('pointerup', this.handlePointerUp as EventListener);
    doc.addEventListener('pointercancel', this.handlePointerCancel as EventListener);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.pointerActive) return;
    const threshold = this.options.dragThresholdPx ?? 4;
    const dist = Math.hypot(event.clientX - this.startX, event.clientY - this.startY);
    if (!this.dragging) {
      if (dist < threshold) return;
      this.dragging = true;
      this.options.getItems()[this.dragIndex]?.setAttribute('data-dragging', 'true');
      this.host.requestUpdate();
    }

    const items = this.options.getItems();
    const orientation = this.options.orientation ?? 'vertical';
    const rtl = orientation === 'horizontal' && this.isRtl();
    let bestIdx = this.dragIndex;

    for (let i = 0; i < items.length; i += 1) {
      const rect = items[i]!.getBoundingClientRect();
      if (orientation === 'vertical') {
        const mid = rect.top + rect.height / 2;
        if (event.clientY >= mid) {
          bestIdx = i;
        }
      } else {
        const mid = rect.left + rect.width / 2;
        if (rtl ? event.clientX <= mid : event.clientX >= mid) {
          bestIdx = i;
        }
      }
    }

    this.targetIndex = bestIdx;
    this.maybeAutoScroll(event);
    this.host.requestUpdate();
  };

  private readonly handlePointerUp = (): void => {
    if (!this.pointerActive) return;
    const from = this.dragIndex;
    const to = this.targetIndex;
    const wasDragging = this.dragging;
    this.cleanupPointerDrag();
    if (wasDragging && from !== -1 && to !== -1 && from !== to) {
      this.reorder(from, to);
      this.announceKey('moved', {
        position: to + 1,
        total: this.options.getItems().length,
      });
    }
  };

  private readonly handlePointerCancel = (): void => {
    this.cleanupPointerDrag();
  };

  private cleanupPointerDrag(): void {
    const items = this.options.getItems();
    const item = items[this.dragIndex];
    item?.removeAttribute('data-dragging');
    if (
      item &&
      this.pointerId !== null &&
      typeof item.releasePointerCapture === 'function'
    ) {
      try {
        item.releasePointerCapture(this.pointerId);
      } catch {
        // Ignore if not captured.
      }
    }
    this.pointerActive = false;
    this.dragging = false;
    this.pointerId = null;
    this.dragIndex = -1;
    this.targetIndex = -1;
    this.detachMoveListeners();
    this.host.requestUpdate();
  }

  private detachMoveListeners(): void {
    const doc = this.host.ownerDocument ?? document;
    doc.removeEventListener('pointermove', this.handlePointerMove as EventListener);
    doc.removeEventListener('pointerup', this.handlePointerUp as EventListener);
    doc.removeEventListener('pointercancel', this.handlePointerCancel as EventListener);
  }

  private maybeAutoScroll(event: PointerEvent): void {
    const container = this.resolveContainer();
    const rect = container.getBoundingClientRect();
    if (rect.height === 0 && rect.width === 0) return;
    const edge = this.options.autoScrollEdgePx ?? 32;
    const orientation = this.options.orientation ?? 'vertical';
    const rtl = orientation === 'horizontal' && this.isRtl();
    if (orientation === 'vertical') {
      if (event.clientY < rect.top + edge) {
        container.scrollTop -= 12;
      } else if (event.clientY > rect.bottom - edge) {
        container.scrollTop += 12;
      }
    } else if (event.clientX < rect.left + edge) {
      container.scrollLeft += rtl ? 12 : -12;
    } else if (event.clientX > rect.right - edge) {
      container.scrollLeft += rtl ? -12 : 12;
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const items = this.options.getItems();
    if (items.length === 0) return;

    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const focusedIdx = items.findIndex(
      (item) => item === event.target || path.includes(item) || item.contains(event.target as Node),
    );

    if (event.key === ' ') {
      if (this.keyboardGrabbedIndex === -1 && focusedIdx !== -1) {
        event.preventDefault();
        this.keyboardGrabbedIndex = focusedIdx;
        this.keyboardStartIndex = focusedIdx;
        this.setGrabbedState(items, focusedIdx);
        this.announceKey('grabbed', { position: focusedIdx + 1, total: items.length });
        this.host.requestUpdate();
      } else if (this.keyboardGrabbedIndex !== -1) {
        event.preventDefault();
        const droppedIdx = this.keyboardGrabbedIndex;
        this.setGrabbedState(items, -1);
        this.keyboardGrabbedIndex = -1;
        this.keyboardStartIndex = -1;
        this.announceKey('dropped', { position: droppedIdx + 1 });
        this.host.requestUpdate();
      }
      return;
    }

    if (this.keyboardGrabbedIndex === -1) return;

    const orientation = this.options.orientation ?? 'vertical';
    const rtl = orientation === 'horizontal' && this.isRtl();
    const prevKey =
      orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const nextKey =
      orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';

    if (event.key === prevKey && this.keyboardGrabbedIndex > 0) {
      event.preventDefault();
      const from = this.keyboardGrabbedIndex;
      const to = from - 1;
      this.keyboardGrabbedIndex = to;
      this.reorder(from, to);
      this.setGrabbedState(this.options.getItems(), to);
      this.announceKey('moved', { position: to + 1, total: this.options.getItems().length });
      return;
    }

    if (event.key === nextKey && this.keyboardGrabbedIndex < items.length - 1) {
      event.preventDefault();
      const from = this.keyboardGrabbedIndex;
      const to = from + 1;
      this.keyboardGrabbedIndex = to;
      this.reorder(from, to);
      this.setGrabbedState(this.options.getItems(), to);
      this.announceKey('moved', { position: to + 1, total: this.options.getItems().length });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const dropped = this.keyboardGrabbedIndex;
      this.setGrabbedState(items, -1);
      this.keyboardGrabbedIndex = -1;
      this.keyboardStartIndex = -1;
      this.announceKey('dropped', { position: dropped + 1 });
      this.host.requestUpdate();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      const current = this.keyboardGrabbedIndex;
      const start = this.keyboardStartIndex;
      this.setGrabbedState(items, -1);
      this.keyboardGrabbedIndex = -1;
      this.keyboardStartIndex = -1;
      if (start !== -1 && current !== start) {
        this.reorder(current, start);
      }
      this.setGrabbedState(this.options.getItems(), -1);
      this.announceKey('cancelled');
      this.host.requestUpdate();
    }
  };
}
