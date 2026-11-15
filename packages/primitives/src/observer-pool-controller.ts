import { getRuntime } from '@methane-ui/core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface ObserverPoolControllerOptions {
  idleTimeoutMs?: number;
  onIdleChange?: (idle: boolean) => void;
}

/**
 * Reactive controller wrapping `getRuntime().observers` (`ResizeObserver`,
 * `IntersectionObserver`, `MediaQueryList`), plus click-outside and user-idle tracking.
 */
export class ObserverPoolController implements ReactiveController {
  private readonly host: ReactiveControllerHost & HTMLElement;
  private readonly idleTimeoutMs: number | undefined;
  private readonly onIdleChange: ((idle: boolean) => void) | undefined;

  private readonly unsubscribers = new Set<() => void>();
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private _isIdle = false;
  private idleActive = false;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: ObserverPoolControllerOptions = {},
  ) {
    this.host = host;
    this.idleTimeoutMs = options.idleTimeoutMs;
    this.onIdleChange = options.onIdleChange;
    this.host.addController(this);
  }

  get isIdle(): boolean {
    return this._isIdle;
  }

  hostConnected(): void {
    if (this.idleTimeoutMs !== undefined && this.idleTimeoutMs > 0) {
      this.startIdleDetection(this.idleTimeoutMs);
    }
  }

  hostDisconnected(): void {
    this.cleanupAll();
  }

  observeResize(
    target: Element,
    callback: (entry: ResizeObserverEntry) => void,
  ): () => void {
    const unsub = getRuntime().observers.observeResize(target, callback);
    return this.track(unsub);
  }

  observeIntersection(
    target: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options?: IntersectionObserverInit,
  ): () => void {
    const unsub = getRuntime().observers.observeIntersection(target, callback, options);
    return this.track(unsub);
  }

  observeMedia(query: string, callback: (matches: boolean) => void): () => void {
    const unsub = getRuntime().observers.observeMedia(query, callback);
    return this.track(unsub);
  }

  observeClickOutside(
    target: HTMLElement | (() => HTMLElement | null),
    handler: (event: Event) => void,
  ): () => void {
    const doc = this.host.ownerDocument ?? document;
    const listener = (event: Event): void => {
      const container = typeof target === 'function' ? target() : target;
      if (!container) return;
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      const eventTarget = event.target as Node | null;
      const inside =
        path.includes(container) || (eventTarget !== null && container.contains(eventTarget));
      if (!inside) {
        handler(event);
      }
    };
    doc.addEventListener('pointerdown', listener, true);
    return this.track(() => doc.removeEventListener('pointerdown', listener, true));
  }

  startIdleDetection(timeoutMs: number): () => void {
    this.stopIdleDetection();
    const doc = this.host.ownerDocument ?? document;
    this.idleActive = true;

    const resetTimer = (): void => {
      if (!this.idleActive) return;
      if (this._isIdle) {
        this._isIdle = false;
        this.onIdleChange?.(false);
        this.host.requestUpdate();
      }
      if (this.idleTimer !== null) {
        clearTimeout(this.idleTimer);
      }
      this.idleTimer = setTimeout(() => {
        if (!this.idleActive) return;
        this._isIdle = true;
        this.onIdleChange?.(true);
        this.host.requestUpdate();
      }, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll'] as const;
    for (const evt of events) {
      doc.addEventListener(evt, resetTimer, { passive: true });
    }
    resetTimer();

    return this.track(() => {
      this.stopIdleDetection();
      for (const evt of events) {
        doc.removeEventListener(evt, resetTimer);
      }
    });
  }

  stopIdleDetection(): void {
    this.idleActive = false;
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private track(unsub: () => void): () => void {
    const wrapped = () => {
      if (this.unsubscribers.delete(wrapped)) {
        unsub();
      }
    };
    this.unsubscribers.add(wrapped);
    return wrapped;
  }

  private cleanupAll(): void {
    this.stopIdleDetection();
    for (const unsub of Array.from(this.unsubscribers)) {
      unsub();
    }
    this.unsubscribers.clear();
  }
}
