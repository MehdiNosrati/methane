import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  FormattingUtils,
  type DataControllerStatus,
  type DataResult,
  type DataSource,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { loadMoreMessages } from './load-more.messages.js';
import { loadMoreStyles } from './load-more.styles.js';

/**
 * `<mth-load-more>`: Explicit load-more pagination control backed by
 * `DataController` with standalone event support, progress summary, and error retry.
 */
export class MthLoadMore<T = Record<string, unknown>> extends UIElement {
  static override shadowRootOptions = { ...UIElement.shadowRootOptions, delegatesFocus: true };
  static override messages = loadMoreMessages;
  static override styles = loadMoreStyles;

  @property({ type: Boolean, reflect: true })
  loading = false;

  @property({ type: Boolean, reflect: true })
  complete = false;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Number, attribute: 'loaded-count' })
  loadedCount = 0;

  @property({ type: Number, attribute: 'total-count' })
  totalCount = 0;

  @property({ attribute: false })
  dataSource: DataSource<T> | null = null;

  @property({ attribute: false })
  renderItem?: (item: T, index: number) => unknown;

  private readonly dataCtrl: DataController<T>;
  private lastBoundSource: DataSource<T> | null = null;

  constructor() {
    super();

    this.dataCtrl = new DataController<T>(this, {
      onStateChange: (status) => {
        if (status === 'ready') {
          const hasMore = this.dataCtrl.nextCursor !== null && this.dataCtrl.nextCursor !== undefined;
          this.complete = !hasMore;
        }
        this.syncStatusStates(status);
      },
    });
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

  get total(): number | undefined {
    return this.dataCtrl.total;
  }

  get error(): unknown {
    return this.dataCtrl.error;
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('dataSource') && this.dataSource !== this.lastBoundSource) {
      this.setDataSource(this.dataSource, { load: Boolean(this.dataSource) });
    }
    if (changedProperties.has('disabled')) {
      this.setCustomState('disabled', this.disabled);
    }
    if (changedProperties.has('complete')) {
      this.setCustomState('complete', this.complete);
    }
    if (changedProperties.has('loading')) {
      this.setCustomState('loading', this.isLoadingState());
    }
  }

  setDataSource(source: DataSource<T> | null, options: { load?: boolean } = {}): void {
    this.lastBoundSource = source;
    this.dataSource = source;
    this.dataCtrl.setDataSource(source, { load: options.load ?? false });
    this.complete = false;
    this.syncStatusStates(this.dataCtrl.status);
  }

  async query(q = ''): Promise<DataResult<T> | null> {
    const result = await this.dataCtrl.setFilter(q as never);
    this.syncCompletionFromController();
    return result;
  }

  async refresh(): Promise<DataResult<T> | null> {
    const result = await this.dataCtrl.refresh();
    this.syncCompletionFromController();
    return result;
  }

  async loadMore(): Promise<DataResult<T> | null> {
    if (this.disabled || this.isLoadingState() || this.complete) {
      return null;
    }

    const detail = { cursor: this.dataCtrl.nextCursor ?? null };
    if (!this.emitEvent('mth-load-more', { cancelable: true, detail })) {
      return null;
    }

    if (!this.lastBoundSource) {
      return null;
    }

    const result = this.dataCtrl.status === 'idle' ? await this.dataCtrl.load() : await this.dataCtrl.loadMore();
    this.syncCompletionFromController();
    return result;
  }

  private isLoadingState(): boolean {
    return this.loading || this.dataCtrl.status === 'loading' || this.dataCtrl.status === 'refreshing';
  }

  private syncCompletionFromController(): void {
    const hasMore = this.dataCtrl.nextCursor !== null && this.dataCtrl.nextCursor !== undefined;
    if (this.dataCtrl.status === 'ready' && !hasMore) {
      this.complete = true;
    } else if (hasMore) {
      this.complete = false;
    }
    this.syncStatusStates(this.dataCtrl.status);
  }

  private syncStatusStates(status: DataControllerStatus): void {
    this.setCustomState('loading', this.loading || status === 'loading' || status === 'refreshing');
    this.setCustomState('error', status === 'error');
    this.setCustomState('empty', status === 'empty');
    this.setCustomState('complete', this.complete);
  }

  private formatDefaultItem(item: T): string {
    if (typeof item === 'string' || typeof item === 'number') {
      return String(item);
    }
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      if (typeof record['label'] === 'string') return record['label'];
      if (typeof record['title'] === 'string') return record['title'];
      if (typeof record['name'] === 'string') return record['name'];
      if (typeof record['id'] === 'string' || typeof record['id'] === 'number') {
        return String(record['id']);
      }
    }
    return String(item);
  }

  override render() {
    const isBusy = this.isLoadingState();
    const isError = this.dataCtrl.status === 'error';
    const isEmpty = this.dataCtrl.status === 'empty' && this.dataCtrl.items.length === 0;
    const regionLabel = this.t('regionLabel');
    const loadMoreLabel = this.t('loadMore');
    const loadingText = this.t('loading');
    const completeText = this.t('complete');
    const errorText = this.t('error');
    const retryText = this.t('retry');
    const emptyText = this.t('empty');

    const effectiveLoaded = this.lastBoundSource ? this.dataCtrl.items.length : this.loadedCount;
    const effectiveTotal = this.lastBoundSource ? (this.dataCtrl.total ?? 0) : this.totalCount;
    const progressText =
      effectiveTotal > 0
        ? this.t('progress', {
            loaded: FormattingUtils.formatNumber(effectiveLoaded, this.resolvedLocale),
            total: FormattingUtils.formatNumber(effectiveTotal, this.resolvedLocale),
          })
        : '';

    return html`
      <section
        part="base"
        class="base"
        role="region"
        aria-label=${regionLabel}
        aria-busy=${isBusy ? 'true' : 'false'}
      >
        ${this.dataCtrl.items.length > 0
          ? html`
              <ul part="list" class="list">
                ${this.dataCtrl.items.map(
                  (item, index) => html`
                    <li part="item" class="item">
                      ${this.renderItem ? this.renderItem(item, index) : this.formatDefaultItem(item)}
                    </li>
                  `,
                )}
              </ul>
            `
          : nothing}

        <slot></slot>

        <div class="controls">
          ${progressText ? html`<p part="progress" class="progress">${progressText}</p>` : nothing}
          ${isEmpty ? html`<p part="status" class="status" role="status" aria-live="polite"><slot name="empty">${emptyText}</slot></p>` : nothing}
          ${isError
            ? html`
                <p part="status" class="status status--error" role="status" aria-live="polite">
                  <slot name="error">${errorText}</slot>
                </p>
                <button
                  type="button"
                  part="retry"
                  class="action-btn"
                  ?disabled=${this.disabled}
                  @click=${() => void this.refresh()}
                >
                  ${retryText}
                </button>
              `
            : nothing}
          ${!isError && this.complete
            ? html`
                <p part="status" class="status" role="status" aria-live="polite">
                  <slot name="complete">${completeText}</slot>
                </p>
              `
            : !isError && !isEmpty
              ? html`
                  ${isBusy
                    ? html`
                        <p part="status" class="status" role="status" aria-live="polite">
                          <slot name="loading">${loadingText}</slot>
                        </p>
                      `
                    : nothing}
                  <button
                    type="button"
                    part="button"
                    class="action-btn"
                    ?disabled=${this.disabled || isBusy}
                    aria-disabled=${this.disabled || isBusy ? 'true' : 'false'}
                    @click=${() => void this.loadMore()}
                  >
                    <slot name="label">${isBusy ? loadingText : loadMoreLabel}</slot>
                  </button>
                `
              : nothing}
        </div>
      </section>
    `;
  }
}
