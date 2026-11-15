import { UIElement, type PropertyValues } from '@methane-ui/core';
import {
  DataController,
  ObserverPoolController,
  type DataControllerStatus,
  type DataResult,
  type DataSource,
} from '@methane-ui/primitives';
import { html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { infiniteScrollMessages } from './infinite-scroll.messages.js';
import { infiniteScrollStyles } from './infinite-scroll.styles.js';

/**
 * `<mth-infinite-scroll>`: IntersectionObserver sentinel stream powered by
 * `ObserverPoolController` and `DataController` with an accessible button fallback.
 */
export class MthInfiniteScroll<T = Record<string, unknown>> extends UIElement {
  static override shadowRootOptions = { ...UIElement.shadowRootOptions, delegatesFocus: true };
  static override messages = infiniteScrollMessages;
  static override styles = infiniteScrollStyles;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  complete = false;

  @property({ type: Boolean, attribute: 'auto-load', reflect: true })
  autoLoad = true;

  @property({ type: Number })
  threshold = 0.1;

  @property({ type: String, attribute: 'root-margin' })
  rootMargin = '100px';

  @property({ attribute: false })
  dataSource: DataSource<T> | null = null;

  @property({ attribute: false })
  renderItem?: (item: T, index: number) => unknown;

  @query('#mth-infinite-sentinel')
  private sentinelEl!: HTMLElement | null;

  private readonly dataCtrl: DataController<T>;
  private readonly observerCtrl: ObserverPoolController;
  private sentinelUnsub: (() => void) | null = null;
  private observedSentinel: HTMLElement | null = null;
  private lastBoundSource: DataSource<T> | null = null;

  constructor() {
    super();

    this.dataCtrl = new DataController<T>(this, {
      onStateChange: (status) => {
        this.syncStatusStates(status);
      },
    });
    this.observerCtrl = new ObserverPoolController(this);
  }

  get status(): DataControllerStatus {
    return this.dataCtrl.status;
  }

  get items(): ReadonlyArray<T> {
    return this.dataCtrl.items;
  }

  get nextCursor(): string | null | undefined {
    return this.dataCtrl.nextCursor;
  }

  get error(): unknown {
    return this.dataCtrl.error;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncSentinelObserver();
  }

  override disconnectedCallback(): void {
    this.detachSentinel();
    super.disconnectedCallback();
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('dataSource') && this.dataSource !== this.lastBoundSource) {
      this.setDataSource(this.dataSource, { load: this.autoLoad && Boolean(this.dataSource) });
    }
    if (changedProperties.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    if (changedProperties.has('complete')) {
      this.setCustomState('complete', this.complete);
    }
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    if (
      changedProperties.has('disabled') ||
      changedProperties.has('complete') ||
      changedProperties.has('autoLoad') ||
      changedProperties.has('threshold') ||
      changedProperties.has('rootMargin') ||
      this.sentinelEl !== this.observedSentinel
    ) {
      this.syncSentinelObserver();
    }
  }

  setDataSource(source: DataSource<T> | null, options: { load?: boolean } = {}): void {
    this.lastBoundSource = source;
    this.dataSource = source;
    this.dataCtrl.setDataSource(source, options);
  }

  query(filter?: unknown): Promise<DataResult<T> | null> {
    return this.dataCtrl.setFilter(filter);
  }

  refresh(): Promise<DataResult<T> | null> {
    return this.dataCtrl.refresh();
  }

  async loadMore(): Promise<DataResult<T> | null> {
    if (this.disabled || this.isEffectivelyComplete()) return null;
    if (this.dataCtrl.status === 'loading' || this.dataCtrl.status === 'refreshing') {
      return null;
    }

    const allowed = this.emitEvent('mth-load-more', {
      cancelable: true,
      detail: { cursor: this.dataCtrl.nextCursor ?? null },
    });
    if (!allowed) return null;

    if (this.dataCtrl.nextCursor) {
      return this.dataCtrl.loadMore();
    }
    if (this.dataSource && this.dataCtrl.status === 'idle') {
      return this.dataCtrl.load();
    }
    return null;
  }

  private isEffectivelyComplete(): boolean {
    if (this.complete) return true;
    return this.dataCtrl.status === 'ready' && this.dataCtrl.nextCursor === null;
  }

  private syncStatusStates(status: DataControllerStatus): void {
    const isLoading = status === 'loading' || status === 'refreshing';
    this.setCustomState('loading', isLoading);
    this.setCustomState('error', status === 'error');
    this.setCustomState('empty', status === 'empty');
    this.setCustomState('complete', this.isEffectivelyComplete());
  }

  private detachSentinel(): void {
    this.sentinelUnsub?.();
    this.sentinelUnsub = null;
    this.observedSentinel = null;
  }

  private syncSentinelObserver(): void {
    this.detachSentinel();
    const sentinel = this.sentinelEl;
    if (!this.isConnected || !sentinel || this.disabled || !this.autoLoad || this.isEffectivelyComplete()) {
      return;
    }

    this.observedSentinel = sentinel;
    this.sentinelUnsub = this.observerCtrl.observeIntersection(
      sentinel,
      (entry) => {
        if (entry.isIntersecting) {
          void this.loadMore();
        }
      },
      { threshold: this.threshold, rootMargin: this.rootMargin },
    );
  }

  private defaultRenderItem(item: T): string {
    if (item && typeof item === 'object') {
      const rec = item as Record<string, unknown>;
      return String(rec.label ?? rec.name ?? rec.title ?? rec.id ?? JSON.stringify(rec));
    }
    return String(item);
  }

  private readonly handleLoadMoreClick = (): void => {
    void this.loadMore();
  };

  private readonly handleRetryClick = (): void => {
    void this.refresh();
  };

  override render() {
    const isLoading = this.dataCtrl.status === 'loading' || this.dataCtrl.status === 'refreshing';
    const isComplete = this.isEffectivelyComplete();
    const isError = this.dataCtrl.status === 'error';
    const isEmpty = this.dataCtrl.status === 'empty';

    return html`
      <div part="base" class="base" role="region" aria-label=${this.t('regionLabel')}>
        <div part="list" class="list">
          ${this.dataCtrl.items.map(
            (item, idx) => html`
              <div part="item" class="item">
                ${this.renderItem ? this.renderItem(item, idx) : this.defaultRenderItem(item)}
              </div>
            `,
          )}
          <slot></slot>
        </div>

        <div id="mth-infinite-sentinel" part="sentinel" class="sentinel" aria-hidden="true"></div>

        <div class="controls">
          <div part="status" class="status" role="status" aria-live="polite" data-error=${isError ? 'true' : 'false'}>
            ${isLoading
              ? html`<slot name="loading">${this.t('loading')}</slot>`
              : isError
                ? html`<slot name="error">${this.t('error')}</slot>`
                : isEmpty
                  ? html`<slot name="empty">${this.t('empty')}</slot>`
                  : isComplete
                    ? html`<slot name="complete">${this.t('complete')}</slot>`
                    : nothing}
          </div>

          ${isError
            ? html`
                <button
                  type="button"
                  part="retry"
                  class="action-btn"
                  ?disabled=${this.disabled}
                  @click=${this.handleRetryClick}
                >
                  ${this.t('retry')}
                </button>
              `
            : !isComplete
              ? html`
                  <button
                    type="button"
                    part="load-more"
                    class="action-btn"
                    ?disabled=${this.disabled || isLoading}
                    @click=${this.handleLoadMoreClick}
                  >
                    ${isLoading ? this.t('loading') : this.t('loadMore')}
                  </button>
                `
              : nothing}
        </div>
      </div>
    `;
  }
}
