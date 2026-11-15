import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  FormattingUtils,
  SlotCollectionController,
  type DataControllerStatus,
  type DataSource,
} from '@methane/primitives';
import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { activityFeedMessages } from './activity-feed.messages.js';
import { activityFeedStyles } from './activity-feed.styles.js';

export interface ActivityFeedEntry {
  readonly id?: string;
  readonly title?: string;
  readonly label?: string;
  readonly actor?: string;
  readonly description?: string;
  readonly timestamp?: string | number | Date;
}

/**
 * `<mth-activity-feed>`: activity stream (`role="feed"`) combining `DataController`
 * async queries, `SlotCollectionController` Light-DOM children, and `FormattingUtils`
 * relative timestamps.
 */
export class MthActivityFeed extends UIElement {
  static override messages = activityFeedMessages;
  static override styles = activityFeedStyles;

  @property({ attribute: false })
  items: ReadonlyArray<ActivityFeedEntry> | null = null;

  @property({ attribute: false })
  dataSource: DataSource<ActivityFeedEntry, string> | null = null;

  @property({ type: String })
  filter = '';

  @property({ type: Boolean, attribute: 'relative-time' })
  relativeTime = true;

  @property({ type: String })
  label = '';

  @property({ type: String, attribute: 'empty-text' })
  emptyText = '';

  @property({ type: String, attribute: 'error-text' })
  errorText = '';

  @property({ type: String, attribute: 'loading-text' })
  loadingText = '';

  private readonly slotCtrl: SlotCollectionController<HTMLElement>;
  private readonly dataCtrl: DataController<ActivityFeedEntry, string>;

  constructor() {
    super();

    this.slotCtrl = new SlotCollectionController<HTMLElement>(this, {
      filter: (el): el is HTMLElement => el instanceof HTMLElement && !el.hasAttribute('slot'),
    });

    this.dataCtrl = new DataController<ActivityFeedEntry, string>(this, {
      autoLoad: false,
      onStateChange: (status) => {
        this.syncStatusStates(status);
        this.emitEvent('mth-data-state', {
          detail: { status, count: this.dataCtrl.items.length },
        });
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.syncStatusStates(this.dataCtrl.status);
  }

  protected override willUpdate(changedProperties: PropertyValues): void {
    super.willUpdate(changedProperties);
    if (changedProperties.has('dataSource')) {
      this.dataCtrl.setDataSource(this.dataSource, { load: false });
    }
  }

  getDataStatus(): DataControllerStatus {
    return this.dataCtrl.status;
  }

  async query(filterText?: string): Promise<void> {
    if (filterText !== undefined) {
      this.filter = filterText;
    }
    await this.dataCtrl.setFilter(this.filter || undefined);
  }

  async refresh(): Promise<void> {
    await this.dataCtrl.refresh();
  }

  private syncStatusStates(status: DataControllerStatus): void {
    this.setCustomState('loading', status === 'loading' || status === 'refreshing');
    this.setCustomState('empty', status === 'empty');
    this.setCustomState('error', status === 'error');
  }

  private formatTimestamp(ts: string | number | Date | undefined): string {
    if (ts === undefined || ts === '') return '';
    if (!this.relativeTime) {
      return typeof ts === 'string' ? ts : FormattingUtils.formatDate(ts, this.resolvedLocale || 'en');
    }
    const ms = ts instanceof Date ? ts.getTime() : typeof ts === 'number' ? ts : Date.parse(ts);
    if (!Number.isFinite(ms)) {
      return String(ts);
    }
    return FormattingUtils.formatRelativeTime(ms, this.resolvedLocale || 'en');
  }

  private renderEntries(entries: ReadonlyArray<ActivityFeedEntry>) {
    if (entries.length === 0) {
      return html`
        <div part="status" class="status" data-status="empty">
          <slot name="empty">${this.emptyText || this.t('emptyText')}</slot>
        </div>
      `;
    }

    return entries.map((entry) => {
      const title = entry.title ?? entry.label ?? entry.id ?? '';
      const timeLabel = this.formatTimestamp(entry.timestamp);
      return html`
        <article part="item" class="item">
          <div class="item-top">
            <div part="title" class="title-line">
              ${entry.actor ? html`<span part="actor" class="actor">${entry.actor}</span>` : nothing}
              <span>${title}</span>
            </div>
            ${timeLabel ? html`<span part="timestamp" class="timestamp">${timeLabel}</span>` : nothing}
          </div>
          ${entry.description
            ? html`<div part="description" class="description">${entry.description}</div>`
            : nothing}
        </article>
      `;
    });
  }

  override render() {
    const ariaLabel = this.label.trim() || this.t('feedLabel');
    const status = this.dataCtrl.status;
    const isLoading = status === 'loading' || status === 'refreshing';

    let content;
    if (this.dataSource) {
      if (status === 'loading') {
        content = html`
          <div part="status" class="status" role="status" data-status="loading">
            <slot name="loading">${this.loadingText || this.t('loadingText')}</slot>
          </div>
        `;
      } else if (status === 'error') {
        content = html`
          <div part="status" class="status" role="alert" data-status="error">
            <slot name="error">${this.errorText || this.t('errorText')}</slot>
            <button part="retry" class="retry" type="button" @click=${() => void this.refresh()}>
              ${this.t('retryLabel')}
            </button>
          </div>
        `;
      } else if (status === 'empty') {
        content = html`
          <div part="status" class="status" data-status="empty">
            <slot name="empty">${this.emptyText || this.t('emptyText')}</slot>
          </div>
        `;
      } else if (status === 'ready' || status === 'refreshing') {
        content = this.renderEntries(this.dataCtrl.items);
      } else {
        content = html`<slot></slot>`;
      }
    } else if (this.items !== null) {
      content = this.renderEntries(this.items);
    } else if (this.slotCtrl.slottedElements.length > 0) {
      content = html`<slot></slot>`;
    } else {
      content = html`<slot></slot>`;
    }

    return html`
      <div
        part="base"
        class="base"
        role="feed"
        aria-label=${ariaLabel}
        aria-busy=${isLoading ? 'true' : 'false'}
      >
        ${content}
      </div>
    `;
  }
}
