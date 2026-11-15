import { UIElement, type PropertyValues } from '@methane/core';
import {
  DataController,
  FormattingUtils,
  VirtualizerController,
  type DataControllerStatus,
  type DataSource,
} from '@methane/primitives';
import { html } from 'lit';
import { property, query } from 'lit/decorators.js';
import {
  attachDynamicSheet,
  resolveEffectiveDir,
  sanitizeCssNumber,
} from '../shared/style-sheet.js';
import { auditLogMessages } from './audit-log.messages.js';
import { auditLogStyles } from './audit-log.styles.js';

export type AuditSeverity = 'info' | 'warning' | 'critical';
export type AuditSeverityFilter = 'all' | AuditSeverity;

export interface AuditLogEntry {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly resource: string;
  readonly timestamp: string | number | Date;
  readonly severity: AuditSeverity;
}

export interface AuditLogFilter {
  readonly search?: string;
  readonly severity?: AuditSeverityFilter;
}

/**
 * `<mth-audit-log>`: Chronological security/admin audit log with virtualized rows and filtering.
 */
export class MthAuditLog extends UIElement {
  static override shadowRootOptions = {
    ...UIElement.shadowRootOptions,
    delegatesFocus: true,
  };
  static override messages = auditLogMessages;
  static override styles = auditLogStyles;

  @property({ attribute: false })
  entries: ReadonlyArray<AuditLogEntry> = [];

  @property({ attribute: false })
  dataSource: DataSource<AuditLogEntry, AuditLogFilter> | null = null;

  @property({ type: String, reflect: true })
  severity: AuditSeverityFilter = 'all';

  @property({ type: String })
  search = '';

  @property({ type: Number, attribute: 'row-height' })
  rowHeight = 56;

  @query('[part="viewport"]')
  private viewportEl?: HTMLDivElement | null;

  private readonly dataCtrl: DataController<AuditLogEntry, AuditLogFilter>;
  private readonly virtualizer: VirtualizerController;
  private dynamicSheet: CSSStyleSheet | null = null;
  private loadTimer: ReturnType<typeof setTimeout> | undefined;
  private syncedSourceRef: DataSource<AuditLogEntry, AuditLogFilter> | null = null;
  private syncedEntriesRef: ReadonlyArray<AuditLogEntry> | null = null;
  private lastQueriedFilter: AuditLogFilter | undefined;

  constructor() {
    super();
    this.dataCtrl = new DataController<AuditLogEntry, AuditLogFilter>(this, {
      autoLoad: false,
      onStateChange: () => {
        this.virtualizer.setCount(this.dataCtrl.items.length);
      },
    });
    this.virtualizer = new VirtualizerController(this, {
      count: 0,
      estimateSize: () => Math.max(32, this.rowHeight),
      overscan: 4,
      getScrollElement: () => this.viewportEl ?? null,
    });
  }

  get dataStatus(): DataControllerStatus {
    return this.dataCtrl.status;
  }

  get renderedItems(): ReadonlyArray<AuditLogEntry> {
    return this.dataCtrl.items;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.shadowRoot) {
      this.dynamicSheet = attachDynamicSheet(this.shadowRoot, this.dynamicSheet);
    }
    if (this.hasUpdated && (this.dataSource || this.entries.length > 0)) {
      this._scheduleRefresh();
    }
  }

  override disconnectedCallback(): void {
    if (this.loadTimer !== undefined) {
      clearTimeout(this.loadTimer);
      this.loadTimer = undefined;
    }
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    if (this.shadowRoot) {
      this.dynamicSheet = attachDynamicSheet(this.shadowRoot, this.dynamicSheet);
    }
    if (this.dataSource || this.entries.length > 0) {
      this._scheduleRefresh();
    }
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    const sourceChanged = this._ensureDataSource();
    if (sourceChanged && this.hasUpdated) {
      void this.query();
    }
    if (
      (changed.has('search') || changed.has('severity')) &&
      this.hasUpdated &&
      (this.lastQueriedFilter?.search !== this.search ||
        this.lastQueriedFilter?.severity !== this.severity)
    ) {
      void this.query();
    }
    this.setCustomState('loading', this.dataCtrl.status === 'loading');
    this.setCustomState('empty', this.dataCtrl.status === 'empty');
    this.setCustomState('error', this.dataCtrl.status === 'error');
  }

  protected override updated(): void {
    this._syncVirtualSheet();
  }

  async query(filterOverride?: AuditLogFilter): Promise<void> {
    if (this.loadTimer !== undefined) {
      clearTimeout(this.loadTimer);
      this.loadTimer = undefined;
    }
    this._ensureDataSource();
    const nextFilter: AuditLogFilter = filterOverride ?? {
      search: this.search,
      severity: this.severity,
    };
    this.lastQueriedFilter = nextFilter;
    await this.dataCtrl.setFilter(nextFilter);
  }

  private _ensureDataSource(): boolean {
    if (this.dataSource) {
      if (this.syncedSourceRef !== this.dataSource) {
        this.syncedSourceRef = this.dataSource;
        this.syncedEntriesRef = null;
        this.dataCtrl.setDataSource(this.dataSource);
        return true;
      }
      return false;
    }
    if (this.syncedEntriesRef !== this.entries) {
      this.syncedSourceRef = null;
      this.syncedEntriesRef = this.entries;
      this.dataCtrl.setDataSource(this._createFilteredEntriesSource());
      return true;
    }
    return false;
  }

  private _createFilteredEntriesSource(): DataSource<AuditLogEntry, AuditLogFilter> {
    const entries = this.entries;
    return {
      async query(req) {
        if (req.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        const filter = req.filter;
        const q = filter?.search?.trim().toLowerCase() ?? '';
        const filtered = entries.filter((item) => {
          if (filter?.severity && filter.severity !== 'all' && item.severity !== filter.severity) {
            return false;
          }
          if (!q) return true;
          return (
            item.actor.toLowerCase().includes(q) ||
            item.action.toLowerCase().includes(q) ||
            item.resource.toLowerCase().includes(q)
          );
        });
        return { items: filtered, total: filtered.length, nextCursor: null };
      },
    };
  }

  private _scheduleRefresh(): void {
    if (this.loadTimer !== undefined || !this.isConnected) return;
    this.loadTimer = setTimeout(() => {
      this.loadTimer = undefined;
      if (this.dataSource) {
        this.dataCtrl.setDataSource(this.dataSource);
      } else {
        this.dataCtrl.setDataSource(this._createFilteredEntriesSource());
      }
      void this.query();
    }, 0);
  }

  private _syncVirtualSheet(): void {
    if (!this.dynamicSheet) return;
    const totalH = sanitizeCssNumber(this.virtualizer.totalSize, 0);
    const rules = [`.virtual-list { block-size: ${totalH}px; }`];
    for (const v of this.virtualizer.getVirtualItems()) {
      const y = sanitizeCssNumber(v.start, 0);
      const h = sanitizeCssNumber(v.size, this.rowHeight);
      rules.push(
        `.row[data-row-index="${v.index}"] { block-size: ${h}px; transform: translateY(${y}px); }`,
      );
    }
    this.dynamicSheet.replaceSync(rules.join('\n'));
  }

  private _formatTimestamp(ts: string | number | Date): string {
    const date = ts instanceof Date ? ts : new Date(ts);
    if (Number.isNaN(date.getTime())) return String(ts);
    return FormattingUtils.formatDate(date, this.resolvedLocale, {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  private _formatSeverity(severity: AuditSeverity): string {
    switch (severity) {
      case 'critical':
        return this.t('severityCritical');
      case 'warning':
        return this.t('severityWarning');
      case 'info':
        return this.t('severityInfo');
    }
  }

  override render() {
    const items = this.dataCtrl.items;
    const virtualItems = this.virtualizer.getVirtualItems();
    const status = this.dataCtrl.status;
    const showStatus = status === 'loading' || status === 'empty' || status === 'error';

    return html`
      <div
        part="base"
        class="base"
        role="region"
        aria-label=${this.t('regionLabel')}
        dir=${resolveEffectiveDir(this, this.resolvedDir)}
      >
        <div part="filters" class="filters">
          <input
            type="search"
            aria-label=${this.t('actorFilterLabel')}
            placeholder=${this.t('actorFilterPlaceholder')}
            .value=${this.search}
            @input=${(e: Event) => {
              this.search = (e.target as HTMLInputElement).value;
              this.emitEvent('mth-filter-change', {
                detail: { search: this.search, severity: this.severity },
              });
            }}
          />

          <select
            aria-label=${this.t('severityLabel')}
            .value=${this.severity}
            @change=${(e: Event) => {
              const val = (e.target as HTMLSelectElement).value;
              this.severity =
                val === 'info' || val === 'warning' || val === 'critical' ? val : 'all';
              this.emitEvent('mth-filter-change', {
                detail: { search: this.search, severity: this.severity },
              });
            }}
          >
            <option value="all">${this.t('severityAll')}</option>
            <option value="info">${this.t('severityInfo')}</option>
            <option value="warning">${this.t('severityWarning')}</option>
            <option value="critical">${this.t('severityCritical')}</option>
          </select>
        </div>

        <div part="viewport" class="viewport">
          <div class="status" role="status" ?hidden=${!showStatus}>
            ${status === 'loading'
              ? this.t('loadingLabel')
              : status === 'error'
                ? this.t('errorLabel')
                : this.t('emptyLabel')}
          </div>

          <div class="virtual-list" role="list">
            ${virtualItems.map((v) => {
              const entry = items[v.index];
              if (!entry) return '';
              return html`
                <div
                  part="row"
                  class="row"
                  role="listitem"
                  tabindex="0"
                  data-row-index=${v.index}
                  @click=${() => this.emitEvent('mth-entry-select', { detail: { entry } })}
                >
                  <span class="severity" data-severity=${entry.severity}>
                    ${this._formatSeverity(entry.severity)}
                  </span>
                  <div class="meta">
                    <span class="summary">${entry.actor} — ${entry.action}</span>
                    <span class="resource">${entry.resource}</span>
                  </div>
                  <time class="timestamp">${this._formatTimestamp(entry.timestamp)}</time>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }
}
