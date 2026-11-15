import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Locked Section 7 DataQuery<Filter> contract.
 */
export interface DataQuery<Filter = unknown> {
  cursor?: string;
  page?: { index: number; size: number };
  sort?: ReadonlyArray<{ field: string; direction: 'asc' | 'desc' }>;
  filter?: Filter;
  signal: AbortSignal;
}

/**
 * Locked Section 7 DataResult<T> contract.
 */
export interface DataResult<T> {
  items: ReadonlyArray<T>;
  total?: number;
  nextCursor?: string | null;
}

/**
 * Locked Section 7 DataSource<T, Filter> contract.
 */
export interface DataSource<T, Filter = unknown> {
  query(request: DataQuery<Filter>): Promise<DataResult<T>>;
}

export type DataControllerStatus =
  | 'idle'
  | 'loading'
  | 'refreshing'
  | 'empty'
  | 'error'
  | 'ready';

export interface DataControllerOptions<T, Filter = unknown> {
  source?: DataSource<T, Filter>;
  cacheTimeMs?: number;
  autoLoad?: boolean;
  initialFilter?: Filter;
  initialPage?: { index: number; size: number };
  initialSort?: ReadonlyArray<{ field: string; direction: 'asc' | 'desc' }>;
  onStateChange?: (status: DataControllerStatus) => void;
}

interface CacheEntry<T> {
  readonly result: DataResult<T>;
  readonly timestamp: number;
}

/**
 * Coordinates async `DataSource<T>` queries with `AbortController` race protection,
 * keyed result caching & invalidation, pagination/cursor append, and loading state transitions.
 */
export class DataController<T, Filter = unknown> implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private source: DataSource<T, Filter> | null;
  private readonly cacheTimeMs: number;
  private readonly autoLoad: boolean;
  private readonly onStateChange: ((status: DataControllerStatus) => void) | undefined;

  private _status: DataControllerStatus = 'idle';
  private _items: ReadonlyArray<T> = [];
  private _total: number | undefined;
  private _nextCursor: string | null | undefined;
  private _error: unknown = null;

  private _cursor: string | undefined;
  private _page: { index: number; size: number } | undefined;
  private _sort: ReadonlyArray<{ field: string; direction: 'asc' | 'desc' }> | undefined;
  private _filter: Filter | undefined;

  private readonly cache = new Map<string, CacheEntry<T>>();
  private abortController: AbortController | null = null;
  private activeRequestSeq = 0;

  constructor(host: ReactiveControllerHost, options: DataControllerOptions<T, Filter> = {}) {
    this.host = host;
    this.source = options.source ?? null;
    this.cacheTimeMs = options.cacheTimeMs ?? 30_000;
    this.autoLoad = options.autoLoad ?? false;
    this._filter = options.initialFilter;
    this._page = options.initialPage;
    this._sort = options.initialSort;
    this.onStateChange = options.onStateChange;
    this.host.addController(this);
  }

  get status(): DataControllerStatus {
    return this._status;
  }

  get items(): ReadonlyArray<T> {
    return this._items;
  }

  get total(): number | undefined {
    return this._total;
  }

  get nextCursor(): string | null | undefined {
    return this._nextCursor;
  }

  get error(): unknown {
    return this._error;
  }

  get filter(): Filter | undefined {
    return this._filter;
  }

  get sort(): ReadonlyArray<{ field: string; direction: 'asc' | 'desc' }> | undefined {
    return this._sort;
  }

  get page(): { index: number; size: number } | undefined {
    return this._page;
  }

  hostConnected(): void {
    if (this.autoLoad && this.source && this._status === 'idle') {
      void this.load();
    }
  }

  hostDisconnected(): void {
    this.abort();
  }

  setDataSource(source: DataSource<T, Filter> | null, options: { load?: boolean } = {}): void {
    this.source = source;
    this.invalidateAll();
    if (options.load && source) {
      void this.load();
    }
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  invalidate(keyFilter?: (cacheKey: string) => boolean): void {
    if (!keyFilter) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (keyFilter(key)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  async setFilter(filter: Filter | undefined): Promise<DataResult<T> | null> {
    this._filter = filter;
    this._cursor = undefined;
    if (this._page) {
      this._page = { index: 0, size: this._page.size };
    }
    return this.load();
  }

  async setSort(
    sort: ReadonlyArray<{ field: string; direction: 'asc' | 'desc' }> | undefined,
  ): Promise<DataResult<T> | null> {
    this._sort = sort;
    this._cursor = undefined;
    return this.load();
  }

  async setPage(page: { index: number; size: number } | undefined): Promise<DataResult<T> | null> {
    this._page = page;
    this._cursor = undefined;
    return this.load();
  }

  async refresh(): Promise<DataResult<T> | null> {
    return this.load({ bypassCache: true });
  }

  async loadMore(): Promise<DataResult<T> | null> {
    if (!this._nextCursor) return null;
    this._cursor = this._nextCursor;
    return this.load({ append: true, bypassCache: true });
  }

  async load(options: { bypassCache?: boolean; append?: boolean } = {}): Promise<DataResult<T> | null> {
    if (!this.source) {
      this.setStatus('idle');
      return null;
    }

    const cacheKey = this.buildCacheKey();
    if (!options.bypassCache && !options.append && this.cacheTimeMs > 0) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp <= this.cacheTimeMs) {
        this.applyResult(cached.result, false);
        return cached.result;
      }
    }

    this.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const seq = ++this.activeRequestSeq;

    this._error = null;
    this.setStatus(this._items.length > 0 ? 'refreshing' : 'loading');

    const query: DataQuery<Filter> = {
      signal: controller.signal,
      ...(this._cursor !== undefined ? { cursor: this._cursor } : {}),
      ...(this._page !== undefined ? { page: this._page } : {}),
      ...(this._sort !== undefined ? { sort: this._sort } : {}),
      ...(this._filter !== undefined ? { filter: this._filter } : {}),
    };

    try {
      const result = await this.source.query(query);
      if (seq !== this.activeRequestSeq || controller.signal.aborted) {
        return null;
      }
      if (!options.append && this.cacheTimeMs > 0) {
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
      }
      this.applyResult(result, Boolean(options.append));
      return result;
    } catch (err) {
      if (seq !== this.activeRequestSeq || controller.signal.aborted || isAbortError(err)) {
        return null;
      }
      this._error = err;
      this.setStatus('error');
      return null;
    } finally {
      if (this.abortController === controller) {
        this.abortController = null;
      }
    }
  }

  private applyResult(result: DataResult<T>, append: boolean): void {
    this._items = append ? [...this._items, ...result.items] : result.items;
    this._total = result.total;
    this._nextCursor = result.nextCursor;
    this._error = null;
    this.setStatus(this._items.length === 0 ? 'empty' : 'ready');
  }

  private setStatus(status: DataControllerStatus): void {
    if (this._status === status) {
      this.host.requestUpdate();
      return;
    }
    this._status = status;
    this.onStateChange?.(status);
    this.host.requestUpdate();
  }

  private buildCacheKey(): string {
    return JSON.stringify({
      cursor: this._cursor ?? null,
      page: this._page ?? null,
      sort: this._sort ?? null,
      filter: this._filter ?? null,
    });
  }
}

export function createArrayDataSource<T extends Record<string, unknown>>(
  sourceItems: ReadonlyArray<T>,
  filterPredicate?: (item: T, filter: unknown) => boolean,
): DataSource<T> {
  return {
    async query(req) {
      if (req.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      let rows = [...sourceItems];
      if (req.filter !== undefined && req.filter !== null && req.filter !== '') {
        if (filterPredicate) {
          rows = rows.filter((item) => filterPredicate(item, req.filter));
        } else if (typeof req.filter === 'string') {
          const needle = req.filter.toLowerCase();
          rows = rows.filter((item) =>
            Object.values(item).some((val) => String(val).toLowerCase().includes(needle)),
          );
        }
      }
      if (req.sort && req.sort.length > 0) {
        rows.sort((a, b) => {
          for (const rule of req.sort ?? []) {
            const av = String(a[rule.field] ?? '');
            const bv = String(b[rule.field] ?? '');
            const cmp = av.localeCompare(bv);
            if (cmp !== 0) {
              return rule.direction === 'asc' ? cmp : -cmp;
            }
          }
          return 0;
        });
      }
      const total = rows.length;
      if (req.page) {
        const start = req.page.index * req.page.size;
        rows = rows.slice(start, start + req.page.size);
      }
      return { items: rows, total, nextCursor: null };
    },
  };
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name?: string }).name === 'AbortError')
  );
}
