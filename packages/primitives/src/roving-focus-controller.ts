import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type RovingOrientation = 'horizontal' | 'vertical' | 'both';
export type RovingDirection = 'ltr' | 'rtl' | 'auto';

export interface RovingFocusControllerOptions {
  getItems: () => ReadonlyArray<HTMLElement>;
  orientation?: RovingOrientation;
  loop?: boolean;
  dir?: RovingDirection;
  columns?: number;
  container?: () => HTMLElement | null;
  onActiveChange?: (item: HTMLElement | null, index: number) => void;
}

/**
 * Manages APG single-tabstop roving `tabindex` navigation across 1D/2D collections
 * with Home/End, loop/clamp wrapping, disabled skipping, and `dir="rtl"` horizontal axis reversal.
 */
export class RovingFocusController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private options: RovingFocusControllerOptions;
  private activeIndex = 0;

  constructor(host: ReactiveControllerHost & HTMLElement, options: RovingFocusControllerOptions) {
    this.host = host;
    this.options = options;
    this.host.addController(this);
  }

  get currentIndex(): number {
    return this.activeIndex;
  }

  get currentItem(): HTMLElement | null {
    return this.options.getItems()[this.activeIndex] ?? null;
  }

  updateOptions(options: Partial<RovingFocusControllerOptions>): void {
    this.options = { ...this.options, ...options };
    this.syncTabIndices();
  }

  hostConnected(): void {
    const target = this.resolveContainer();
    target.addEventListener('keydown', this.handleKeyDown);
    target.addEventListener('focusin', this.handleFocusIn);
    this.syncTabIndices();
  }

  hostUpdated(): void {
    this.syncTabIndices();
  }

  hostDisconnected(): void {
    const target = this.resolveContainer();
    target.removeEventListener('keydown', this.handleKeyDown);
    target.removeEventListener('focusin', this.handleFocusIn);
  }

  syncTabIndices(): void {
    const items = this.options.getItems();
    if (items.length === 0) return;

    let validIndex = this.activeIndex;
    const current = items[validIndex];
    if (!current || isItemDisabled(current)) {
      validIndex = items.findIndex((item) => !isItemDisabled(item));
      if (validIndex === -1) validIndex = 0;
      this.activeIndex = validIndex;
    }

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (!item) continue;
      const desired = i === this.activeIndex && !isItemDisabled(item) ? 0 : -1;
      if (item.tabIndex !== desired) {
        item.tabIndex = desired;
      }
    }
  }

  setActiveIndex(index: number, focus = false): void {
    const items = this.options.getItems();
    const target = items[index];
    if (!target || isItemDisabled(target)) return;
    this.activeIndex = index;
    this.syncTabIndices();
    if (focus) {
      target.focus();
    }
    this.options.onActiveChange?.(target, index);
    this.host.requestUpdate();
  }

  private resolveContainer(): HTMLElement {
    return this.options.container?.() ?? this.host;
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

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const items = this.options.getItems();
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const idx = items.findIndex(
      (item) => item === event.target || path.includes(item) || item.contains(event.target as Node),
    );
    if (idx !== -1 && !isItemDisabled(items[idx]!)) {
      if (idx !== this.activeIndex) {
        this.activeIndex = idx;
        this.syncTabIndices();
        this.options.onActiveChange?.(items[idx] ?? null, idx);
      }
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const items = this.options.getItems();
    if (items.length === 0) return;

    const orientation = this.options.orientation ?? 'horizontal';
    const loop = this.options.loop ?? true;
    const rtl = this.isRtl();
    const columns = Math.max(1, this.options.columns ?? 1);

    let nextIndex: number | null = null;
    const key = event.key;

    if (key === 'Home') {
      nextIndex = findFirstEnabled(items);
    } else if (key === 'End') {
      nextIndex = findLastEnabled(items);
    } else if (orientation === 'both' && columns > 1) {
      if (key === 'ArrowRight') {
        nextIndex = stepEnabled(items, this.activeIndex, rtl ? -1 : 1, loop);
      } else if (key === 'ArrowLeft') {
        nextIndex = stepEnabled(items, this.activeIndex, rtl ? 1 : -1, loop);
      } else if (key === 'ArrowDown') {
        nextIndex = stepEnabled(items, this.activeIndex, columns, loop);
      } else if (key === 'ArrowUp') {
        nextIndex = stepEnabled(items, this.activeIndex, -columns, loop);
      }
    } else {
      const forwardKey =
        orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
      const backwardKey =
        orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';

      if (key === forwardKey) {
        nextIndex = stepEnabled(items, this.activeIndex, 1, loop);
      } else if (key === backwardKey) {
        nextIndex = stepEnabled(items, this.activeIndex, -1, loop);
      }
    }

    if (nextIndex !== null) {
      event.preventDefault();
      this.setActiveIndex(nextIndex, true);
    }
  };
}

function isItemDisabled(el: HTMLElement): boolean {
  return (
    el.hasAttribute('disabled') ||
    el.getAttribute('aria-disabled') === 'true' ||
    (el as HTMLElement & { disabled?: boolean }).disabled === true
  );
}

function findFirstEnabled(items: ReadonlyArray<HTMLElement>): number | null {
  for (let i = 0; i < items.length; i += 1) {
    if (!isItemDisabled(items[i]!)) return i;
  }
  return null;
}

function findLastEnabled(items: ReadonlyArray<HTMLElement>): number | null {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (!isItemDisabled(items[i]!)) return i;
  }
  return null;
}

function stepEnabled(
  items: ReadonlyArray<HTMLElement>,
  from: number,
  delta: number,
  loop: boolean,
): number | null {
  const len = items.length;
  if (len === 0) return null;

  if (!loop) {
    let cursor = from + delta;
    while (cursor >= 0 && cursor < len) {
      if (!isItemDisabled(items[cursor]!)) return cursor;
      cursor += Math.sign(delta);
    }
    return null;
  }

  for (let step = 1; step <= len; step += 1) {
    const idx = (((from + delta * step) % len) + len) % len;
    if (!isItemDisabled(items[idx]!)) {
      return idx;
    }
  }
  return null;
}
