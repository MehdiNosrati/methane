import { getRuntime, type NotificationItem } from '@methane-ui/core';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface NotifyOptions {
  readonly id?: string;
  readonly dedupeKey?: string;
  readonly title?: string;
  readonly message: string;
  readonly tone?: 'info' | 'success' | 'warning' | 'danger';
  readonly durationMs?: number;
}

/**
 * Notification store controller backed by `getRuntime().notifications` with
 * deduplication keys and pauseable auto-dismiss timers.
 */
export class NotificationStoreController implements ReactiveController {
  private readonly host: ReactiveControllerHost | null;
  private unsubscribe: (() => void) | null = null;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly remainingMs = new Map<string, number>();
  private readonly startedAt = new Map<string, number>();
  private readonly dedupeToId = new Map<string, string>();
  private _items: ReadonlyArray<NotificationItem> = [];

  constructor(host: ReactiveControllerHost | null = null) {
    this.host = host;
    this._items = getRuntime().notifications.list();
    this.host?.addController(this);
  }

  get items(): ReadonlyArray<NotificationItem> {
    return this._items;
  }

  hostConnected(): void {
    if (!this.unsubscribe) {
      this.unsubscribe = getRuntime().notifications.subscribe((items) => {
        this._items = items;
        this.host?.requestUpdate();
      });
    }
  }

  hostDisconnected(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  notify(options: NotifyOptions): NotificationItem {
    const store = getRuntime().notifications;

    if (options.dedupeKey) {
      const existingId = this.dedupeToId.get(options.dedupeKey);
      if (existingId) {
        this.dismiss(existingId);
      }
    }

    const created = store.add({
      ...(options.id ? { id: options.id } : {}),
      ...(options.title !== undefined ? { title: options.title } : {}),
      message: options.message,
      ...(options.tone !== undefined ? { tone: options.tone } : {}),
      ...(options.durationMs !== undefined ? { durationMs: options.durationMs } : {}),
    });

    if (options.dedupeKey) {
      this.dedupeToId.set(options.dedupeKey, created.id);
    }

    if (options.durationMs && options.durationMs > 0) {
      this.scheduleAutoDismiss(created.id, options.durationMs);
    }

    this._items = store.list();
    this.host?.requestUpdate();
    return created;
  }

  pause(id: string): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    clearTimeout(timer);
    this.timers.delete(id);
    const total = this.remainingMs.get(id) ?? 0;
    const start = this.startedAt.get(id) ?? Date.now();
    this.remainingMs.set(id, Math.max(0, total - (Date.now() - start)));
  }

  resume(id: string): void {
    const remaining = this.remainingMs.get(id);
    if (remaining === undefined || remaining <= 0 || this.timers.has(id)) return;
    this.scheduleAutoDismiss(id, remaining);
  }

  dismiss(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.remainingMs.delete(id);
    this.startedAt.delete(id);
    for (const [k, mappedId] of this.dedupeToId.entries()) {
      if (mappedId === id) {
        this.dedupeToId.delete(k);
      }
    }
    const removed = getRuntime().notifications.dismiss(id);
    this._items = getRuntime().notifications.list();
    this.host?.requestUpdate();
    return removed;
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.remainingMs.clear();
    this.startedAt.clear();
    this.dedupeToId.clear();
    getRuntime().notifications.clear();
    this._items = [];
    this.host?.requestUpdate();
  }

  private scheduleAutoDismiss(id: string, delayMs: number): void {
    const existing = this.timers.get(id);
    if (existing) clearTimeout(existing);
    this.remainingMs.set(id, delayMs);
    this.startedAt.set(id, Date.now());
    const timer = setTimeout(() => {
      this.dismiss(id);
    }, delayMs);
    this.timers.set(id, timer);
  }
}

export const NotificationStore = NotificationStoreController;
